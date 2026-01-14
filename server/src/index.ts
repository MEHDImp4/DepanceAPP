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
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "*"], // Relaxed for universal access
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            // upgradeInsecureRequests: [] // Removed to allow HTTP
        }
    }
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
app.use('/auth', authLimiter, authRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);
app.use('/transfers', transferRoutes);
app.use('/templates', templateRoutes);
app.use('/categories', categoryRoutes);
app.use('/budgets', budgetRoutes);
app.use('/recurring', recurringRoutes);
app.use('/goals', goalRoutes);
app.use('/analytics', analyticsRoutes);

// Error handler
app.use(errorHandler);

// Static files for production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));
    app.get(/.*/, (_req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
    });
}

// Server startup moved to server.ts

export default app;
