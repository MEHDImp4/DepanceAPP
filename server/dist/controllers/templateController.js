"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.getTemplates = exports.createTemplate = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const money_1 = require("../utils/money");
const createTemplate = async (req, res, next) => {
    try {
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body;
        const userId = req.user.userId;
        const template = await prisma_1.default.template.create({
            data: {
                name,
                amount: (0, money_1.toCents)(amount),
                description,
                default_account_id: default_account_id || null,
                category_id: category_id || null,
                color,
                icon_name,
                type: type || 'expense',
                user_id: userId
            }
        });
        res.status(201).json({ ...template, amount: (0, money_1.fromCents)(template.amount) });
    }
    catch (error) {
        next(error);
    }
};
exports.createTemplate = createTemplate;
const getTemplates = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const templates = await prisma_1.default.template.findMany({
            where: { user_id: userId },
            include: {
                default_account: { select: { name: true, currency: true } },
                category: { select: { name: true, color: true, icon: true } }
            }
        });
        const templatesWithFloat = templates.map(t => ({ ...t, amount: (0, money_1.fromCents)(t.amount) }));
        res.json(templatesWithFloat);
    }
    catch (error) {
        next(error);
    }
};
exports.getTemplates = getTemplates;
const updateTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body;
        const userId = req.user.userId;
        const template = await prisma_1.default.template.update({
            where: { id: parseInt(id), user_id: userId },
            data: {
                name,
                ...(amount !== undefined && { amount: (0, money_1.toCents)(amount) }),
                description,
                default_account_id: default_account_id !== undefined ? (default_account_id || null) : undefined,
                category_id: category_id !== undefined ? (category_id || null) : undefined,
                color,
                icon_name,
                type: type || 'expense'
            }
        });
        res.json({ ...template, amount: (0, money_1.fromCents)(template.amount) });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await prisma_1.default.template.delete({
            where: { id: parseInt(id), user_id: userId }
        });
        res.json({ message: 'Template deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTemplate = deleteTemplate;
//# sourceMappingURL=templateController.js.map