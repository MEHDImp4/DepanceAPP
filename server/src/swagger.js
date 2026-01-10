const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DepanceAPP API',
            version: '1.0.0',
            description: 'Personal Finance Management API - Track accounts, transactions, budgets, and more.',
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
            contact: {
                name: 'DepanceAPP Team',
            },
        },
        servers: [
            {
                url: '/api',
                description: 'API Server',
            },
            {
                url: 'http://localhost:3001',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                    description: 'JWT token stored in HttpOnly cookie',
                },
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        username: { type: 'string', example: 'johndoe' },
                        currency: { type: 'string', example: 'USD' },
                    },
                },
                Account: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Main Account' },
                        type: { type: 'string', enum: ['normal', 'savings', 'bank', 'cash', 'credit'], example: 'bank' },
                        currency: { type: 'string', example: 'USD' },
                        balance: { type: 'number', example: 1500.50 },
                        color: { type: 'string', example: '#3B82F6' },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        amount: { type: 'number', example: 50.00 },
                        description: { type: 'string', example: 'Grocery shopping' },
                        type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
                        account_id: { type: 'integer', example: 1 },
                        category_id: { type: 'integer', nullable: true, example: 5 },
                        created_at: { type: 'string', format: 'date-time' },
                        convertedAmount: { type: 'number', example: 45.00 },
                        convertedCurrency: { type: 'string', example: 'EUR' },
                    },
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Food' },
                        type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
                        color: { type: 'string', example: '#EF4444' },
                        icon: { type: 'string', example: 'shopping-cart' },
                    },
                },
                Budget: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        amount: { type: 'number', example: 500.00 },
                        period: { type: 'string', enum: ['weekly', 'monthly', 'yearly'], example: 'monthly' },
                        category_id: { type: 'integer', nullable: true, example: 5 },
                        spent: { type: 'number', example: 250.00 },
                    },
                },
                Template: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Netflix Subscription' },
                        amount: { type: 'number', example: 15.99 },
                        description: { type: 'string', example: 'Monthly streaming service' },
                        type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
                        default_account_id: { type: 'integer', nullable: true },
                        category_id: { type: 'integer', nullable: true },
                    },
                },
                RecurringTransaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        amount: { type: 'number', example: 100.00 },
                        description: { type: 'string', example: 'Monthly rent' },
                        type: { type: 'string', enum: ['income', 'expense'] },
                        interval: { type: 'string', enum: ['weekly', 'monthly', 'yearly'] },
                        next_run_date: { type: 'string', format: 'date-time' },
                        active: { type: 'boolean', example: true },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Error message' },
                    },
                },
            },
        },
        security: [
            { cookieAuth: [] },
            { bearerAuth: [] },
        ],
    },
    apis: ['./src/routes/*.js', './src/docs/*.yaml'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
