const { z } = require('zod');

exports.registerSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email format" }),
        username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
        password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    })
});

exports.loginSchema = z.object({
    body: z.object({
        identifier: z.string().min(1, { message: "Identifier is required" }),
        password: z.string().min(1, { message: "Password is required" })
    })
});

exports.transactionSchema = z.object({
    body: z.object({
        amount: z.number().positive({ message: "Amount must be a positive number" }),
        description: z.string().min(1, { message: "Description is required" }),
        type: z.enum(['income', 'expense']),
        account_id: z.number(),
        category_id: z.number().optional().nullable()
    })
});
