import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AuditAction, createAuditEntry } from '../utils/auditService';

interface CreateCategoryBody {
    name: string;
    type: 'income' | 'expense';
    color?: string;
    icon?: string;
}

interface UpdateCategoryBody {
    name?: string;
    type?: 'income' | 'expense';
    color?: string;
    icon?: string;
}

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            where: { user_id: req.user!.userId },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, type, color, icon } = req.body as CreateCategoryBody;
        const userId = req.user!.userId;

        const category = await prisma.$transaction(async database => {
            const created = await database.category.create({
                data: { name, type, color, icon, user_id: userId }
            });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.CATEGORY_CREATE,
                entityType: 'category',
                entityId: created.id,
                newValue: created,
                req
            });
            return created;
        });

        res.status(201).json(category);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ error: 'Category already exists' });
            return;
        }
        next(error);
    }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, type, color, icon } = req.body as UpdateCategoryBody;
        const userId = req.user!.userId;
        const categoryId = parseInt(id as string, 10);

        const existing = await prisma.category.findFirst({ where: { id: categoryId, user_id: userId } });
        if (!existing) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        if (type && type !== existing.type) {
            const [transactionCount, templateCount, recurringCount, budgetCount] = await Promise.all([
                prisma.transaction.count({ where: { category_id: categoryId, user_id: userId } }),
                prisma.template.count({ where: { category_id: categoryId, user_id: userId } }),
                prisma.recurringTransaction.count({ where: { category_id: categoryId, user_id: userId } }),
                prisma.budget.count({ where: { category_id: categoryId, user_id: userId } })
            ]);

            if (transactionCount + templateCount + recurringCount + budgetCount > 0) {
                res.status(409).json({
                    error: 'Category type cannot be changed while the category is in use',
                    code: 'CATEGORY_TYPE_LOCKED'
                });
                return;
            }
        }

        const updated = await prisma.$transaction(async database => {
            const saved = await database.category.update({
                where: { id: categoryId },
                data: { name, type, color, icon }
            });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.CATEGORY_UPDATE,
                entityType: 'category',
                entityId: categoryId,
                oldValue: existing,
                newValue: saved,
                req
            });
            return saved;
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ error: 'Category already exists' });
            return;
        }
        next(error);
    }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const categoryId = parseInt(id as string, 10);

        const category = await prisma.category.findFirst({ where: { id: categoryId, user_id: userId } });
        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        await prisma.$transaction(async database => {
            await database.transaction.updateMany({
                where: { category_id: categoryId, user_id: userId },
                data: { category_id: null }
            });
            await database.budget.deleteMany({
                where: { category_id: categoryId, user_id: userId }
            });
            await database.recurringTransaction.updateMany({
                where: { category_id: categoryId, user_id: userId },
                data: { category_id: null }
            });
            await database.template.updateMany({
                where: { category_id: categoryId, user_id: userId },
                data: { category_id: null }
            });
            await database.category.delete({ where: { id: categoryId } });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.CATEGORY_DELETE,
                entityType: 'category',
                entityId: categoryId,
                oldValue: category,
                req
            });
        });

        res.json({ message: 'Category deleted' });
    } catch (error) {
        next(error);
    }
};
