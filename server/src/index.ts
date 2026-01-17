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

// Import routes
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

// Environment validation
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`FATAL ERROR: ${envVar} environment variable is not set.`);
        process.exit(1);
    }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
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
    strictTransportSecurity: false, // Disable HSTS to prevent forced HTTPS upgrades
    originAgentCluster: false // Disable Origin-Agent-Cluster to prevent isolation conflicts
}));
app.use(compression());
app.use(cookieParser());
app.set('trust proxy', 1);

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
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

if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
}

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowNgrok = process.env.NODE_ENV !== 'production';

        if (allowedOrigins.includes(origin) || (allowNgrok && origin.endsWith('.ngrok-free.app'))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Static files for production (must be FIRST to serve assets before API routes)
if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, '../public');
    logger.info(`Serving static files from: ${publicPath}`);

    app.use(express.static(publicPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            // Ensure correct MIME types for all assets
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

// Health Check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DepanceAPP API Documentation'
}));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handler (for API errors)
app.use(errorHandler);

// SPA fallback (must be LAST - catch all non-API routes and serve index.html)
if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response) => {
        const ext = path.extname(req.path);

        // Only serve index.html for routes without file extensions (avoid intercepting static assets)
        // Also skip API routes and special routes
        if (!ext && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
            const indexPath = path.join(__dirname, '../public', 'index.html');
            logger.debug(`SPA fallback serving index.html for: ${req.path}`);
            res.sendFile(indexPath);
        } else if (ext) {
            // If we reached here with a file extension, the static middleware didn't find it
            logger.warn(`Static asset not found: ${req.path}`);
            res.status(404).send('File not found');
        } else {
            res.status(404).json({ error: 'Route not found' });
        }
    });
}

// Server startup moved to server.ts

export default app;
