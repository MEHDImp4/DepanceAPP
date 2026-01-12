import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

interface CreateGoalBody {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: string;
    color?: string;
    icon?: string;
}

interface UpdateGoalBody {
    name?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: string | null;
    color?: string;
    icon?: string;
}

export const getGoals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const goals = await prisma.goal.findMany({
            where: { user_id: req.user!.userId },
            orderBy: { created_at: 'desc' },
        });
        res.json(goals);
    } catch (error) {
        next(error);
    }
};

export const createGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, targetAmount, currentAmount, deadline, color, icon } = req.body as CreateGoalBody;

        const goal = await prisma.goal.create({
            data: {
                name,
                targetAmount: Math.round(targetAmount),
                currentAmount: currentAmount ? Math.round(currentAmount) : 0,
                deadline: deadline ? new Date(deadline) : null,
                color,
                icon,
                user_id: req.user!.userId,
            },
        });
        res.status(201).json(goal);
    } catch (error) {
        next(error);
    }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, targetAmount, currentAmount, deadline, color, icon } = req.body as UpdateGoalBody;

        const dataToUpdate: any = { name, color, icon };
        if (targetAmount !== undefined) dataToUpdate.targetAmount = Math.round(targetAmount);
        if (currentAmount !== undefined) dataToUpdate.currentAmount = Math.round(currentAmount);

        if (deadline !== undefined) {
            dataToUpdate.deadline = deadline ? new Date(deadline) : null;
        }

        const result = await prisma.goal.updateMany({
            where: { id: parseInt(id as string), user_id: req.user!.userId },
            data: dataToUpdate,
        });

        if (result.count === 0) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }
        res.json({ message: 'Goal updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const goal = await prisma.goal.findUnique({
            where: { id: parseInt(id as string) }
        });

        if (!goal || goal.user_id !== req.user!.userId) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        await prisma.goal.delete({
            where: { id: parseInt(id as string) }
        });

        res.json({ message: 'Goal deleted' });
    } catch (error) {
        next(error);
    }
};
