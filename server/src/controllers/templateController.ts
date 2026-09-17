import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { assertCurrencyAmount, toCents, fromCents } from '../utils/money';
import { AuditAction, createAuditEntry } from '../utils/auditService';

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

const getOwnedAccount = async (accountId: number | null | undefined, userId: number) => {
    if (!accountId) return null;
    const account = await prisma.account.findFirst({ where: { id: accountId, user_id: userId } });
    if (!account) {
        throw Object.assign(new Error('Invalid account or access denied'), {
            statusCode: 403,
            code: 'RESOURCE_ACCESS_DENIED'
        });
    }
    return account;
};

const validateCategoryType = async (
    categoryId: number | null | undefined,
    userId: number,
    type: 'income' | 'expense'
) => {
    if (!categoryId) return;
    const category = await prisma.category.findFirst({ where: { id: categoryId, user_id: userId } });
    if (!category) {
        throw Object.assign(new Error('Invalid category or access denied'), {
            statusCode: 403,
            code: 'CATEGORY_ACCESS_DENIED'
        });
    }
    if (category.type !== type) {
        throw Object.assign(new Error(`A ${type} template requires a ${type} category`), {
            statusCode: 409,
            code: 'CATEGORY_TYPE_MISMATCH'
        });
    }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body as CreateTemplateBody;
        const userId = req.user!.userId;
        const templateType = type || 'expense';

        const [defaultAccount] = await Promise.all([
            getOwnedAccount(default_account_id, userId),
            validateCategoryType(category_id, userId, templateType)
        ]);
        if (defaultAccount) assertCurrencyAmount(amount, defaultAccount.currency);

        const template = await prisma.$transaction(async database => {
            const created = await database.template.create({
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
            await createAuditEntry(database, {
                userId,
                action: AuditAction.TEMPLATE_CREATE,
                entityType: 'template',
                entityId: created.id,
                newValue: created,
                req
            });
            return created;
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
        const effectiveAccountId = default_account_id !== undefined ? default_account_id : existing.default_account_id;

        const [defaultAccount] = await Promise.all([
            getOwnedAccount(effectiveAccountId, userId),
            validateCategoryType(effectiveCategoryId, userId, effectiveType)
        ]);
        if (amount !== undefined && defaultAccount) assertCurrencyAmount(amount, defaultAccount.currency);

        const template = await prisma.$transaction(async database => {
            const updated = await database.template.update({
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
            await createAuditEntry(database, {
                userId,
                action: AuditAction.TEMPLATE_UPDATE,
                entityType: 'template',
                entityId: templateId,
                oldValue: existing,
                newValue: updated,
                req
            });
            return updated;
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

        await prisma.$transaction(async database => {
            await database.template.delete({ where: { id: templateId } });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.TEMPLATE_DELETE,
                entityType: 'template',
                entityId: templateId,
                oldValue: existing,
                req
            });
        });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        next(error);
    }
};
