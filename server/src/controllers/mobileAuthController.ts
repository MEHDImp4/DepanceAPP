import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { checkAccountLockout, isNewDeviceOrLocation, logFailedLogin, logLogin } from '../utils/loginHistoryService';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens';

const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { identifier, password, deviceId, deviceName } = req.body as {
            identifier: string; password: string; deviceId: string; deviceName: string;
        };
        const user = await prisma.user.findFirst({
            where: { OR: [{ email: identifier }, { username: identifier }] }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const lockout = await checkAccountLockout(user.id);
        if (lockout.isLocked) {
            res.status(429).json({ error: 'Account locked due to too many failed attempts', remainingTime: lockout.remainingTime });
            return;
        }

        if (!await bcrypt.compare(password, user.password_hash)) {
            await logFailedLogin(user.id, req);
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        await logLogin(user.id, req, true);
        const deviceCheck = await isNewDeviceOrLocation(user.id, req);
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user.id);

        await prisma.$transaction([
            prisma.refreshToken.deleteMany({ where: { userId: user.id, clientType: 'mobile', deviceId } }),
            prisma.refreshToken.create({
                data: {
                    token: hashToken(refreshToken), userId: user.id,
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
                    clientType: 'mobile', deviceId, deviceName
                }
            })
        ]);

        res.json({
            tokenType: 'Bearer', accessToken, refreshToken, expiresIn: 900,
            user: { id: user.id, email: user.email, username: user.username, currency: user.currency },
            newDevice: deviceCheck.isNew
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { refreshToken, deviceId } = req.body as { refreshToken: string; deviceId: string };
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }

        const stored = await prisma.refreshToken.findUnique({
            where: { token: hashToken(refreshToken) }, include: { user: true }
        });
        if (!stored || stored.userId !== payload.userId || stored.clientType !== 'mobile' || stored.deviceId !== deviceId) {
            res.status(401).json({ error: 'Invalid or revoked mobile session' });
            return;
        }
        if (stored.expiresAt <= new Date()) {
            await prisma.refreshToken.delete({ where: { id: stored.id } });
            res.status(401).json({ error: 'Refresh token expired' });
            return;
        }

        const nextRefreshToken = signRefreshToken(stored.userId);
        await prisma.$transaction([
            prisma.refreshToken.delete({ where: { id: stored.id } }),
            prisma.refreshToken.create({
                data: {
                    token: hashToken(nextRefreshToken), userId: stored.userId,
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
                    clientType: 'mobile', deviceId, deviceName: stored.deviceName,
                    lastUsedAt: new Date()
                }
            })
        ]);

        res.json({ tokenType: 'Bearer', accessToken: signAccessToken(stored.user), refreshToken: nextRefreshToken, expiresIn: 900 });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { refreshToken, deviceId } = req.body as { refreshToken: string; deviceId: string };
        await prisma.refreshToken.deleteMany({
            where: { token: hashToken(refreshToken), clientType: 'mobile', deviceId }
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const sessions = await prisma.refreshToken.findMany({
            where: { userId: req.user!.userId },
            select: { id: true, clientType: true, deviceId: true, deviceName: true, createdAt: true, lastUsedAt: true, expiresAt: true },
            orderBy: { lastUsedAt: 'desc' }
        });
        res.json(sessions);
    } catch (error) {
        next(error);
    }
};

export const revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const result = await prisma.refreshToken.deleteMany({
            where: { id: sessionId, userId: req.user!.userId }
        });
        if (!result.count) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
