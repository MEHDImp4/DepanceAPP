const prisma = require('../utils/prisma');
const { toCents, fromCents } = require('../utils/money');

exports.createTemplate = async (req, res, next) => {
    try {
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body;
        const userId = req.user.userId;

        const template = await prisma.template.create({
            data: {
                name,
                amount: toCents(amount),
                description,
                default_account_id: default_account_id ? parseInt(default_account_id) : null,
                category_id: category_id ? parseInt(category_id) : null,
                color,
                icon_name,
                type: type || 'expense',
                user_id: userId
            }
        });
        res.status(201).json({ ...template, amount: fromCents(template.amount) });
    } catch (e) { next(e); }
}

exports.getTemplates = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const templates = await prisma.template.findMany({
            where: { user_id: userId },
            include: {
                default_account: { select: { name: true, currency: true } },
                category: { select: { name: true, color: true, icon: true } }
            }
        });
        const templatesWithFloat = templates.map(t => ({ ...t, amount: fromCents(t.amount) }));
        res.json(templatesWithFloat);
    } catch (e) { next(e); }
}

exports.updateTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, amount, description, default_account_id, category_id, color, icon_name, type } = req.body;
        const userId = req.user.userId;

        const template = await prisma.template.update({
            where: { id: parseInt(id), user_id: userId },
            data: {
                name,
                amount: toCents(amount),
                description,
                default_account_id: default_account_id ? parseInt(default_account_id) : null,
                category_id: category_id ? parseInt(category_id) : null,
                color,
                icon_name,
                type: type || 'expense'
            }
        });
        res.json({ ...template, amount: fromCents(template.amount) });
    } catch (e) { next(e); }
}

exports.deleteTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await prisma.template.delete({
            where: { id: parseInt(id), user_id: userId }
        });
        res.json({ message: 'Template deleted successfully' });
    } catch (e) { next(e); }
}
