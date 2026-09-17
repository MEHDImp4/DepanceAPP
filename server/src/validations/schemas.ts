import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import { isValidTimeZone } from '../utils/reportingTime';
import { MAX_MAJOR_UNITS } from '../utils/money';

const currencySchema = z.enum(SUPPORTED_CURRENCIES);
const timezoneSchema = z.string()
    .min(1)
    .max(100)
    .refine(isValidTimeZone, { message: 'Invalid IANA timezone' });
const bcryptLength = (value: string) => Buffer.byteLength(value, 'utf8') <= 72;
const passwordSchema = z.string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(72, { message: 'Password must be at most 72 characters long' })
    .refine(bcryptLength, { message: 'Password must be at most 72 UTF-8 bytes long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });
const loginPasswordSchema = z.string()
    .min(1, { message: 'Password is required' })
    .max(72, { message: 'Password must be at most 72 characters long' })
    .refine(bcryptLength, { message: 'Password must be at most 72 UTF-8 bytes long' });
const positiveMoneySchema = z.number()
    .finite()
    .positive({ message: 'Amount must be positive' })
    .max(MAX_MAJOR_UNITS, { message: 'Amount exceeds supported range' });
const nonNegativeMoneySchema = z.number()
    .finite()
    .nonnegative()
    .max(MAX_MAJOR_UNITS, { message: 'Amount exceeds supported range' });

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email({ message: 'Invalid email format' }).max(254),
        username: z.string().min(3, { message: 'Username must be at least 3 characters long' }).max(50),
        password: passwordSchema
    })
});

export const loginSchema = z.object({
    body: z.object({
        identifier: z.string().min(1, { message: 'Identifier is required' }).max(254),
        password: loginPasswordSchema
    })
});

export const updateProfileSchema = z.object({
    body: z.object({
        currency: currencySchema.optional(),
        timezone: timezoneSchema.optional()
    }).refine(body => body.currency !== undefined || body.timezone !== undefined, {
        message: 'At least one profile setting is required'
    })
});

export const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: loginPasswordSchema,
        newPassword: passwordSchema
    })
});

export const transactionSchema = z.object({
    body: z.object({
        amount: positiveMoneySchema,
        description: z.string().min(1, { message: 'Description is required' }).max(500),
        type: z.enum(['income', 'expense']),
        account_id: z.number().int().positive(),
        category_id: z.number().int().positive().optional().nullable()
    })
});

export const createAccountSchema = z.object({
    body: z.object({
        name: z.string().min(1, { message: 'Account name is required' }).max(100),
        type: z.enum(['normal', 'savings', 'bank', 'cash', 'credit']).optional(),
        balance: z.number().finite().min(-MAX_MAJOR_UNITS).max(MAX_MAJOR_UNITS).optional().default(0),
        currency: currencySchema.optional().default('USD'),
        color: z.string().max(64).optional()
    })
});

export const updateAccountSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        type: z.enum(['normal', 'savings', 'bank', 'cash', 'credit']).optional(),
        currency: currencySchema.optional()
    }),
    params: z.object({ id: z.string().regex(/^\d+$/, { message: 'Invalid account ID' }) })
});

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, { message: 'Category name is required' }).max(50),
        type: z.enum(['income', 'expense']),
        color: z.string().max(64).optional(),
        icon: z.string().max(100).optional()
    })
});

export const updateCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        type: z.enum(['income', 'expense']).optional(),
        color: z.string().max(64).optional(),
        icon: z.string().max(100).optional()
    }),
    params: z.object({ id: z.string().regex(/^\d+$/, { message: 'Invalid category ID' }) })
});

export const createBudgetSchema = z.object({
    body: z.object({
        amount: positiveMoneySchema,
        period: z.enum(['weekly', 'monthly', 'yearly']).optional().default('monthly'),
        category_id: z.number().int().positive().optional().nullable()
    })
});

export const updateBudgetSchema = z.object({
    body: z.object({
        amount: positiveMoneySchema.optional(),
        period: z.enum(['weekly', 'monthly', 'yearly']).optional()
    }),
    params: z.object({ id: z.string().regex(/^\d+$/, { message: 'Invalid budget ID' }) })
});

export const createRecurringSchema = z.object({
    body: z.object({
        amount: positiveMoneySchema,
        description: z.string().min(1, { message: 'Description is required' }).max(500),
        type: z.enum(['income', 'expense']),
        interval: z.enum(['weekly', 'monthly', 'yearly']),
        start_date: z.string().datetime().optional(),
        account_id: z.number().int().positive(),
        category_id: z.number().int().positive().optional().nullable()
    })
});

export const createTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(1, { message: 'Template name is required' }).max(100),
        amount: positiveMoneySchema,
        description: z.string().max(500).optional(),
        default_account_id: z.number().int().positive().optional().nullable(),
        category_id: z.number().int().positive().optional().nullable(),
        color: z.string().max(64).optional(),
        icon_name: z.string().max(100).optional(),
        type: z.enum(['income', 'expense']).optional().default('expense')
    })
});

export const updateTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        amount: positiveMoneySchema.optional(),
        description: z.string().max(500).optional(),
        default_account_id: z.number().int().positive().optional().nullable(),
        category_id: z.number().int().positive().optional().nullable(),
        color: z.string().max(64).optional(),
        icon_name: z.string().max(100).optional(),
        type: z.enum(['income', 'expense']).optional()
    }),
    params: z.object({ id: z.string().regex(/^\d+$/, { message: 'Invalid template ID' }) })
});

export const createTransferSchema = z.object({
    body: z.object({
        from_account_id: z.number().int().positive({ message: 'Source account is required' }),
        to_account_id: z.number().int().positive({ message: 'Destination account is required' }),
        amount: positiveMoneySchema,
        description: z.string().max(500).optional()
    })
});

export const createGoalSchema = z.object({
    body: z.object({
        name: z.string().min(1, { message: 'Goal name is required' }).max(100),
        targetAmount: positiveMoneySchema,
        currentAmount: nonNegativeMoneySchema.optional().default(0),
        deadline: z.string().datetime().optional().nullable(),
        color: z.string().max(64).optional(),
        icon: z.string().max(100).optional()
    })
});

export const updateGoalSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        targetAmount: positiveMoneySchema.optional(),
        currentAmount: nonNegativeMoneySchema.optional(),
        deadline: z.string().datetime().optional().nullable(),
        color: z.string().max(64).optional(),
        icon: z.string().max(100).optional()
    }),
    params: z.object({ id: z.string().regex(/^\d+$/, { message: 'Invalid goal ID' }) })
});

export const idParamSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/, { message: 'Invalid ID format' }) })
});
