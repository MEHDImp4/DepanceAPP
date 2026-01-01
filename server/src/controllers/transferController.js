const prisma = require('../utils/prisma');
const { v4: uuidv4 } = require('uuid'); // Need to install uuid, or just use Date.now() + random

exports.createTransfer = async (req, res) => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body;
        const userId = req.user.userId;

        // Verify ownership of both accounts
        const fromAccount = await prisma.account.findFirst({ where: { id: parseInt(from_account_id), user_id: userId } });
        const toAccount = await prisma.account.findFirst({ where: { id: parseInt(to_account_id), user_id: userId } });

        if (!fromAccount || !toAccount) return res.status(404).json({ error: 'One or both accounts not found' });
        if (fromAccount.id === toAccount.id) return res.status(400).json({ error: 'Cannot transfer to same account' });

        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return res.status(400).json({ error: 'Invalid amount' });

        // Use a unique transfer ID string
        const transferId = 'sf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        // Create Debit (Exepnse) from sender
        // Create Credit (Income) to receiver
        // Update balances

        await prisma.$transaction([
            // Debit
            prisma.transaction.create({
                data: {
                    amount: val,
                    description: description || `Transfer to ${toAccount.name}`,
                    type: 'expense',
                    account_id: fromAccount.id,
                    user_id: userId,
                    transfer_id: transferId
                }
            }),
            prisma.account.update({
                where: { id: fromAccount.id },
                data: { balance: { decrement: val } }
            }),
            // Credit
            prisma.transaction.create({
                data: {
                    amount: val,
                    description: description || `Transfer from ${fromAccount.name}`,
                    type: 'income',
                    account_id: toAccount.id,
                    user_id: userId,
                    transfer_id: transferId
                }
            }),
            prisma.account.update({
                where: { id: toAccount.id },
                data: { balance: { increment: val } }
            })
        ]);

        res.status(201).json({ message: 'Transfer successful', transferId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
