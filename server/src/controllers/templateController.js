const prisma = require('../utils/prisma');

exports.createTemplate = async (req, res) => {
    try {
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body;
        const userId = req.user.userId;

        const template = await prisma.template.create({
            data: {
                name,
                amount: parseFloat(amount),
                description,
                default_account_id: default_account_id ? parseInt(default_account_id) : null,
                category_id: category_id ? parseInt(category_id) : null,
                color,
                icon_name,
                type: type || 'expense',
                user_id: userId
            }
        });
        res.status(201).json(template);
    } catch (e) { res.status(500).json({ error: e.message }); }
}

exports.getTemplates = async (req, res) => {
    try {
        const userId = req.user.userId;
        const templates = await prisma.template.findMany({
            where: { user_id: userId },
            include: {
                default_account: { select: { name: true, currency: true } },
                category: { select: { name: true, color: true, icon: true } }
            }
        });
        res.json(templates);
    } catch (e) { res.status(500).json({ error: e.message }); }
}

exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body;
        const userId = req.user.userId;

        const template = await prisma.template.update({
            where: { id: parseInt(id), user_id: userId },
            data: {
                name,
                amount: parseFloat(amount),
                description,
                default_account_id: default_account_id ? parseInt(default_account_id) : null,
                category_id: category_id ? parseInt(category_id) : null,
                color,
                icon_name,
                type: type || 'expense'
            }
        });
        res.json(template);
    } catch (e) { res.status(500).json({ error: e.message }); }
}

exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await prisma.template.delete({
            where: { id: parseInt(id), user_id: userId }
        });
        res.json({ message: 'Template deleted successfully' });
    } catch (e) { res.status(500).json({ error: e.message }); }
}
