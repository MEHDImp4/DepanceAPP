"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const swagger_1 = __importDefault(require("./swagger"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const transferRoutes_1 = __importDefault(require("./routes/transferRoutes"));
const templateRoutes_1 = __importDefault(require("./routes/templateRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const budgetRoutes_1 = __importDefault(require("./routes/budgetRoutes"));
const recurringRoutes_1 = __importDefault(require("./routes/recurringRoutes"));
// Environment validation
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger_1.default.error(`FATAL ERROR: ${envVar} environment variable is not set.`);
        process.exit(1);
    }
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", process.env.NODE_ENV !== 'production' ? "*" : "'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    }
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.set('trust proxy', 1);
// Rate limiting
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' }
});
app.use(globalLimiter);
// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:80')
    .split(',')
    .map(o => o.trim());
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowNgrok = process.env.NODE_ENV !== 'production';
        if (allowedOrigins.includes(origin) || (allowNgrok && origin.endsWith('.ngrok-free.app'))) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Health Check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DepanceAPP API Documentation'
}));
// API Routes
app.use('/auth', authLimiter, authRoutes_1.default);
app.use('/accounts', accountRoutes_1.default);
app.use('/transactions', transactionRoutes_1.default);
app.use('/transfers', transferRoutes_1.default);
app.use('/templates', templateRoutes_1.default);
app.use('/categories', categoryRoutes_1.default);
app.use('/budgets', budgetRoutes_1.default);
app.use('/recurring', recurringRoutes_1.default);
// Error handler
app.use(errorHandler_1.default);
// Static files for production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
    });
}
// Start server
app.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
exports.default = app;
//# sourceMappingURL=index.js.map