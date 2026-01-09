const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'All fields are required (Email, Username, Password)' });
        }

        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) return res.status(400).json({ error: 'Email already registered' });

        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

        const BCRYPT_SALT_ROUNDS = 10;
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await prisma.user.create({
            data: { email, username, password_hash: hashedPassword }
        });

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({ message: 'Account created successfully', userId: user.id, user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or username
        if (!identifier || !password) return res.status(400).json({ error: 'Credentials required' });

        // Try finding by email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ user: { id: user.id, email: user.email, username: user.username, currency: user.currency } });
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        res.json({ id: user.id, email: user.email, username: user.username, currency: user.currency });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { currency } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.user.userId },
            data: { currency }
        });
        res.json({ id: updated.id, email: updated.email, username: updated.username, currency: updated.currency });
    } catch (error) {
        next(error);
    }
};
