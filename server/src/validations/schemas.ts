import { z } from 'zod';

// ============ AUTH SCHEMAS ============
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email format" }),
        username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
        password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    })
});

export const loginSchema = z.object({
    body: z.object({
        identifier: z.string().min(1, { message: "Identifier is required" }),
        password: z.string().min(1, { message: "Password is required" })
    })
});

export const updateProfileSchema = z.object({
    body: z.object({
        currency: z.string().length(3, { message: "Currency must be a 3-letter code" })
    })
});

// ============ TRANSACTION SCHEMAS ============
export const transactionSchema = z.object({
    body: z.object({
        amount: z.number().positive({ message: "Amount must be a positive number" }),
        description: z.string().min(1, { message: "Description is required" }),
        type: z.enum(['income', 'expense']),
        account_id: z.number().int().positive(),
        category_id: z.number().int().positive().optional().nullable()
    })
});

// ============ ACCOUNT SCHEMAS ============
export const createAccountSchema = z.object({
    body: z.object({
        name: z.string().min(1, { message: "Account name is required" }).max(100),
        type: z.enum(['normal', 'savings', 'bank', 'cash', 'credit']).optional(),
        balance: z.number().optional().default(0),
        currency: z.string().length(3).optional().default('USD'),
        color: z.string().optional()
    })
});

export const updateAccountSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        type: z.enum(['normal', 'savings', 'bank', 'cash', 'credit']).optional(),
        currency: z.string().length(3).optional()
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: "Invalid account ID" })
    })
});

// ============ CATEGORY SCHEMAS ============
export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, { message: "Category name is required" }).max(50),
        type: z.enum(['income', 'expense']),
        color: z.string().optional(),
        icon: z.string().optional()
    })
});

export const updateCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        type: z.enum(['income', 'expense']).optional(),
        color: z.string().optional(),
        icon: z.string().optional()
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: "Invalid category ID" })
    })
});

// ============ BUDGET SCHEMAS ============
export const createBudgetSchema = z.object({
    body: z.object({
        amount: z.number().positive({ message: "Budget amount must be positive" }),
        period: z.enum(['weekly', 'monthly', 'yearly']).optional().default('monthly'),
        category_id: z.number().int().positive().optional().nullable()
    })
});

export const updateBudgetSchema = z.object({
    body: z.object({
        amount: z.number().positive().optional(),
        period: z.enum(['weekly', 'monthly', 'yearly']).optional()
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: "Invalid budget ID" })
    })
});

// ============ RECURRING TRANSACTION SCHEMAS ============
export const createRecurringSchema = z.object({
    body: z.object({
        amount: z.number().positive({ message: "Amount must be positive" }),
        description: z.string().min(1, { message: "Description is required" }),
        type: z.enum(['income', 'expense']),
        interval: z.enum(['weekly', 'monthly', 'yearly']),
        start_date: z.string().optional(),
        account_id: z.number().int().positive(),
        category_id: z.number().int().positive().optional().nullable()
    })
});

// ============ TEMPLATE SCHEMAS ============
export const createTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(1, { message: "Template name is required" }).max(100),
        amount: z.number().positive({ message: "Amount must be positive" }),
        description: z.string().optional(),
        default_account_id: z.number().int().positive().optional().nullable(),
        category_id: z.number().int().positive().optional().nullable(),
        color: z.string().optional(),
        icon_name: z.string().optional(),
        type: z.enum(['income', 'expense']).optional().default('expense')
    })
});

export const updateTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        default_account_id: z.number().int().positive().optional().nullable(),
        category_id: z.number().int().positive().optional().nullable(),
        color: z.string().optional(),
        icon_name: z.string().optional(),
        type: z.enum(['income', 'expense']).optional()
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: "Invalid template ID" })
    })
});

// ============ TRANSFER SCHEMAS ============
export const createTransferSchema = z.object({
    body: z.object({
        from_account_id: z.number().int().positive({ message: "Source account is required" }),
        to_account_id: z.number().int().positive({ message: "Destination account is required" }),
        amount: z.number().positive({ message: "Amount must be positive" }),
        description: z.string().optional()
    })
});

// ============ COMMON PARAM SCHEMAS ============
export const idParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, { message: "Invalid ID format" })
    })
});
