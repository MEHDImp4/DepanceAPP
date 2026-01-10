import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

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
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, type, color, icon } = req.body as CreateCategoryBody;

        const existing = await prisma.category.findFirst({
            where: {
                name,
                type,
                user_id: req.user!.userId
            }
        });

        if (existing) {
            res.status(400).json({ error: 'Category already exists' });
            return;
        }

        const category = await prisma.category.create({
            data: {
                name,
                type,
                color,
                icon,
                user_id: req.user!.userId,
            },
        });
        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, type, color, icon } = req.body as UpdateCategoryBody;

        const result = await prisma.category.updateMany({
            where: { id: parseInt(id), user_id: req.user!.userId },
            data: { name, type, color, icon },
        });

        if (result.count === 0) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) }
        });

        if (!category || category.user_id !== req.user!.userId) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }

        // Set category_id to null for related transactions
        await prisma.transaction.updateMany({
            where: { category_id: parseInt(id) },
            data: { category_id: null }
        });

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Category deleted' });
    } catch (error) {
        next(error);
    }
};
