import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';

interface CreateTemplateBody {
    name: string;
    amount: number;
    description?: string;
    default_account_id?: number | null;
    category_id?: number | null;
    color?: string;
    icon_name?: string;
    type?: 'income' | 'expense';
}

interface UpdateTemplateBody extends Partial<CreateTemplateBody> { }

export const createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body as CreateTemplateBody;
        const userId = req.user!.userId;

        const template = await prisma.template.create({
            data: {
                name,
                amount: toCents(amount),
                description,
                default_account_id: default_account_id || null,
                category_id: category_id || null,
                color,
                icon_name,
                type: type || 'expense',
                user_id: userId
            }
        });
        res.status(201).json({ ...template, amount: fromCents(template.amount) });
    } catch (error) {
        next(error);
    }
};

export const getTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const templates = await prisma.template.findMany({
            where: { user_id: userId },
            include: {
                default_account: { select: { name: true, currency: true } },
                category: { select: { name: true, color: true, icon: true } }
            }
        });
        const templatesWithFloat = templates.map(t => ({ ...t, amount: fromCents(t.amount) }));
        res.json(templatesWithFloat);
    } catch (error) {
        next(error);
    }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body as UpdateTemplateBody;
        const userId = req.user!.userId;

        const template = await prisma.template.update({
            where: { id: parseInt(id), user_id: userId },
            data: {
                name,
                ...(amount !== undefined && { amount: toCents(amount) }),
                description,
                default_account_id: default_account_id !== undefined ? (default_account_id || null) : undefined,
                category_id: category_id !== undefined ? (category_id || null) : undefined,
                color,
                icon_name,
                type: type || 'expense'
            }
        });
        res.json({ ...template, amount: fromCents(template.amount) });
    } catch (error) {
        next(error);
    }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        await prisma.template.delete({
            where: { id: parseInt(id), user_id: userId }
        });
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        next(error);
    }
};
