import { Request, Response, NextFunction } from 'express';
import * as accountService from '../services/accountService';
import { AuditAction, logAccountDelete, logAudit } from '../utils/auditService';

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

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = Number(req.user!.userId);
        const summary = await accountService.getAccountSummary(userId);
        res.json(summary);
    } catch (error) {
        next(error);
    }
};

export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const body = req.body as CreateAccountBody;
        const userId = Number(req.user!.userId);

        const account = await accountService.createAccount({ ...body, userId });
        await logAudit({
            userId,
            action: AuditAction.ACCOUNT_CREATE,
            entityType: 'account',
            entityId: account.id,
            newValue: account,
            req
        });
        res.status(201).json(account);
    } catch (error) {
        next(error);
    }
};

export const getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = Number(req.user!.userId);
        const accounts = await accountService.getUserAccounts(userId);
        res.json(accounts);
    } catch (error) {
        next(error);
    }
};

export const updateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = String(req.params.id);
        const body = req.body as UpdateAccountBody;
        const userId = Number(req.user!.userId);

        try {
            const updated = await accountService.updateAccount({
                id: parseInt(id, 10),
                userId,
                ...body
            });
            await logAudit({
                userId,
                action: AuditAction.ACCOUNT_UPDATE,
                entityType: 'account',
                entityId: updated.id,
                newValue: updated,
                req
            });
            res.json(updated);
        } catch (error: any) {
            if (error.message === 'Account not found') {
                res.status(404).json({ error: 'Account not found' });
            } else if (error.message === 'Account currency cannot be changed after financial activity') {
                res.status(409).json({
                    error: error.message,
                    code: 'ACCOUNT_CURRENCY_LOCKED'
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        next(error);
    }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = String(req.params.id);
        const { password } = req.body as { password?: string };
        const userId = Number(req.user!.userId);

        try {
            const account = await accountService.deleteAccount(parseInt(id, 10), userId, password);
            await logAccountDelete(userId, account, req);
            res.json({ message: 'Account deleted' });
        } catch (error: any) {
            if (error.message === 'Password is required') {
                res.status(400).json({ error: error.message, code: 'PASSWORD_REQUIRED' });
            } else if (error.message === 'User not found' || error.message === 'Account not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message === 'Invalid password') {
                res.status(403).json({ error: error.message, code: 'INVALID_PASSWORD' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        next(error);
    }
};
