"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoal = exports.updateGoal = exports.createGoal = exports.getGoals = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getGoals = async (req, res, next) => {
    try {
        const goals = await prisma_1.default.goal.findMany({
            where: { user_id: req.user.userId },
            orderBy: { created_at: 'desc' },
        });
        res.json(goals);
    }
    catch (error) {
        next(error);
    }
};
exports.getGoals = getGoals;
const createGoal = async (req, res, next) => {
    try {
        const { name, targetAmount, currentAmount, deadline, color, icon } = req.body;
        const goal = await prisma_1.default.goal.create({
            data: {
                name,
                targetAmount: Math.round(targetAmount),
                currentAmount: currentAmount ? Math.round(currentAmount) : 0,
                deadline: deadline ? new Date(deadline) : null,
                color,
                icon,
                user_id: req.user.userId,
            },
        });
        res.status(201).json(goal);
    }
    catch (error) {
        next(error);
    }
};
exports.createGoal = createGoal;
const updateGoal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, targetAmount, currentAmount, deadline, color, icon } = req.body;
        const dataToUpdate = { name, color, icon };
        if (targetAmount !== undefined)
            dataToUpdate.targetAmount = Math.round(targetAmount);
        if (currentAmount !== undefined)
            dataToUpdate.currentAmount = Math.round(currentAmount);
        if (deadline !== undefined) {
            dataToUpdate.deadline = deadline ? new Date(deadline) : null;
        }
        const result = await prisma_1.default.goal.updateMany({
            where: { id: parseInt(id), user_id: req.user.userId },
            data: dataToUpdate,
        });
        if (result.count === 0) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }
        res.json({ message: 'Goal updated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateGoal = updateGoal;
const deleteGoal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const goal = await prisma_1.default.goal.findUnique({
            where: { id: parseInt(id) }
        });
        if (!goal || goal.user_id !== req.user.userId) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }
        await prisma_1.default.goal.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Goal deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGoal = deleteGoal;
//# sourceMappingURL=goalController.js.map