import { Request, Response, NextFunction } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import type { JwtPayload } from '../types';
import { verifyAccessToken } from '../utils/tokens';

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = cookieToken || bearerToken;

    if (!token) {
        res.status(401).json({ error: 'No access token provided', code: 'AUTH_TOKEN_MISSING' });
        return;
    }

    try {
        const decoded = verifyAccessToken(token) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(401).json({ error: 'Access token expired', code: 'ACCESS_TOKEN_EXPIRED' });
            return;
        }

        res.status(401).json({ error: 'Invalid access token', code: 'ACCESS_TOKEN_INVALID' });
    }
};

export default authMiddleware;
