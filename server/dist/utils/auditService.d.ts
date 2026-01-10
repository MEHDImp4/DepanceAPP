import { Request } from 'express';
/**
 * Action types for audit logging
 */
export declare const AuditAction: {
    TRANSACTION_CREATE: string;
    TRANSACTION_DELETE: string;
    ACCOUNT_CREATE: string;
    ACCOUNT_UPDATE: string;
    ACCOUNT_DELETE: string;
    TRANSFER_CREATE: string;
    BUDGET_CREATE: string;
    BUDGET_UPDATE: string;
    BUDGET_DELETE: string;
    CATEGORY_CREATE: string;
    CATEGORY_UPDATE: string;
    CATEGORY_DELETE: string;
    RECURRING_CREATE: string;
    RECURRING_DELETE: string;
    RECURRING_PROCESS: string;
    PASSWORD_CHANGE: string;
    SETTINGS_UPDATE: string;
};
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
export declare function logAudit({ userId, action, entityType, entityId, oldValue, newValue, req, metadata }: AuditLogOptions): Promise<{
    userId: number | null;
    action: string;
    entityType: string;
    entityId: number | null;
    oldValue: string | null;
    newValue: string | null;
    metadata: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    id: number;
} | null>;
interface UserAuditLogOptions {
    limit?: number;
    offset?: number;
    action?: string;
    entityType?: string;
}
/**
 * Get audit logs for a user (for admin/user security review)
 */
export declare function getUserAuditLogs(userId: number, options?: UserAuditLogOptions): Promise<{
    action: string;
    entityType: string;
    entityId: number | null;
    metadata: string | null;
    ipAddress: string | null;
    createdAt: Date;
    id: number;
}[]>;
/**
 * Get recent critical actions (for security monitoring)
 */
export declare function getRecentCriticalActions(minutes?: number): Promise<({
    user: {
        email: string;
        username: string;
    } | null;
} & {
    userId: number | null;
    action: string;
    entityType: string;
    entityId: number | null;
    oldValue: string | null;
    newValue: string | null;
    metadata: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    id: number;
})[]>;
/**
 * Convenience function for transaction audit
 */
export declare function logTransactionCreate(userId: number, transaction: any, req?: Request): Promise<{
    userId: number | null;
    action: string;
    entityType: string;
    entityId: number | null;
    oldValue: string | null;
    newValue: string | null;
    metadata: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    id: number;
} | null>;
/**
 * Convenience function for transfer audit
 */
export declare function logTransferCreate(userId: number, transferId: string, fromAccountId: number, toAccountId: number, amount: number, req?: Request): Promise<{
    userId: number | null;
    action: string;
    entityType: string;
    entityId: number | null;
    oldValue: string | null;
    newValue: string | null;
    metadata: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    id: number;
} | null>;
/**
 * Convenience function for account deletion audit
 */
export declare function logAccountDelete(userId: number, account: any, req?: Request): Promise<{
    userId: number | null;
    action: string;
    entityType: string;
    entityId: number | null;
    oldValue: string | null;
    newValue: string | null;
    metadata: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    id: number;
} | null>;
export {};
//# sourceMappingURL=auditService.d.ts.map