"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getCategories = async (req, res, next) => {
    try {
        const categories = await prisma_1.default.category.findMany({
            where: { user_id: req.user.userId },
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res, next) => {
    try {
        const { name, type, color, icon } = req.body;
        const existing = await prisma_1.default.category.findFirst({
            where: {
                name,
                type,
                user_id: req.user.userId
            }
        });
        if (existing) {
            res.status(400).json({ error: 'Category already exists' });
            return;
        }
        const category = await prisma_1.default.category.create({
            data: {
                name,
                type,
                color,
                icon,
                user_id: req.user.userId,
            },
        });
        res.status(201).json(category);
    }
    catch (error) {
        next(error);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, type, color, icon } = req.body;
        const result = await prisma_1.default.category.updateMany({
            where: { id: parseInt(id), user_id: req.user.userId },
            data: { name, type, color, icon },
        });
        if (result.count === 0) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        res.json({ message: 'Category updated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await prisma_1.default.category.findUnique({
            where: { id: parseInt(id) }
        });
        if (!category || category.user_id !== req.user.userId) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        // Set category_id to null for related transactions
        await prisma_1.default.transaction.updateMany({
            where: { category_id: parseInt(id) },
            data: { category_id: null }
        });
        await prisma_1.default.category.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Category deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categoryController.js.map