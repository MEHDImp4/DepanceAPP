"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.updateProfile = exports.getProfile = exports.getSecurityAlerts = exports.getLoginHistory = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const BCRYPT_SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_MS = 15 * 60 * 1000;
const register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        console.log(`[AUTH-DEBUG] Register attempt for email: ${email}, username: ${username}`);
        const existingEmail = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingEmail) {
            console.log(`[AUTH-DEBUG] Registration failed: Email ${email} already exists`);
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        const existingUsername = await prisma_1.default.user.findUnique({ where: { username } });
        if (existingUsername) {
            console.log(`[AUTH-DEBUG] Registration failed: Username ${username} already taken`);
            res.status(400).json({ error: 'Username already taken' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await prisma_1.default.user.create({
            data: { email, username, password_hash: hashedPassword }
        });
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS)
            }
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_MS
        });
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_MS
        });
        res.status(201).json({
            message: 'Account created successfully',
            userId: user.id,
            user: { id: user.id, email: user.email, username: user.username }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const loginHistoryService_1 = require("../utils/loginHistoryService");
const login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;
        console.log(`[AUTH-DEBUG] Login attempt for identifier: ${identifier}`);
        const user = await prisma_1.default.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });
        if (!user) {
            // Log generic failed attempt (using 0 or null as userId might be tricky if not found, usually skip or log as unknown)
            // Ideally we log by IP if user not found, but service expects userId.
            console.log(`[AUTH-DEBUG] Login failed: User not found for identifier: ${identifier}`);
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Check for account lockout
        const lockoutStatus = await (0, loginHistoryService_1.checkAccountLockout)(user.id);
        if (lockoutStatus.isLocked) {
            res.status(429).json({
                error: 'Account locked due to too many failed attempts',
                remainingTime: lockoutStatus.remainingTime
            });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid) {
            await (0, loginHistoryService_1.logFailedLogin)(user.id, req);
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Log successful login
        await (0, loginHistoryService_1.logLogin)(user.id, req, true);
        // Check for new device
        const deviceCheck = await (0, loginHistoryService_1.isNewDeviceOrLocation)(user.id, req);
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS)
            }
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_MS
        });
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_MS
        });
        res.json({
            user: { id: user.id, email: user.email, username: user.username, currency: user.currency },
            newDevice: deviceCheck.isNew
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getLoginHistory = async (req, res, next) => {
    try {
        const history = await (0, loginHistoryService_1.getLoginHistory)(req.user.userId);
        res.json(history);
    }
    catch (error) {
        next(error);
    }
};
exports.getLoginHistory = getLoginHistory;
const getSecurityAlerts = async (req, res, next) => {
    try {
        const alerts = await (0, loginHistoryService_1.detectSuspiciousActivity)(req.user.userId);
        res.json(alerts);
    }
    catch (error) {
        next(error);
    }
};
exports.getSecurityAlerts = getSecurityAlerts;
const getProfile = async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ id: user.id, email: user.email, username: user.username, currency: user.currency });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        const { currency } = req.body;
        const updated = await prisma_1.default.user.update({
            where: { id: req.user.userId },
            data: { currency }
        });
        res.json({ id: updated.id, email: updated.email, username: updated.username, currency: updated.currency });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const refreshToken = async (req, res, next) => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken;
        if (!refreshTokenValue) {
            res.status(401).json({ error: 'Refresh token required' });
            return;
        }
        try {
            jsonwebtoken_1.default.verify(refreshTokenValue, process.env.JWT_SECRET);
        }
        catch {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        const storedToken = await prisma_1.default.refreshToken.findUnique({
            where: { token: refreshTokenValue },
            include: { user: true }
        });
        if (!storedToken) {
            res.status(401).json({ error: 'Invalid or revoked refresh token' });
            return;
        }
        if (new Date() > storedToken.expiresAt) {
            await prisma_1.default.refreshToken.delete({ where: { token: refreshTokenValue } });
            res.status(401).json({ error: 'Refresh token expired' });
            return;
        }
        const user = storedToken.user;
        const newAccessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_MS
        });
        res.json({ message: 'Token refreshed' });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res, next) => {
    try {
        const refreshTokenValue = req.cookies?.refreshToken;
        if (refreshTokenValue) {
            await prisma_1.default.refreshToken.delete({
                where: { token: refreshTokenValue }
            }).catch(() => {
                // Ignore if already deleted or not found
            });
        }
        res.clearCookie('refreshToken');
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
//# sourceMappingURL=authController.js.map