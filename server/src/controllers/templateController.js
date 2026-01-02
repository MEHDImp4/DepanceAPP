const prisma = require('../utils/prisma');

exports.createTemplate = async (req, res) => {
    try {
        const { name, amount, description, default_account_id } = req.body;
        const userId = req.user.userId;

        const template = await prisma.template.create({
            data: {
                name,
                amount: parseFloat(amount),
                description,
                default_account_id: default_account_id ? parseInt(default_account_id) : null,
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
            include: { default_account: { select: { name: true, currency: true } } }
        });
        res.json(templates);
    } catch (e) { res.status(500).json({ error: e.message }); }
}
