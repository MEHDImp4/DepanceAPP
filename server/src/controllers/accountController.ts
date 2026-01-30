import { Request, Response, NextFunction } from 'express';
import * as accountService from '../services/accountService';

interface CreateAccountBody {
    name: string;
    type?: string;
    balance?: number;
    currency?: string;
    color?: string;
}

interface UpdateAccountBody {
    name?: string;
    type?: string;
    currency?: string;
}

interface IdParams {
    id: string;
}

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = parseInt(String(req.user!.userId));
        const summary = await accountService.getAccountSummary(userId);
        res.json(summary);
    } catch (error) {
        next(error);
    }
};

export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const body = req.body as CreateAccountBody;
        const userId = parseInt(String(req.user!.userId));

        const account = await accountService.createAccount({ ...body, userId });
        res.status(201).json(account);
    } catch (error) {
        next(error);
    }
};

export const getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = parseInt(String(req.user!.userId));
        const accounts = await accountService.getUserAccounts(userId);
        res.json(accounts);
    } catch (error) {
        next(error);
    }
};

export const updateAccount = async (req: Request<IdParams, unknown, UpdateAccountBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const body = req.body as UpdateAccountBody;
        const userId = parseInt(String(req.user!.userId));

        try {
            const updated = await accountService.updateAccount({
                id: parseInt(id),
                userId,
                ...body
            });
            res.json(updated);
        } catch (error: any) {
            if (error.message === 'Account not found') {
                res.status(404).json({ error: 'Account not found' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        next(error);
    }
};

export const deleteAccount = async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const userId = parseInt(String(req.user!.userId)); // Ensure number

        try {
            await accountService.deleteAccount(parseInt(id), userId, password);
            res.json({ message: 'Account deleted' });
        } catch (error: any) {
            if (error.message === 'Password is required') {
                res.status(400).json({ error: error.message });
            } else if (error.message === 'User not found' || error.message === 'Account not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message === 'Invalid password') {
                res.status(401).json({ error: error.message });
            } else {
                throw error;
            }
        }
    } catch (error) {
        next(error);
    }
};
