import { Request, Response, NextFunction } from 'express';
interface UpdateAccountBody {
    name?: string;
    type?: string;
    currency?: string;
}
interface IdParams {
    id: string;
}
export declare const getSummary: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createAccount: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAccounts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateAccount: (req: Request<IdParams, unknown, UpdateAccountBody>, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteAccount: (req: Request<IdParams>, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=accountController.d.ts.map