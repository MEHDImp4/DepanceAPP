"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = void 0;
exports.logAudit = logAudit;
exports.getUserAuditLogs = getUserAuditLogs;
exports.getRecentCriticalActions = getRecentCriticalActions;
exports.logTransactionCreate = logTransactionCreate;
exports.logTransferCreate = logTransferCreate;
exports.logAccountDelete = logAccountDelete;
const prisma_1 = __importDefault(require("./prisma"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Action types for audit logging
 */
exports.AuditAction = {
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
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'Unknown';
}
/**
 * Create an audit log entry
 */
async function logAudit({ userId, action, entityType, entityId, oldValue = null, newValue = null, req, metadata = null }) {
    try {
        const auditEntry = await prisma_1.default.auditLog.create({
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
        logger_1.default.info(`AUDIT: ${action} by user ${userId}`, {
            action,
            entityType,
            entityId,
            userId
        });
        return auditEntry;
    }
    catch (error) {
        // Don't fail the main operation if audit logging fails
        logger_1.default.error('Failed to create audit log:', error.message);
        return null;
    }
}
/**
 * Get audit logs for a user (for admin/user security review)
 */
async function getUserAuditLogs(userId, options = {}) {
    const { limit = 50, offset = 0, action = null, entityType = null } = options;
    const where = { userId };
    if (action)
        where.action = action;
    if (entityType)
        where.entityType = entityType;
    return prisma_1.default.auditLog.findMany({
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
async function getRecentCriticalActions(minutes = 60) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const criticalActions = [
        exports.AuditAction.ACCOUNT_DELETE,
        exports.AuditAction.TRANSFER_CREATE,
        exports.AuditAction.PASSWORD_CHANGE
    ];
    return prisma_1.default.auditLog.findMany({
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
async function logTransactionCreate(userId, transaction, req) {
    return logAudit({
        userId,
        action: exports.AuditAction.TRANSACTION_CREATE,
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
async function logTransferCreate(userId, transferId, fromAccountId, toAccountId, amount, req) {
    return logAudit({
        userId,
        action: exports.AuditAction.TRANSFER_CREATE,
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
async function logAccountDelete(userId, account, req) {
    return logAudit({
        userId,
        action: exports.AuditAction.ACCOUNT_DELETE,
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
//# sourceMappingURL=auditService.js.map