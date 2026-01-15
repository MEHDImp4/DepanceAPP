import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        username: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        identifier: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    body: z.ZodObject<{
        currency: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const transactionSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodNumber;
        description: z.ZodString;
        type: z.ZodEnum<{
            income: "income";
            expense: "expense";
        }>;
        account_id: z.ZodNumber;
        category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createAccountSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodOptional<z.ZodEnum<{
            normal: "normal";
            savings: "savings";
            bank: "bank";
            cash: "cash";
            credit: "credit";
        }>>;
        balance: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        color: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateAccountSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<{
            normal: "normal";
            savings: "savings";
            bank: "bank";
            cash: "cash";
            credit: "credit";
        }>>;
        currency: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createCategorySchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<{
            income: "income";
            expense: "expense";
        }>;
        color: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateCategorySchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<{
            income: "income";
            expense: "expense";
        }>>;
        color: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createBudgetSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodNumber;
        period: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            weekly: "weekly";
            monthly: "monthly";
            yearly: "yearly";
        }>>>;
        category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateBudgetSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodOptional<z.ZodNumber>;
        period: z.ZodOptional<z.ZodEnum<{
            weekly: "weekly";
            monthly: "monthly";
            yearly: "yearly";
        }>>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createRecurringSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodNumber;
        description: z.ZodString;
        type: z.ZodEnum<{
            income: "income";
            expense: "expense";
        }>;
        interval: z.ZodEnum<{
            weekly: "weekly";
            monthly: "monthly";
            yearly: "yearly";
        }>;
        start_date: z.ZodOptional<z.ZodString>;
        account_id: z.ZodNumber;
        category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createTemplateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        amount: z.ZodNumber;
        description: z.ZodOptional<z.ZodString>;
        default_account_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        color: z.ZodOptional<z.ZodString>;
        icon_name: z.ZodOptional<z.ZodString>;
        type: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            income: "income";
            expense: "expense";
        }>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateTemplateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        amount: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
        default_account_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        category_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        color: z.ZodOptional<z.ZodString>;
        icon_name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<{
            income: "income";
            expense: "expense";
        }>>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createTransferSchema: z.ZodObject<{
    body: z.ZodObject<{
        from_account_id: z.ZodNumber;
        to_account_id: z.ZodNumber;
        amount: z.ZodNumber;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createGoalSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        targetAmount: z.ZodNumber;
        currentAmount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        deadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        color: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateGoalSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        targetAmount: z.ZodOptional<z.ZodNumber>;
        currentAmount: z.ZodOptional<z.ZodNumber>;
        deadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        color: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const idParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map