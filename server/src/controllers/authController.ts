import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens';
import { AuditAction, getUserAuditLogs, logAudit } from '../utils/auditService';
import {
    checkAccountLockout,
    logLogin,
    logFailedLogin,
    getLoginHistory as getHistory,
    detectSuspiciousActivity,
    isNewDeviceOrLocation
} from '../utils/loginHistoryService';

const BCRYPT_SALT_ROUNDS = 10;
const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_MS = 15 * 60 * 1000;

const cookieBaseOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/'
});

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie('refreshToken', refreshToken, {
        ...cookieBaseOptions(),
        maxAge: REFRESH_TOKEN_MS
    });
    res.cookie('token', accessToken, {
        ...cookieBaseOptions(),
        maxAge: ACCESS_TOKEN_MS
    });
};

const clearAuthCookies = (res: Response) => {
    res.clearCookie('refreshToken', cookieBaseOptions());
    res.clearCookie('token', cookieBaseOptions());
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const body = req.body as { email: string; username: string; password: string };
        const email = body.email.trim().toLowerCase();
        const username = body.username.trim();

        const [existingEmail, existingUsername] = await Promise.all([
            prisma.user.findUnique({ where: { email } }),
            prisma.user.findUnique({ where: { username } })
        ]);

        if (existingEmail) {
            res.status(409).json({ error: 'Email already registered', code: 'EMAIL_ALREADY_REGISTERED' });
            return;
        }
        if (existingUsername) {
            res.status(409).json({ error: 'Username already taken', code: 'USERNAME_ALREADY_TAKEN' });
            return;
        }

        const hashedPassword = await bcrypt.hash(body.password, BCRYPT_SALT_ROUNDS);
        const user = await prisma.user.create({
            data: { email, username, password_hash: hashedPassword }
        });

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: {
                token: hashToken(refreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS)
            }
        });

        setAuthCookies(res, accessToken, refreshToken);
        res.status(201).json({
            message: 'Account created successfully',
            userId: user.id,
            user: { id: user.id, email: user.email, username: user.username, currency: user.currency }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ error: 'Account identifier already exists', code: 'ACCOUNT_CONFLICT' });
            return;
        }
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const body = req.body as { identifier: string; password: string };
        const identifier = body.identifier.trim();
        const emailIdentifier = identifier.includes('@') ? identifier.toLowerCase() : identifier;

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailIdentifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
            return;
        }

        const lockoutStatus = await checkAccountLockout(user.id);
        if (lockoutStatus.isLocked) {
            res.status(429).json({
                error: 'Account temporarily locked due to repeated failed attempts',
                code: 'ACCOUNT_TEMPORARILY_LOCKED',
                remainingTime: lockoutStatus.remainingTime
            });
            return;
        }

        const isValid = await bcrypt.compare(body.password, user.password_hash);
        if (!isValid) {
            await logFailedLogin(user.id, req);
            res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
            return;
        }

        const deviceCheck = await isNewDeviceOrLocation(user.id, req);
        await logLogin(user.id, req, true);

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: {
                token: hashToken(refreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS)
            }
        });

        setAuthCookies(res, accessToken, refreshToken);
        res.json({
            user: { id: user.id, email: user.email, username: user.username, currency: user.currency },
            newDevice: deviceCheck.isNew
        });
    } catch (error) {
        next(error);
    }
};

export const getLoginHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const history = await getHistory(req.user!.userId);
        res.json(history);
    } catch (error) {
        next(error);
    }
};

export const getSecurityAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const alerts = await detectSuspiciousActivity(req.user!.userId);
        res.json(alerts);
    } catch (error) {
        next(error);
    }
};

export const getAuditLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const limit = Number.parseInt(String(req.query.limit || '50'), 10) || 50;
        const offset = Number.parseInt(String(req.query.offset || '0'), 10) || 0;
        const action = typeof req.query.action === 'string' ? req.query.action : null;
        const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : null;
        const logs = await getUserAuditLogs(req.user!.userId, { limit, offset, action, entityType });
        res.json(logs);
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ id: user.id, email: user.email, username: user.username, currency: user.currency });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { currency } = req.body as { currency: string };
        const userId = req.user!.userId;
        const previous = await prisma.user.findUnique({ where: { id: userId } });
        if (!previous) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { currency: currency.toUpperCase() }
        });

        await logAudit({
            userId,
            action: AuditAction.SETTINGS_UPDATE,
            entityType: 'user-settings',
            entityId: userId,
            oldValue: { currency: previous.currency },
            newValue: { currency: updated.currency },
            req
        });

        res.json({ id: updated.id, email: updated.email, username: updated.username, currency: updated.currency });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const isValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isValid) {
            res.status(400).json({ error: 'Incorrect old password', code: 'INVALID_PASSWORD' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { password_hash: hashedPassword }
            }),
            prisma.refreshToken.deleteMany({ where: { userId: user.id } })
        ]);

        clearAuthCookies(res);
        await logAudit({
            userId: user.id,
            action: AuditAction.PASSWORD_CHANGE,
            entityType: 'user',
            entityId: user.id,
            req
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken as string | undefined;
        if (!refreshTokenValue) {
            res.status(401).json({ error: 'Refresh token required', code: 'REFRESH_TOKEN_MISSING' });
            return;
        }

        try {
            verifyRefreshToken(refreshTokenValue);
        } catch {
            clearAuthCookies(res);
            res.status(401).json({ error: 'Invalid refresh token', code: 'REFRESH_TOKEN_INVALID' });
            return;
        }

        const tokenHash = hashToken(refreshTokenValue);
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: tokenHash },
            include: { user: true }
        });

        if (!storedToken) {
            clearAuthCookies(res);
            res.status(401).json({ error: 'Invalid or revoked refresh token', code: 'REFRESH_TOKEN_REVOKED' });
            return;
        }

        if (new Date() > storedToken.expiresAt) {
            await prisma.refreshToken.delete({ where: { token: tokenHash } }).catch(() => undefined);
            clearAuthCookies(res);
            res.status(401).json({ error: 'Refresh token expired', code: 'REFRESH_TOKEN_EXPIRED' });
            return;
        }

        const user = storedToken.user;
        const newRefreshToken = signRefreshToken(user.id);
        const newAccessToken = signAccessToken(user);

        await prisma.$transaction(async database => {
            const deleted = await database.refreshToken.deleteMany({ where: { token: tokenHash } });
            if (deleted.count !== 1) {
                throw new Error('Refresh token was already rotated');
            }
            await database.refreshToken.create({
                data: {
                    token: hashToken(newRefreshToken),
                    userId: user.id,
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS)
                }
            });
        });

        setAuthCookies(res, newAccessToken, newRefreshToken);
        res.json({ message: 'Token refreshed' });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken as string | undefined;
        if (refreshTokenValue) {
            await prisma.refreshToken.deleteMany({
                where: { token: hashToken(refreshTokenValue) }
            });
        }

        clearAuthCookies(res);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};
