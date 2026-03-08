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
const goalRoutes_1 = __importDefault(require("./routes/goalRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
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
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Added unsafe-eval for Vite dynamic imports
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            connectSrc: ["'self'", "*"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: null
        }
    },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Allow usage without HTTPS
    strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    originAgentCluster: false // Disable Origin-Agent-Cluster to prevent isolation conflicts
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.set('trust proxy', 1);
// Rate limiting
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
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
// Static files for production (must be served BEFORE CORS to avoid same-origin issues)
if (process.env.NODE_ENV === 'production') {
    const publicPath = path_1.default.join(__dirname, '../public');
    logger_1.default.info(`Serving static files from: ${publicPath}`);
    app.use(express_1.default.static(publicPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            // Disable cache for critical PWA and SPA entry files
            if (filePath.endsWith('sw.js') || filePath.endsWith('index.html') || filePath.endsWith('manifest.webmanifest')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            }
            // Ensure correct MIME types for all assets
            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            }
            else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            }
            else if (filePath.endsWith('.json')) {
                res.setHeader('Content-Type', 'application/json; charset=UTF-8');
            }
            else if (filePath.endsWith('.woff') || filePath.endsWith('.woff2')) {
                res.setHeader('Content-Type', 'font/woff2');
            }
        }
    }));
}
// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:80')
    .split(',')
    .map(o => o.trim());
if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
}
logger_1.default.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowNgrok = process.env.NODE_ENV !== 'production';
        if (allowedOrigins.includes(origin) || (allowNgrok && origin.endsWith('.ngrok-free.app'))) {
            callback(null, true);
        }
        else {
            logger_1.default.warn(`CORS blocked origin: ${origin}`);
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
app.use('/api/auth', authLimiter, authRoutes_1.default);
app.use('/api/accounts', accountRoutes_1.default);
app.use('/api/transactions', transactionRoutes_1.default);
app.use('/api/transfers', transferRoutes_1.default);
app.use('/api/templates', templateRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/budgets', budgetRoutes_1.default);
app.use('/api/recurring', recurringRoutes_1.default);
app.use('/api/goals', goalRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
// Error handler (for API errors)
app.use(errorHandler_1.default);
// SPA fallback (must be LAST - catch all non-API routes and serve index.html)
if (process.env.NODE_ENV === 'production') {
    app.use((req, res) => {
        const ext = path_1.default.extname(req.path);
        // Only serve index.html for routes without file extensions (avoid intercepting static assets)
        // Also skip API routes and special routes
        if (!ext && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
            const indexPath = path_1.default.join(__dirname, '../public', 'index.html');
            logger_1.default.debug(`SPA fallback serving index.html for: ${req.path}`);
            res.sendFile(indexPath);
        }
        else if (ext) {
            // If we reached here with a file extension, the static middleware didn't find it
            logger_1.default.warn(`Static asset not found: ${req.path}`);
            res.status(404).send('File not found');
        }
        else {
            res.status(404).json({ error: 'Route not found' });
        }
    });
}
// Server startup moved to server.ts
exports.default = app;
//# sourceMappingURL=index.js.map