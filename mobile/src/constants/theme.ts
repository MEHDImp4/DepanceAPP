export type ThemeMode = 'dark' | 'light';

export interface ThemePalette {
    mode: ThemeMode;
    background: string;
    foreground: string;
    card: string;
    cardMuted: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveSoft: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    emerald: string;
    emeraldSoft: string;
    red: string;
    redSoft: string;
    amber: string;
    orange: string;
    pink: string;
    pinkSoft: string;
    orangeSoft: string;
    slate: string;
    slateSoft: string;
    modalSurface: string;
    navGlass: string;
    navBorder: string;
    overlay: string;
    whiteSubtle: string;
    whiteBorder: string;
}

export const DARK_THEME: ThemePalette = {
    mode: 'dark',
    background: '#09090B',
    foreground: '#FAFAFA',
    card: '#18181B',
    cardMuted: 'rgba(24, 24, 27, 0.5)',
    cardForeground: '#FAFAFA',
    popover: '#09090B',
    popoverForeground: '#FAFAFA',
    primary: '#2563EB',
    primaryForeground: '#FAFAFA',
    secondary: '#3F3F46',
    secondaryForeground: '#FAFAFA',
    muted: '#27272A',
    mutedForeground: '#A1A1AA',
    accent: '#27272A',
    accentForeground: '#FAFAFA',
    destructive: '#EF4444',
    destructiveSoft: 'rgba(239, 68, 68, 0.1)',
    destructiveForeground: '#FAFAFA',
    border: '#27272A',
    input: '#27272A',
    ring: '#D4D4D8',
    emerald: '#10B981',
    emeraldSoft: 'rgba(16, 185, 129, 0.12)',
    red: '#EF4444',
    redSoft: 'rgba(239, 68, 68, 0.1)',
    amber: '#F59E0B',
    orange: '#F97316',
    pink: '#EC4899',
    pinkSoft: 'rgba(236, 72, 153, 0.1)',
    orangeSoft: 'rgba(249, 115, 22, 0.1)',
    slate: '#64748B',
    slateSoft: 'rgba(100, 116, 139, 0.1)',
    modalSurface: '#1C1C1E',
    navGlass: 'rgba(24, 24, 27, 0.92)',
    navBorder: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    whiteSubtle: 'rgba(255, 255, 255, 0.05)',
    whiteBorder: 'rgba(255, 255, 255, 0.1)',
};

export const LIGHT_THEME: ThemePalette = {
    mode: 'light',
    background: '#FAFAFA',
    foreground: '#18181B',
    card: '#FFFFFF',
    cardMuted: 'rgba(255, 255, 255, 0.85)',
    cardForeground: '#18181B',
    popover: '#FFFFFF',
    popoverForeground: '#18181B',
    primary: '#2563EB',
    primaryForeground: '#FAFAFA',
    secondary: '#F4F4F5',
    secondaryForeground: '#18181B',
    muted: '#F4F4F5',
    mutedForeground: '#71717A',
    accent: '#F4F4F5',
    accentForeground: '#18181B',
    destructive: '#EF4444',
    destructiveSoft: 'rgba(239, 68, 68, 0.1)',
    destructiveForeground: '#FAFAFA',
    border: '#E4E4E7',
    input: '#E4E4E7',
    ring: '#18181B',
    emerald: '#10B981',
    emeraldSoft: 'rgba(16, 185, 129, 0.12)',
    red: '#EF4444',
    redSoft: 'rgba(239, 68, 68, 0.1)',
    amber: '#F59E0B',
    orange: '#F97316',
    pink: '#EC4899',
    pinkSoft: 'rgba(236, 72, 153, 0.1)',
    orangeSoft: 'rgba(249, 115, 22, 0.1)',
    slate: '#64748B',
    slateSoft: 'rgba(100, 116, 139, 0.1)',
    modalSurface: '#FFFFFF',
    navGlass: 'rgba(255, 255, 255, 0.92)',
    navBorder: 'rgba(24, 24, 27, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    whiteSubtle: 'rgba(24, 24, 27, 0.04)',
    whiteBorder: 'rgba(24, 24, 27, 0.08)',
};

export const FONT_FAMILY = {
    light: 'IBMPlexSans_300Light',
    regular: 'IBMPlexSans_400Regular',
    medium: 'IBMPlexSans_500Medium',
    semibold: 'IBMPlexSans_600SemiBold',
    bold: 'IBMPlexSans_700Bold',
} as const;

export const TAILWIND_COLOR_MAP: Record<string, string> = {
    'bg-red-500': '#EF4444',
    'bg-orange-500': '#F97316',
    'bg-amber-500': '#F59E0B',
    'bg-yellow-500': '#EAB308',
    'bg-lime-500': '#84CC16',
    'bg-green-500': '#22C55E',
    'bg-emerald-500': '#10B981',
    'bg-teal-500': '#14B8A6',
    'bg-cyan-500': '#06B6D4',
    'bg-sky-500': '#0EA5E9',
    'bg-blue-500': '#3B82F6',
    'bg-indigo-500': '#6366F1',
    'bg-pink-500': '#EC4899',
    'bg-rose-500': '#F43F5E',
    'bg-slate-500': '#64748B',
    'bg-gray-400': '#9CA3AF',
    'bg-red-400': '#F87171',
    'bg-primary': '#2563EB',
};

export function resolveColorHex(color?: string | null, fallback = '#2563EB'): string {
    if (!color) return fallback;
    if (color.startsWith('#') || color.startsWith('rgb')) return color;
    return TAILWIND_COLOR_MAP[color] || fallback;
}

export function hexWithOpacity(hex: string, opacity: number): string {
    const resolved = resolveColorHex(hex);
    if (!resolved.startsWith('#')) return resolved;
    const clean = resolved.replace('#', '');
    const full = clean.length === 3
        ? clean.split('').map((c) => c + c).join('')
        : clean;
    const num = parseInt(full, 16);
    if (Number.isNaN(num)) return resolved;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
