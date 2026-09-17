const formatterCache = new Map<string, Intl.DateTimeFormat>();

type ZonedParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

const getFormatter = (timeZone: string) => {
    let formatter = formatterCache.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        });
        formatterCache.set(timeZone, formatter);
    }
    return formatter;
};

export const isValidTimeZone = (timeZone: string): boolean => {
    try {
        getFormatter(timeZone).format(new Date());
        return true;
    } catch {
        return false;
    }
};

export const normalizeTimeZone = (timeZone?: string | null): string => {
    const candidate = timeZone?.trim() || 'UTC';
    return isValidTimeZone(candidate) ? candidate : 'UTC';
};

export const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
    const parts = getFormatter(normalizeTimeZone(timeZone)).formatToParts(date);
    const values = Object.fromEntries(
        parts
            .filter(part => part.type !== 'literal')
            .map(part => [part.type, part.value])
    );

    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day),
        hour: Number(values.hour),
        minute: Number(values.minute),
        second: Number(values.second)
    };
};

export const zonedDateTimeToUtc = (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    timeZone: string
): Date => {
    const zone = normalizeTimeZone(timeZone);
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    let guess = desiredAsUtc;

    for (let i = 0; i < 3; i += 1) {
        const observed = getZonedParts(new Date(guess), zone);
        const observedAsUtc = Date.UTC(
            observed.year,
            observed.month - 1,
            observed.day,
            observed.hour,
            observed.minute,
            observed.second
        );
        const delta = desiredAsUtc - observedAsUtc;
        if (delta === 0) break;
        guess += delta;
    }

    return new Date(guess);
};

const localCalendarDate = (date: Date, timeZone: string): Date => {
    const parts = getZonedParts(date, timeZone);
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

export const getPeriodStart = (
    period: 'weekly' | 'monthly' | 'yearly',
    timeZone: string,
    now = new Date()
): Date => {
    const zone = normalizeTimeZone(timeZone);
    const local = localCalendarDate(now, zone);

    if (period === 'weekly') {
        const dayOfWeek = local.getUTCDay();
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        local.setUTCDate(local.getUTCDate() - daysSinceMonday);
    } else if (period === 'yearly') {
        local.setUTCMonth(0, 1);
    } else {
        local.setUTCDate(1);
    }

    return zonedDateTimeToUtc(
        local.getUTCFullYear(),
        local.getUTCMonth() + 1,
        local.getUTCDate(),
        0,
        0,
        0,
        zone
    );
};

export const getRollingStart = (
    period: 'week' | 'month' | 'year' | 'all',
    timeZone: string,
    now = new Date()
): Date | null => {
    if (period === 'all') return null;

    const zone = normalizeTimeZone(timeZone);
    const local = localCalendarDate(now, zone);

    if (period === 'week') {
        local.setUTCDate(local.getUTCDate() - 7);
    } else if (period === 'month') {
        local.setUTCMonth(local.getUTCMonth() - 1);
    } else if (period === 'year') {
        local.setUTCFullYear(local.getUTCFullYear() - 1);
    }

    return zonedDateTimeToUtc(
        local.getUTCFullYear(),
        local.getUTCMonth() + 1,
        local.getUTCDate(),
        0,
        0,
        0,
        zone
    );
};

export const dateKeyInTimeZone = (date: Date, timeZone: string): string => {
    const parts = getZonedParts(date, timeZone);
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

export const monthKeyInTimeZone = (date: Date, timeZone: string): string => {
    const parts = getZonedParts(date, timeZone);
    return `${parts.year}-${String(parts.month).padStart(2, '0')}`;
};

export const getCurrentMonthWindow = (timeZone: string, now = new Date()) => {
    const zone = normalizeTimeZone(timeZone);
    const parts = getZonedParts(now, zone);
    const start = zonedDateTimeToUtc(parts.year, parts.month, 1, 0, 0, 0, zone);
    const nextMonth = new Date(Date.UTC(parts.year, parts.month, 1));
    const endExclusive = zonedDateTimeToUtc(
        nextMonth.getUTCFullYear(),
        nextMonth.getUTCMonth() + 1,
        1,
        0,
        0,
        0,
        zone
    );

    const previousMonth = new Date(Date.UTC(parts.year, parts.month - 2, 1));
    const previousStart = zonedDateTimeToUtc(
        previousMonth.getUTCFullYear(),
        previousMonth.getUTCMonth() + 1,
        1,
        0,
        0,
        zone
    );

    return {
        start,
        endExclusive,
        previousStart,
        previousEndExclusive: start,
        year: parts.year,
        month: parts.month
    };
};
