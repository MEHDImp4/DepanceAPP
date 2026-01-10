import { Request } from 'express';
/**
 * Check if account is locked due to too many failed attempts
 * Returns { isLocked, remainingTime, failedAttempts }
 */
export declare function checkAccountLockout(userId: number): Promise<{
    isLocked: boolean;
    remainingTime: number;
    failedAttempts: number;
}>;
/**
 * Parse user agent string to extract device info
 * Basic parsing - for production, consider using 'ua-parser-js' package
 */
export declare function parseUserAgent(userAgent: string): {
    device: string;
    browser: string;
    os: string;
};
/**
 * Get client IP address from request
 */
export declare function getClientIp(req: Request): string;
/**
 * Log a login attempt
 */
export declare function logLogin(userId: number, req: Request, success?: boolean): Promise<void>;
/**
 * Log a failed login attempt (when user exists but password is wrong)
 */
export declare function logFailedLogin(userId: number, req: Request): Promise<void>;
/**
 * Get login history for a user
 */
export declare function getLoginHistory(userId: number, limit?: number): Promise<{
    ipAddress: string;
    createdAt: Date;
    id: number;
    success: boolean;
    device: string | null;
    browser: string | null;
    os: string | null;
}[]>;
/**
 * Detect suspicious activity patterns
 */
export declare function detectSuspiciousActivity(userId: number): Promise<{
    type: string;
    severity: string;
    message: string;
}[]>;
/**
 * Check if this is a new device/location for the user
 */
export declare function isNewDeviceOrLocation(userId: number, req: Request): Promise<{
    isNewIp: boolean;
    isNewDevice: boolean;
    isNew: boolean;
}>;
//# sourceMappingURL=loginHistoryService.d.ts.map