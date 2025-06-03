import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';
// Fix for userEvent.setup() issue when running with coverage
import '@testing-library/user-event';

// Set up the DOM environment for userEvent
beforeAll(() => {
    // Mock necessary browser APIs for userEvent to work with coverage
    if (typeof window !== 'undefined') {
        // Mock createRange
        window.document.createRange = () =>
            ({
                setStart: vi.fn(),
                setEnd: vi.fn(),
                commonAncestorContainer: {
                    nodeName: 'BODY',
                    ownerDocument: document,
                },
                getBoundingClientRect: () => ({
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    width: 0,
                    height: 0,
                }),
                getClientRects: () => [],
            }) as unknown as Range;
    }
});

// The jest-dom matchers are automatically extended when importing '@testing-library/jest-dom'
// I  also defined the types in our jest-dom.d.ts file

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
})) as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
})) as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
});
