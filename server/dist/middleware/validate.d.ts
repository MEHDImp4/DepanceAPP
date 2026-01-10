import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
declare const validate: (schema: ZodSchema<unknown>) => (req: Request, res: Response, next: NextFunction) => void;
export default validate;
//# sourceMappingURL=validate.d.ts.map