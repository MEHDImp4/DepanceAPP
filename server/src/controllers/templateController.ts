import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';
import { assertOwnedAccount } from '../utils/ownership';

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

const validateCategoryType = async (
    categoryId: number | null | undefined,
    userId: number,
    type: 'income' | 'expense'
) => {
    if (!categoryId) return;
    const category = await prisma.category.findFirst({ where: { id: categoryId, user_id: userId } });
    if (!category) {
        const error = new Error('Invalid category or access denied');
        Object.assign(error, { statusCode: 403, code: 'CATEGORY_ACCESS_DENIED' });
        throw error;
    }
    if (category.type !== type) {
        const error = new Error(`A ${type} template requires a ${type} category`);
        Object.assign(error, { statusCode: 409, code: 'CATEGORY_TYPE_MISMATCH' });
        throw error;
    }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body as CreateTemplateBody;
        const userId = req.user!.userId;
        const templateType = type || 'expense';

        await Promise.all([
            assertOwnedAccount(default_account_id, userId),
            validateCategoryType(category_id, userId, templateType)
        ]);

        const template = await prisma.template.create({
            data: {
                name,
                amount: toCents(amount),
                description,
                default_account_id: default_account_id || null,
                category_id: category_id || null,
                color,
                icon_name,
                type: templateType,
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
        res.json(templates.map(t => ({ ...t, amount: fromCents(t.amount) })));
    } catch (error) {
        next(error);
    }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body as UpdateTemplateBody;
        const userId = req.user!.userId;
        const templateId = parseInt(id as string, 10);

        const existing = await prisma.template.findFirst({ where: { id: templateId, user_id: userId } });
        if (!existing) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        const effectiveType = (type || existing.type) as 'income' | 'expense';
        const effectiveCategoryId = category_id !== undefined ? category_id : existing.category_id;

        await Promise.all([
            assertOwnedAccount(default_account_id, userId),
            validateCategoryType(effectiveCategoryId, userId, effectiveType)
        ]);

        const template = await prisma.template.update({
            where: { id: templateId },
            data: {
                name,
                ...(amount !== undefined && { amount: toCents(amount) }),
                description,
                default_account_id: default_account_id !== undefined ? (default_account_id || null) : undefined,
                category_id: category_id !== undefined ? (category_id || null) : undefined,
                color,
                icon_name,
                ...(type !== undefined && { type })
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
        const templateId = parseInt(id as string, 10);
        const existing = await prisma.template.findFirst({ where: { id: templateId, user_id: userId } });
        if (!existing) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }
        await prisma.template.delete({ where: { id: templateId } });
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        next(error);
    }
};
