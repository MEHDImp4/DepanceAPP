import prisma from './prisma';
import logger from './logger';
import { Request } from 'express';

/**
 * Action types for audit logging
 */
export const AuditAction = {
    // Transactions
    TRANSACTION_CREATE: 'transaction.create',
    TRANSACTION_DELETE: 'transaction.delete',

    // Accounts
    ACCOUNT_CREATE: 'account.create',
    ACCOUNT_UPDATE: 'account.update',
    ACCOUNT_DELETE: 'account.delete',

    // Transfers
    TRANSFER_CREATE: 'transfer.create',

    // Budgets
    BUDGET_CREATE: 'budget.create',
    BUDGET_UPDATE: 'budget.update',
    BUDGET_DELETE: 'budget.delete',

    // Categories
    CATEGORY_CREATE: 'category.create',
    CATEGORY_UPDATE: 'category.update',
    CATEGORY_DELETE: 'category.delete',

    // Recurring
    RECURRING_CREATE: 'recurring.create',
    RECURRING_DELETE: 'recurring.delete',
    RECURRING_PROCESS: 'recurring.process',

    // Auth
    PASSWORD_CHANGE: 'auth.password_change',
    SETTINGS_UPDATE: 'auth.settings_update'
};

/**
 * Get client IP from request
 */
function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return (forwarded as string).split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'Unknown';
}

interface AuditLogOptions {
    userId: number;
    action: string;
    entityType: string;
    entityId?: number | null;
    oldValue?: any;
    newValue?: any;
    req?: Request;
    metadata?: any;
}

/**
 * Create an audit log entry
 */
export async function logAudit({
    userId,
    action,
    entityType,
    entityId,
    oldValue = null,
    newValue = null,
    req,
    metadata = null
}: AuditLogOptions) {
    try {
        const auditEntry = await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                oldValue: oldValue ? JSON.stringify(oldValue) : null,
                newValue: newValue ? JSON.stringify(newValue) : null,
                ipAddress: req ? getClientIp(req) : null,
                userAgent: req?.headers?.['user-agent']?.substring(0, 500) || null,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });

        // Also log to Winston for immediate visibility
        logger.info(`AUDIT: ${action} by user ${userId}`, {
            action,
            entityType,
            entityId,
            userId
        });

        return auditEntry;
    } catch (error: any) {
        // Don't fail the main operation if audit logging fails
        logger.error('Failed to create audit log:', error.message);
        return null;
    }
}

interface UserAuditLogOptions {
    limit?: number;
    offset?: number;
    action?: string;
    entityType?: string;
}

/**
 * Get audit logs for a user (for admin/user security review)
 */
export async function getUserAuditLogs(userId: number, options: UserAuditLogOptions = {}) {
    const { limit = 50, offset = 0, action = null, entityType = null } = options;

    const where: any = { userId };
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    return prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            ipAddress: true,
            createdAt: true,
            metadata: true
        }
    });
}

/**
 * Get recent critical actions (for security monitoring)
 */
export async function getRecentCriticalActions(minutes = 60) {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const criticalActions = [
        AuditAction.ACCOUNT_DELETE,
        AuditAction.TRANSFER_CREATE,
        AuditAction.PASSWORD_CHANGE
    ];

    return prisma.auditLog.findMany({
        where: {
            action: { in: criticalActions },
            createdAt: { gte: since }
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { email: true, username: true }
            }
        }
    });
}

/**
 * Convenience function for transaction audit
 */
export async function logTransactionCreate(userId: number, transaction: any, req?: Request) {
    return logAudit({
        userId,
        action: AuditAction.TRANSACTION_CREATE,
        entityType: 'transaction',
        entityId: transaction.id,
        newValue: {
            amount: transaction.amount,
            type: transaction.type,
            description: transaction.description,
            accountId: transaction.account_id
        },
        req
    });
}

/**
 * Convenience function for transfer audit
 */
export async function logTransferCreate(userId: number, transferId: string, fromAccountId: number, toAccountId: number, amount: number, req?: Request) {
    return logAudit({
        userId,
        action: AuditAction.TRANSFER_CREATE,
        entityType: 'transfer',
        entityId: null,
        newValue: {
            transferId,
            fromAccountId,
            toAccountId,
            amount
        },
        req,
        metadata: { transferId }
    });
}

/**
 * Convenience function for account deletion audit
 */
export async function logAccountDelete(userId: number, account: any, req?: Request) {
    return logAudit({
        userId,
        action: AuditAction.ACCOUNT_DELETE,
        entityType: 'account',
        entityId: account.id,
        oldValue: {
            name: account.name,
            type: account.type,
            currency: account.currency,
            balance: account.balance
        },
        req
    });
}
