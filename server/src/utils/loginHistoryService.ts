import prisma from './prisma';
import { Request } from 'express';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export function getClientIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || 'Unknown';
}

export async function checkAccountLockout(userId: number, req: Request) {
    const ipAddress = getClientIp(req);
    const lockoutWindow = new Date(Date.now() - LOCKOUT_DURATION_MS);

    const latestSuccess = await prisma.loginHistory.findFirst({
        where: {
            userId,
            ipAddress,
            success: true,
            createdAt: { gte: lockoutWindow }
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
    });

    const failureStart = latestSuccess && latestSuccess.createdAt > lockoutWindow
        ? latestSuccess.createdAt
        : lockoutWindow;

    const [recentFailures, lastFailure] = await Promise.all([
        prisma.loginHistory.count({
            where: {
                userId,
                ipAddress,
                success: false,
                createdAt: { gt: failureStart }
            }
        }),
        prisma.loginHistory.findFirst({
            where: {
                userId,
                ipAddress,
                success: false,
                createdAt: { gt: failureStart }
            },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    if (recentFailures >= MAX_FAILED_ATTEMPTS && lastFailure) {
        const lockoutEnd = new Date(lastFailure.createdAt.getTime() + LOCKOUT_DURATION_MS);
        const remainingMs = lockoutEnd.getTime() - Date.now();
        if (remainingMs > 0) {
            return {
                isLocked: true,
                remainingTime: Math.ceil(remainingMs / 1000 / 60),
                failedAttempts: recentFailures
            };
        }
    }

    return {
        isLocked: false,
        remainingTime: 0,
        failedAttempts: recentFailures
    };
}

export function parseUserAgent(userAgent: string) {
    if (!userAgent) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };

    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        device = /iPad|Tablet/i.test(userAgent) ? 'Tablet' : 'Mobile';
    }

    if (/Firefox\//i.test(userAgent)) browser = 'Firefox';
    else if (/Edg\//i.test(userAgent)) browser = 'Edge';
    else if (/Chrome\//i.test(userAgent)) browser = 'Chrome';
    else if (/Safari\//i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
    else if (/MSIE|Trident/i.test(userAgent)) browser = 'Internet Explorer';

    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac OS X/i.test(userAgent)) os = 'macOS';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';

    return { device, browser, os };
}

export async function logLogin(userId: number, req: Request, success = true) {
    try {
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = getClientIp(req);
        const { device, browser, os } = parseUserAgent(userAgent);

        await prisma.loginHistory.create({
            data: {
                userId,
                ipAddress,
                userAgent: userAgent.substring(0, 500),
                device,
                browser,
                os,
                success
            }
        });
    } catch (error: any) {
        console.error('Failed to log login history:', error.message);
    }
}

export async function logFailedLogin(userId: number, req: Request) {
    return logLogin(userId, req, false);
}

export async function getLoginHistory(userId: number, limit = 20) {
    return prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 100),
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

export async function detectSuspiciousActivity(userId: number) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentFailures = await prisma.loginHistory.count({
        where: {
            userId,
            success: false,
            createdAt: { gte: oneHourAgo }
        }
    });

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

export async function isNewDeviceOrLocation(userId: number, req: Request) {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const { device, browser, os } = parseUserAgent(userAgent);

    const [existingFromIp, existingDevice] = await Promise.all([
        prisma.loginHistory.findFirst({
            where: { userId, ipAddress, success: true }
        }),
        prisma.loginHistory.findFirst({
            where: { userId, device, browser, os, success: true }
        })
    ]);

    return {
        isNewIp: !existingFromIp,
        isNewDevice: !existingDevice,
        isNew: !existingFromIp || !existingDevice
    };
}
