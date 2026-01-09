const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { user_id: req.user.userId },
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, type, color, icon } = req.body;

        // Check if category already exists for user
        const existing = await prisma.category.findFirst({
            where: {
                name,
                type,
                user_id: req.user.userId
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Category already exists' });
        }

        const category = await prisma.category.create({
            data: {
                name,
                type,
                color,
                icon,
                user_id: req.user.userId,
            },
        });
        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, color, icon } = req.body;
        const category = await prisma.category.updateMany({
            where: { id: parseInt(id), user_id: req.user.userId },
            data: { name, type, color, icon },
        });
        if (category.count === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) }
        });

        if (!category || category.user_id !== req.user.userId) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Transactions related to this category?
        // Let's update them to null first or allow user to reassign.
        // For simple implementation, let's just set them to null.
        await prisma.transaction.updateMany({
            where: { category_id: parseInt(id) },
            data: { category_id: null }
        });

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
