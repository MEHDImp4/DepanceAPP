import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const errorCodes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR'
};

export const apiContract = (_req: Request, res: Response, next: NextFunction): void => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const sendJson = res.json.bind(res);
    res.json = ((body: unknown) => {
        if (res.statusCode >= 400 && body && typeof body === 'object' && !Array.isArray(body)) {
            const payload = body as Record<string, unknown>;
            return sendJson({
                ...payload,
                code: payload.code ?? errorCodes[res.statusCode] ?? 'REQUEST_FAILED',
                requestId: payload.requestId ?? requestId
            });
        }

        return sendJson(body);
    }) as Response['json'];

    next();
};

export const legacyApiDeprecation = (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', 'Wed, 01 Sep 2027 00:00:00 GMT');
    res.setHeader('Link', '</api/v1>; rel="successor-version"');
    next();
};
