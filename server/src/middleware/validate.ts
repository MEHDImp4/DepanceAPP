import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface RequestData {
    body: unknown;
    query: unknown;
    params: unknown;
}

const validate = (schema: ZodSchema<unknown>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const data: RequestData = {
            body: req.body,
            query: req.query,
            params: req.params,
        };

        const result = schema.safeParse(data);

        if (!result.success) {
            const zodError = result.error as ZodError;
            const errors = zodError.issues || [];
            const errorMessage = errors.length > 0
                ? errors.map(e => e.message).join(', ')
                : 'Validation failed';

            res.status(400).json({ error: errorMessage });
            return;
        }

        next();
    };
};

export default validate;
