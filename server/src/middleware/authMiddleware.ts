import { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from '../types';
import { verifyAccessToken } from '../utils/tokens';

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    const token = cookieToken || bearerToken;

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    try {
        const decoded = verifyAccessToken(token) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
};

export default authMiddleware;
