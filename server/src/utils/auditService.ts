import type { Prisma, PrismaClient } from '@prisma/client';
import { Request } from 'express';
import prisma from './prisma';
import logger from './logger';

export const AuditAction = {
    TRANSACTION_CREATE: 'transaction.create',
    TRANSACTION_DELETE: 'transaction.delete',
    ACCOUNT_CREATE: 'account.create',
    ACCOUNT_UPDATE: 'account.update',
    ACCOUNT_DELETE: 'account.delete',
    TRANSFER_CREATE: 'transfer.create',
    TRANSFER_CANCEL: 'transfer.cancel',
    BUDGET_CREATE: 'budget.create',
    BUDGET_UPDATE: 'budget.update',
    BUDGET_DELETE: 'budget.delete',
    CATEGORY_CREATE: 'category.create',
    CATEGORY_UPDATE: 'category.update',
    CATEGORY_DELETE: 'category.delete',
    RECURRING_CREATE: 'recurring.create',
    RECURRING_DELETE: 'recurring.delete',
    RECURRING_PROCESS: 'recurring.process',
    GOAL_CREATE: 'goal.create',
    GOAL_UPDATE: 'goal.update',
    GOAL_DELETE: 'goal.delete',
    TEMPLATE_CREATE: 'template.create',
    TEMPLATE_UPDATE: 'template.update',
    TEMPLATE_DELETE: 'template.delete',
    PASSWORD_CHANGE: 'auth.password_change',
    SETTINGS_UPDATE: 'auth.settings_update'
} as const;

function getClientIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || 'Unknown';
}

export interface AuditLogOptions {
    userId: number;
    action: string;
    entityType: string;
    entityId?: number | null;
    oldValue?: unknown;
    newValue?: unknown;
    req?: Request;
    metadata?: unknown;
}

type AuditDatabase = Prisma.TransactionClient | PrismaClient;

const auditData = ({
    userId,
    action,
    entityType,
    entityId,
    oldValue = null,
    newValue = null,
    req,
    metadata = null
}: AuditLogOptions) => ({
    userId,
    action,
    entityType,
    entityId: entityId ?? null,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    ipAddress: req ? getClientIp(req) : null,
    userAgent: req?.headers?.['user-agent']?.substring(0, 500) || null,
    metadata: metadata ? JSON.stringify(metadata) : null
});

/**
 * Strict audit write for financial/security mutations that must commit or roll
 * back together with the domain operation.
 */
export async function createAuditEntry(database: AuditDatabase, options: AuditLogOptions) {
    return database.auditLog.create({ data: auditData(options) });
}

/**
 * Best-effort audit helper reserved for informational/settings events where a
 * failed audit write must not make the user-facing action unavailable.
 */
export async function logAudit(options: AuditLogOptions) {
    try {
        const auditEntry = await createAuditEntry(prisma, options);
        logger.info(`AUDIT: ${options.action} by user ${options.userId}`, {
            action: options.action,
            entityType: options.entityType,
            entityId: options.entityId,
            userId: options.userId
        });
        return auditEntry;
    } catch (error: any) {
        logger.error('Failed to create audit log:', error.message);
        return null;
    }
}

interface UserAuditLogOptions {
    limit?: number;
    offset?: number;
    action?: string | null;
    entityType?: string | null;
}

export async function getUserAuditLogs(userId: number, options: UserAuditLogOptions = {}) {
    const { limit = 50, offset = 0, action = null, entityType = null } = options;
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const where: Prisma.AuditLogWhereInput = { userId };
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    return prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
        skip: safeOffset,
        select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            oldValue: true,
            newValue: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            metadata: true
        }
    });
}

export async function getRecentCriticalActions(minutes = 60) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const criticalActions = [
        AuditAction.ACCOUNT_DELETE,
        AuditAction.TRANSFER_CREATE,
        AuditAction.TRANSFER_CANCEL,
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
            accountId: transaction.account_id,
            categoryId: transaction.category_id ?? null
        },
        req
    });
}

export async function logTransferCreate(
    userId: number,
    transferId: string,
    fromAccountId: number,
    toAccountId: number,
    amount: number,
    req?: Request
) {
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
