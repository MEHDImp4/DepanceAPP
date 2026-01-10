import { Request, Response, NextFunction } from 'express';
interface ErrorWithStack extends Error {
    stack?: string;
}
declare const errorHandler: (err: ErrorWithStack, req: Request, res: Response, _next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map