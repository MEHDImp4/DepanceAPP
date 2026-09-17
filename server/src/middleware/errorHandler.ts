import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorWithStack extends Error {
    stack?: string;
    statusCode?: number;
    code?: string;
}

const errorHandler = (
    err: ErrorWithStack,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

    logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack, code: err.code });

    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? (statusCode >= 500 ? 'An unexpected error occurred' : err.message)
            : err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'production'
            ? undefined
            : err.stack
    });
};

export default errorHandler;
