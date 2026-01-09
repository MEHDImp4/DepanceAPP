const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const path = require('path');
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

app.use(helmet());
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

        if (allowedOrigins.includes(origin) || origin.endsWith('.ngrok-free.app')) {
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

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('DepanceAPP API is running');
    });
}

if (require.main === module) {
    app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
    });
}

module.exports = app;
