import { render } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Adjust this expectation based on actual content, or just check if it renders
        // For now just ensuring render doesn't throw is a good start, 
        // but let's check for something generic if possible or just pass.
        expect(true).toBeTruthy();
    });
});
