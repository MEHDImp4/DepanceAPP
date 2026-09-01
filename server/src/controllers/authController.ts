import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens';

const BCRYPT_SALT_ROUNDS = 10;
const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_MS = 15 * 60 * 1000;

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, username, password } = req.body as { email: string; username: string; password: string };
        console.log(`[AUTH-DEBUG] Register attempt for email: ${email}, username: ${username}`);

        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            console.log(`[AUTH-DEBUG] Registration failed: Email ${email} already exists`);
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
            console.log(`[AUTH-DEBUG] Registration failed: Username ${username} already taken`);
            res.status(400).json({ error: 'Username already taken' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
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

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_MS
        });

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_MS
        });

        res.status(201).json({
            message: 'Account created successfully',
            userId: user.id,
            user: { id: user.id, email: user.email, username: user.username },
            token: accessToken
        });
    } catch (error) {
        next(error);
    }
};

import { getRecentCriticalActions } from '../utils/auditService';
import { checkAccountLockout, logLogin, logFailedLogin, getLoginHistory as getHistory, detectSuspiciousActivity, isNewDeviceOrLocation } from '../utils/loginHistoryService';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { identifier, password } = req.body as { identifier: string; password: string };
        console.log(`[AUTH-DEBUG] Login attempt for identifier: ${identifier}`);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            // Log generic failed attempt (using 0 or null as userId might be tricky if not found, usually skip or log as unknown)
            // Ideally we log by IP if user not found, but service expects userId.
            console.log(`[AUTH-DEBUG] Login failed: User not found for identifier: ${identifier}`);
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check for account lockout
        const lockoutStatus = await checkAccountLockout(user.id);
        if (lockoutStatus.isLocked) {
            res.status(429).json({
                error: 'Account locked due to too many failed attempts',
                remainingTime: lockoutStatus.remainingTime
            });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            await logFailedLogin(user.id, req);
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Log successful login
        await logLogin(user.id, req, true);

        // Check for new device
        const deviceCheck = await isNewDeviceOrLocation(user.id, req);

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: {
                token: hashToken(refreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS)
            }
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_MS
        });

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_MS
        });

        res.json({
            user: { id: user.id, email: user.email, username: user.username, currency: user.currency },
            newDevice: deviceCheck.isNew,
            token: accessToken
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
        const updated = await prisma.user.update({
            where: { id: req.user!.userId },
            data: { currency }
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
            await logFailedLogin(user.id, req); // Optional: log this as a suspicious event?
            res.status(400).json({ error: 'Incorrect old password' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        await prisma.user.update({
            where: { id: user.id },
            data: { password_hash: hashedPassword }
        });

        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        res.clearCookie('refreshToken');
        res.clearCookie('token');

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken as string | undefined;
        if (!refreshTokenValue) {
            res.status(401).json({ error: 'Refresh token required' });
            return;
        }

        try {
            verifyRefreshToken(refreshTokenValue);
        } catch {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }

        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: hashToken(refreshTokenValue) },
            include: { user: true }
        });

        if (!storedToken) {
            res.status(401).json({ error: 'Invalid or revoked refresh token' });
            return;
        }

        if (new Date() > storedToken.expiresAt) {
            await prisma.refreshToken.delete({ where: { token: hashToken(refreshTokenValue) } });
            res.status(401).json({ error: 'Refresh token expired' });
            return;
        }

        // Rolling Refresh Token: Delete old one and issue a NEW one
        await prisma.refreshToken.delete({ where: { token: hashToken(refreshTokenValue) } });

        const user = storedToken.user;

        // precise rotation: create new refresh token
        const newRefreshToken = signRefreshToken(user.id);

        // Issue new Access Token
        const newAccessToken = signAccessToken(user);

        // Save new Refresh Token
        await prisma.refreshToken.create({
            data: {
                token: hashToken(newRefreshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS)
            }
        });

        // Set Cookies
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_MS
        });

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_MS
        });

        res.json({ 
            message: 'Token refreshed',
            token: newAccessToken
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken as string | undefined;
        if (refreshTokenValue) {
            await prisma.refreshToken.delete({
                where: { token: hashToken(refreshTokenValue) }
            }).catch(() => {
                // Ignore if already deleted or not found
            });
        }

        res.clearCookie('refreshToken');
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};
