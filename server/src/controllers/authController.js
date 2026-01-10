const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { checkAccountLockout, logLogin, logFailedLogin, isNewDeviceOrLocation } = require('../utils/loginHistoryService');

exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        // Validation handled by middleware


        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) return res.status(400).json({ error: 'Email already registered' });

        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

        const BCRYPT_SALT_ROUNDS = 10;
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await prisma.user.create({
            data: { email, username, password_hash: hashedPassword }
        });

        const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Store refresh token in DB
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Optional: Keep 'token' cookie for backward compatibility if needed, matching accessToken
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        // Log successful registration as first login
        await logLogin(user.id, req, true);

        res.status(201).json({ message: 'Account created successfully', userId: user.id, user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or username
        // Validation handled by middleware

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

        // Check if account is locked due to too many failed attempts
        const lockoutStatus = await checkAccountLockout(user.id);
        if (lockoutStatus.isLocked) {
            return res.status(429).json({
                error: `Account temporarily locked. Please try again in ${lockoutStatus.remainingTime} minutes.`,
                lockedUntil: lockoutStatus.remainingTime
            });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            // Log failed attempt
            await logFailedLogin(user.id, req);
            const attemptsLeft = 5 - lockoutStatus.failedAttempts - 1;
            const message = attemptsLeft > 0
                ? `Invalid credentials. ${attemptsLeft} attempts remaining before account lockout.`
                : 'Invalid credentials';
            return res.status(401).json({ error: message });
        }

        // Check if this is a new device/location
        const deviceCheck = await isNewDeviceOrLocation(user.id, req);

        const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Store refresh token in DB
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        // Log successful login
        await logLogin(user.id, req, true);

        res.json({
            user: { id: user.id, email: user.email, username: user.username, currency: user.currency },
            newDevice: deviceCheck.isNew // Alert frontend if new device/location
        });
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        res.json({ id: user.id, email: user.email, username: user.username, currency: user.currency });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
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
exports.refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Check if token exists in DB
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true }
        });

        if (!storedToken) return res.status(401).json({ error: 'Invalid or revoked refresh token' });

        // Optional: Check if expired (DB field) - extra layer over JWT exp
        if (new Date() > storedToken.expiresAt) {
            await prisma.refreshToken.delete({ where: { token: refreshToken } });
            return res.status(401).json({ error: 'Refresh token expired' });
        }

        const user = storedToken.user;
        const newAccessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.json({ message: 'Token refreshed' });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            // Clean up if possible, though we might not have the raw token if decode fails
        }
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

exports.logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            // Revoke token in DB
            await prisma.refreshToken.delete({
                where: { token: refreshToken }
            }).catch(() => {
                // Ignore if already deleted or not found
            });
        }

        res.clearCookie('refreshToken');
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's login history
 */
exports.getLoginHistory = async (req, res, next) => {
    try {
        const { getLoginHistory } = require('../utils/loginHistoryService');
        const limit = parseInt(req.query.limit) || 20;
        const history = await getLoginHistory(req.user.userId, Math.min(limit, 100));
        res.json(history);
    } catch (error) {
        next(error);
    }
};

/**
 * Get security alerts for the user
 */
exports.getSecurityAlerts = async (req, res, next) => {
    try {
        const { detectSuspiciousActivity } = require('../utils/loginHistoryService');
        const alerts = await detectSuspiciousActivity(req.user.userId);
        res.json({ alerts });
    } catch (error) {
        next(error);
    }
};

