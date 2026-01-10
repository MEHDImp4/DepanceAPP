import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import type { JwtPayload } from '../types';

const BCRYPT_SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_MS = 15 * 60 * 1000;

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, username, password } = req.body as { email: string; username: string; password: string };

        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
            res.status(400).json({ error: 'Username already taken' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await prisma.user.create({
            data: { email, username, password_hash: hashedPassword }
        });

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email } as JwtPayload,
            process.env.JWT_SECRET!,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        const refreshToken = jwt.sign(
            { userId: user.id } as Partial<JwtPayload>,
            process.env.JWT_SECRET!,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
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
            user: { id: user.id, email: user.email, username: user.username }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { identifier, password } = req.body as { identifier: string; password: string };

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email } as JwtPayload,
            process.env.JWT_SECRET!,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        const refreshToken = jwt.sign(
            { userId: user.id } as Partial<JwtPayload>,
            process.env.JWT_SECRET!,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
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
            user: { id: user.id, email: user.email, username: user.username, currency: user.currency }
        });
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

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken as string | undefined;
        if (!refreshTokenValue) {
            res.status(401).json({ error: 'Refresh token required' });
            return;
        }

        try {
            jwt.verify(refreshTokenValue, process.env.JWT_SECRET!);
        } catch {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }

        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshTokenValue },
            include: { user: true }
        });

        if (!storedToken) {
            res.status(401).json({ error: 'Invalid or revoked refresh token' });
            return;
        }

        if (new Date() > storedToken.expiresAt) {
            await prisma.refreshToken.delete({ where: { token: refreshTokenValue } });
            res.status(401).json({ error: 'Refresh token expired' });
            return;
        }

        const user = storedToken.user;
        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email } as JwtPayload,
            process.env.JWT_SECRET!,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_MS
        });

        res.json({ message: 'Token refreshed' });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken as string | undefined;
        if (refreshTokenValue) {
            await prisma.refreshToken.delete({
                where: { token: refreshTokenValue }
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
