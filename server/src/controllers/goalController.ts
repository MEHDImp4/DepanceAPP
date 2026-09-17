import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { assertCurrencyAmount, toCents, fromCents } from '../utils/money';
import { AuditAction, createAuditEntry } from '../utils/auditService';

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
        const userId = req.user!.userId;
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { currency: true } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const currency = user.currency.toUpperCase();
        assertCurrencyAmount(targetAmount, currency);
        assertCurrencyAmount(currentAmount ?? 0, currency, { allowZero: true });

        const goal = await prisma.$transaction(async database => {
            const created = await database.goal.create({
                data: {
                    name,
                    targetAmount: toCents(targetAmount),
                    currentAmount: toCents(currentAmount ?? 0),
                    currency,
                    deadline: deadline ? new Date(deadline) : null,
                    color,
                    icon,
                    user_id: userId
                }
            });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.GOAL_CREATE,
                entityType: 'goal',
                entityId: created.id,
                newValue: created,
                req
            });
            return created;
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
        const userId = req.user!.userId;
        const goalId = parseInt(id as string, 10);

        const existing = await prisma.goal.findFirst({ where: { id: goalId, user_id: userId } });
        if (!existing) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        if (targetAmount !== undefined) assertCurrencyAmount(targetAmount, existing.currency);
        if (currentAmount !== undefined) assertCurrencyAmount(currentAmount, existing.currency, { allowZero: true });

        const updated = await prisma.$transaction(async database => {
            const saved = await database.goal.update({
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
            await createAuditEntry(database, {
                userId,
                action: AuditAction.GOAL_UPDATE,
                entityType: 'goal',
                entityId: goalId,
                oldValue: existing,
                newValue: saved,
                req
            });
            return saved;
        });

        res.json(serializeGoal(updated));
    } catch (error) {
        next(error);
    }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const goalId = parseInt(id as string, 10);

        const goal = await prisma.goal.findFirst({ where: { id: goalId, user_id: userId } });
        if (!goal) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        await prisma.$transaction(async database => {
            await database.goal.delete({ where: { id: goalId } });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.GOAL_DELETE,
                entityType: 'goal',
                entityId: goalId,
                oldValue: goal,
                req
            });
        });

        res.json({ message: 'Goal deleted' });
    } catch (error) {
        next(error);
    }
};
