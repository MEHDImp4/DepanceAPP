import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorWithStack extends Error {
    stack?: string;
}

const errorHandler = (
    err: ErrorWithStack,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log error using Winston
    logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });

    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        stack: process.env.NODE_ENV === 'production'
            ? undefined
            : err.stack
    });
};

export default errorHandler;
