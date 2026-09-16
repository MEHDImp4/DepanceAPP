import 'dotenv/config';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import swaggerSpecs from './swagger';

import authRoutes from './routes/authRoutes';
import accountRoutes from './routes/accountRoutes';
import transactionRoutes from './routes/transactionRoutes';
import transferRoutes from './routes/transferRoutes';
import templateRoutes from './routes/templateRoutes';
import categoryRoutes from './routes/categoryRoutes';
import budgetRoutes from './routes/budgetRoutes';
import recurringRoutes from './routes/recurringRoutes';
import goalRoutes from './routes/goalRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const hasDatabaseConfig = Boolean(
    process.env.DATABASE_URL ||
    (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)
);

const hasSplitJwtSecrets = Boolean(process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET);
const hasLegacyJwtSecret = Boolean(process.env.JWT_SECRET);

if (!hasDatabaseConfig) {
    logger.error('FATAL ERROR: Configure DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME.');
    process.exit(1);
}

if (process.env.NODE_ENV === 'production' && !hasSplitJwtSecrets) {
    logger.error('FATAL ERROR: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production.');
    process.exit(1);
}

if (!hasSplitJwtSecrets && !hasLegacyJwtSecret) {
    logger.error('FATAL ERROR: JWT secrets are not configured.');
    process.exit(1);
}

if (!hasSplitJwtSecrets && hasLegacyJwtSecret) {
    logger.warn('JWT_SECRET legacy fallback is enabled. Use separate JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.');
}

const app = express();

const hsts = process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    strictTransportSecurity: hsts
}));

app.use(compression());
app.use(cookieParser());

const configuredTrustProxy = process.env.TRUST_PROXY;
if (configuredTrustProxy) {
    app.set('trust proxy', /^\d+$/.test(configuredTrustProxy) ? Number(configuredTrustProxy) : configuredTrustProxy);
} else {
    app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
}

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMITED' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.', code: 'AUTH_RATE_LIMITED' }
});

app.use(globalLimiter);

if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, '../public');
    logger.info(`Serving static files from: ${publicPath}`);

    app.use(express.static(publicPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('sw.js') || filePath.endsWith('index.html') || filePath.endsWith('manifest.webmanifest')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            }

            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            } else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            } else if (filePath.endsWith('.json')) {
                res.setHeader('Content-Type', 'application/json; charset=UTF-8');
            } else if (filePath.endsWith('.woff') || filePath.endsWith('.woff2')) {
                res.setHeader('Content-Type', 'font/woff2');
            }
        }
    }));
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

if (process.env.APP_URL && !allowedOrigins.includes(process.env.APP_URL)) {
    allowedOrigins.push(process.env.APP_URL);
}

logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowNgrok = process.env.NODE_ENV !== 'production';
        if (allowedOrigins.includes(origin) || (allowNgrok && origin.endsWith('.ngrok-free.app'))) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

const apiDocsEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true';
if (apiDocsEnabled) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'DepanceAPP API Documentation'
    }));
}

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response) => {
        const ext = path.extname(req.path);

        if (!ext && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
            const indexPath = path.join(__dirname, '../public', 'index.html');
            res.sendFile(indexPath);
        } else if (ext) {
            res.status(404).send('File not found');
        } else {
            res.status(404).json({ error: 'Route not found' });
        }
    });
}

export default app;
