import prisma from './prisma';
import { Request } from 'express';

// Rate limiting configuration
const MAX_FAILED_ATTEMPTS = 5;  // Max failed attempts before lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;  // 15 minutes lockout

/**
 * Check if account is locked due to too many failed attempts
 * Returns { isLocked, remainingTime, failedAttempts }
 */
export async function checkAccountLockout(userId: number) {
    const lockoutWindow = new Date(Date.now() - LOCKOUT_DURATION_MS);

    const recentFailures = await prisma.loginHistory.count({
        where: {
            userId,
            success: false,
            createdAt: { gte: lockoutWindow }
        }
    });

    if (recentFailures >= MAX_FAILED_ATTEMPTS) {
        // Get the most recent failure to calculate remaining lockout time
        const lastFailure = await prisma.loginHistory.findFirst({
            where: {
                userId,
                success: false,
                createdAt: { gte: lockoutWindow }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (lastFailure) {
            const lockoutEnd = new Date(lastFailure.createdAt.getTime() + LOCKOUT_DURATION_MS);
            const remainingMs = lockoutEnd.getTime() - Date.now();

            if (remainingMs > 0) {
                return {
                    isLocked: true,
                    remainingTime: Math.ceil(remainingMs / 1000 / 60), // minutes
                    failedAttempts: recentFailures
                };
            }
        }
    }

    return {
        isLocked: false,
        remainingTime: 0,
        failedAttempts: recentFailures
    };
}

/**
 * Parse user agent string to extract device info
 * Basic parsing - for production, consider using 'ua-parser-js' package
 */
export function parseUserAgent(userAgent: string) {
    if (!userAgent) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };

    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect device type
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        device = /iPad|Tablet/i.test(userAgent) ? 'Tablet' : 'Mobile';
    }

    // Detect browser
    if (/Firefox\//i.test(userAgent)) browser = 'Firefox';
    else if (/Edg\//i.test(userAgent)) browser = 'Edge';
    else if (/Chrome\//i.test(userAgent)) browser = 'Chrome';
    else if (/Safari\//i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
    else if (/MSIE|Trident/i.test(userAgent)) browser = 'Internet Explorer';

    // Detect OS
    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac OS X/i.test(userAgent)) os = 'macOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

    return { device, browser, os };
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request): string {
    // Check for forwarded IP (when behind proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return (forwarded as string).split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'Unknown';
}

/**
 * Log a login attempt
 */
export async function logLogin(userId: number, req: Request, success = true) {
    try {
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = getClientIp(req);
        const { device, browser, os } = parseUserAgent(userAgent);

        await prisma.loginHistory.create({
            data: {
                userId,
                ipAddress,
                userAgent: userAgent.substring(0, 500), // Limit length
                device,
                browser,
                os,
                success
            }
        });
    } catch (error: any) {
        // Log but don't fail the login
        console.error('Failed to log login history:', error.message);
    }
}

/**
 * Log a failed login attempt (when user exists but password is wrong)
 */
export async function logFailedLogin(userId: number, req: Request) {
    return logLogin(userId, req, false);
}

/**
 * Get login history for a user
 */
export async function getLoginHistory(userId: number, limit = 20) {
    return prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            ipAddress: true,
            device: true,
            browser: true,
            os: true,
            success: true,
            createdAt: true
        }
    });
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(userId: number) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for multiple failed login attempts in the last hour
    const recentFailures = await prisma.loginHistory.count({
        where: {
            userId,
            success: false,
            createdAt: { gte: oneHourAgo }
        }
    });

    // Check for logins from many different IPs in the last 24 hours
    const recentLogins = await prisma.loginHistory.findMany({
        where: {
            userId,
            success: true,
            createdAt: { gte: oneDayAgo }
        },
        select: { ipAddress: true },
        distinct: ['ipAddress']
    });

    const alerts = [];

    if (recentFailures >= 5) {
        alerts.push({
            type: 'multiple_failed_logins',
            severity: 'high',
            message: `${recentFailures} failed login attempts in the last hour`
        });
    }

    if (recentLogins.length >= 5) {
        alerts.push({
            type: 'multiple_locations',
            severity: 'medium',
            message: `Logins from ${recentLogins.length} different IP addresses in the last 24 hours`
        });
    }

    return alerts;
}

/**
 * Check if this is a new device/location for the user
 */
export async function isNewDeviceOrLocation(userId: number, req: Request) {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const { device, browser, os } = parseUserAgent(userAgent);

    // Check if we've seen this IP before
    const existingFromIp = await prisma.loginHistory.findFirst({
        where: {
            userId,
            ipAddress,
            success: true
        }
    });

    // Check if we've seen this device/browser/os combo before
    const existingDevice = await prisma.loginHistory.findFirst({
        where: {
            userId,
            device,
            browser,
            os,
            success: true
        }
    });

    return {
        isNewIp: !existingFromIp,
        isNewDevice: !existingDevice,
        isNew: !existingFromIp || !existingDevice
    };
}
