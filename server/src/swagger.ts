import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.1.0',
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
                url: '/api/v1',
                description: 'Stable API v1',
            },
            {
                url: 'http://localhost:3001/api/v1',
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
                    },
                },
                Error: {
                    required: ['error', 'code', 'requestId'],
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Error message' },
                        code: { type: 'string', example: 'BAD_REQUEST' },
                        requestId: { type: 'string', format: 'uuid' },
                    },
                },
                TransactionPage: {
                    required: ['items', 'nextCursor'],
                    type: 'object',
                    properties: {
                        items: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
                        nextCursor: { type: ['integer', 'null'], example: 42 },
                    },
                },
            },
        },
        security: [
            { cookieAuth: [] },
            { bearerAuth: [] },
        ],
    },
    apis: ['./src/routes/*.ts', './src/docs/*.yaml'],
};

const specs = swaggerJsdoc(options);

export default specs;
