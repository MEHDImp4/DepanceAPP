const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/accounts', require('./routes/accountRoutes'));
app.use('/transactions', require('./routes/transactionRoutes'));
app.use('/transfers', require('./routes/transferRoutes'));
app.use('/templates', require('./routes/templateRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));
app.use('/budgets', require('./routes/budgetRoutes'));
app.use('/recurring', require('./routes/recurringRoutes'));

app.get('/', (req, res) => {
    res.send('DepanceAPP API is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
