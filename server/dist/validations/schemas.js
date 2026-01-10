"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.createTransferSchema = exports.updateTemplateSchema = exports.createTemplateSchema = exports.createRecurringSchema = exports.updateBudgetSchema = exports.createBudgetSchema = exports.updateCategorySchema = exports.createCategorySchema = exports.updateAccountSchema = exports.createAccountSchema = exports.transactionSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ============ AUTH SCHEMAS ============
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: "Invalid email format" }),
        username: zod_1.z.string().min(3, { message: "Username must be at least 3 characters long" }),
        password: zod_1.z.string().min(8, { message: "Password must be at least 8 characters long" })
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z.string().min(1, { message: "Identifier is required" }),
        password: zod_1.z.string().min(1, { message: "Password is required" })
    })
});
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        currency: zod_1.z.string().length(3, { message: "Currency must be a 3-letter code" })
    })
});
// ============ TRANSACTION SCHEMAS ============
exports.transactionSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive({ message: "Amount must be a positive number" }),
        description: zod_1.z.string().min(1, { message: "Description is required" }),
        type: zod_1.z.enum(['income', 'expense']),
        account_id: zod_1.z.number().int().positive(),
        category_id: zod_1.z.number().int().positive().optional().nullable()
    })
});
// ============ ACCOUNT SCHEMAS ============
exports.createAccountSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, { message: "Account name is required" }).max(100),
        type: zod_1.z.enum(['normal', 'savings', 'bank', 'cash', 'credit']).optional(),
        balance: zod_1.z.number().optional().default(0),
        currency: zod_1.z.string().length(3).optional().default('USD'),
        color: zod_1.z.string().optional()
    })
});
exports.updateAccountSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        type: zod_1.z.enum(['normal', 'savings', 'bank', 'cash', 'credit']).optional(),
        currency: zod_1.z.string().length(3).optional()
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, { message: "Invalid account ID" })
    })
});
// ============ CATEGORY SCHEMAS ============
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, { message: "Category name is required" }).max(50),
        type: zod_1.z.enum(['income', 'expense']),
        color: zod_1.z.string().optional(),
        icon: zod_1.z.string().optional()
    })
});
exports.updateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(50).optional(),
        type: zod_1.z.enum(['income', 'expense']).optional(),
        color: zod_1.z.string().optional(),
        icon: zod_1.z.string().optional()
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, { message: "Invalid category ID" })
    })
});
// ============ BUDGET SCHEMAS ============
exports.createBudgetSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive({ message: "Budget amount must be positive" }),
        period: zod_1.z.enum(['weekly', 'monthly', 'yearly']).optional().default('monthly'),
        category_id: zod_1.z.number().int().positive().optional().nullable()
    })
});
exports.updateBudgetSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive().optional(),
        period: zod_1.z.enum(['weekly', 'monthly', 'yearly']).optional()
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, { message: "Invalid budget ID" })
    })
});
// ============ RECURRING TRANSACTION SCHEMAS ============
exports.createRecurringSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive({ message: "Amount must be positive" }),
        description: zod_1.z.string().min(1, { message: "Description is required" }),
        type: zod_1.z.enum(['income', 'expense']),
        interval: zod_1.z.enum(['weekly', 'monthly', 'yearly']),
        start_date: zod_1.z.string().optional(),
        account_id: zod_1.z.number().int().positive(),
        category_id: zod_1.z.number().int().positive().optional().nullable()
    })
});
// ============ TEMPLATE SCHEMAS ============
exports.createTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, { message: "Template name is required" }).max(100),
        amount: zod_1.z.number().positive({ message: "Amount must be positive" }),
        description: zod_1.z.string().optional(),
        default_account_id: zod_1.z.number().int().positive().optional().nullable(),
        category_id: zod_1.z.number().int().positive().optional().nullable(),
        color: zod_1.z.string().optional(),
        icon_name: zod_1.z.string().optional(),
        type: zod_1.z.enum(['income', 'expense']).optional().default('expense')
    })
});
exports.updateTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        amount: zod_1.z.number().positive().optional(),
        description: zod_1.z.string().optional(),
        default_account_id: zod_1.z.number().int().positive().optional().nullable(),
        category_id: zod_1.z.number().int().positive().optional().nullable(),
        color: zod_1.z.string().optional(),
        icon_name: zod_1.z.string().optional(),
        type: zod_1.z.enum(['income', 'expense']).optional()
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, { message: "Invalid template ID" })
    })
});
// ============ TRANSFER SCHEMAS ============
exports.createTransferSchema = zod_1.z.object({
    body: zod_1.z.object({
        from_account_id: zod_1.z.number().int().positive({ message: "Source account is required" }),
        to_account_id: zod_1.z.number().int().positive({ message: "Destination account is required" }),
        amount: zod_1.z.number().positive({ message: "Amount must be positive" }),
        description: zod_1.z.string().optional()
    })
});
// ============ COMMON PARAM SCHEMAS ============
exports.idParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, { message: "Invalid ID format" })
    })
});
//# sourceMappingURL=schemas.js.map