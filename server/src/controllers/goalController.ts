import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';

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

const serializeGoal = <T extends { targetAmount: number; currentAmount: number }>(goal: T) => ({
    ...goal,
    targetAmount: fromCents(goal.targetAmount),
    currentAmount: fromCents(goal.currentAmount)
});

export const getGoals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const goals = await prisma.goal.findMany({
            where: { user_id: req.user!.userId },
            orderBy: { created_at: 'desc' }
        });
        res.json(goals.map(serializeGoal));
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
                targetAmount: toCents(targetAmount),
                currentAmount: toCents(currentAmount ?? 0),
                deadline: deadline ? new Date(deadline) : null,
                color,
                icon,
                user_id: req.user!.userId
            }
        });
        res.status(201).json(serializeGoal(goal));
    } catch (error) {
        next(error);
    }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, targetAmount, currentAmount, deadline, color, icon } = req.body as UpdateGoalBody;
        const goalId = parseInt(id as string, 10);

        const existing = await prisma.goal.findFirst({
            where: { id: goalId, user_id: req.user!.userId }
        });
        if (!existing) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        const updated = await prisma.goal.update({
            where: { id: goalId },
            data: {
                name,
                color,
                icon,
                ...(targetAmount !== undefined && { targetAmount: toCents(targetAmount) }),
                ...(currentAmount !== undefined && { currentAmount: toCents(currentAmount) }),
                ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null })
            }
        });

        res.json(serializeGoal(updated));
    } catch (error) {
        next(error);
    }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const goalId = parseInt(id as string, 10);

        const goal = await prisma.goal.findFirst({
            where: { id: goalId, user_id: req.user!.userId }
        });

        if (!goal) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        await prisma.goal.delete({ where: { id: goalId } });
        res.json({ message: 'Goal deleted' });
    } catch (error) {
        next(error);
    }
};
