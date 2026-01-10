const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const path = require('path');

dotenv.config();

// Critical Environment Check
// Critical Environment Check
// For SQLite, DATABASE_URL is essential but might look different (file:./dev.db)
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
    console.error(`CRITICAL: Missing environment variables: ${missingEnv.join(', ')}`);
    process.exit(1);
}

const app = express();
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./utils/logger');

// Security headers with strict CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Consider removing unsafe-inline in production
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
    },
    crossOriginEmbedderPolicy: false, // May need to disable for some APIs
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true
}));
app.use(compression());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const rateLimit = require('express-rate-limit');

app.set('trust proxy', 1);

// Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs for auth
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again after 15 minutes'
});

// Apply global limiter to all requests
app.use(globalLimiter);

const port = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow ngrok only in development (not production)
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

// Health Check Endpoint (for Docker/K8s)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Documentation (Swagger UI)
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DepanceAPP API Documentation'
}));

// Routes
app.use('/auth', authLimiter, require('./routes/authRoutes'));
app.use('/accounts', require('./routes/accountRoutes'));
app.use('/transactions', require('./routes/transactionRoutes'));
app.use('/transfers', require('./routes/transferRoutes'));
app.use('/templates', require('./routes/templateRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));
app.use('/budgets', require('./routes/budgetRoutes'));
app.use('/recurring', require('./routes/recurringRoutes'));


const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Serve static files from the React app (Monolithic Mode)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));

    // Handle SPA routing - return index.html for any unknown route
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
    });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
