import { cn } from './utils';
import { describe, it, expect } from 'vitest';

describe('cn utility', () => {
    it('merges class names correctly', () => {
        const result = cn('flex', 'justify-center');
        expect(result).toBe('flex justify-center');
    });

    it('handles conditional classes', () => {
        const result = cn('flex', false && 'justify-center', 'items-center');
        expect(result).toBe('flex items-center');
    });

    it('merges tailwind classes using tailwind-merge', () => {
        const result = cn('p-4', 'p-2');
        expect(result).toBe('p-2');
    });
});
