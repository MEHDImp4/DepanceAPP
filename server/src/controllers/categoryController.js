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
        res.status(500).json({ error: 'Error fetching categories' });
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
        res.status(500).json({ error: 'Error creating category' });
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
        res.status(500).json({ error: 'Error updating category' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // Optional: Check if used in transactions before delete? 
        // Prisma cascade delete on User is set, but what about Transactions?
        // In schema: `category Category? @relation...`
        // If we delete category, `category_id` in transaction should probably be set to null or restrict.
        // Currently schema doesn't specify onDelete for Category relation in Transaction! 
        // Default is usually restrictive or failure.
        // Ideally we update transactions to have null category.

        // Let's use delete and handle potential error or update dependencies.
        // Since category_id is optional, we could set it to null.
        // But for now let's just create the delete method.

        const category = await prisma.category.delete({
            where: { id: parseInt(id) }, // logic needs to ensure it belongs to user
        });

        // Wait, delete by ID alone is risky if we don't check user_id. 
        // Prisma delete expects unique where.
        // We should verify ownership first.
    } catch (error) {
        // ...
    }
};

// Refined delete with ownership check
const deleteCategoryS = async (req, res) => {
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
        res.status(500).json({ error: 'Error deleting category' });
    }
}


module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory: deleteCategoryS
};
