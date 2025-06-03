/// <reference types="vitest" />
/// <reference path="./jest-dom.d.ts" />

// No need to import TestingLibraryMatchers since I  defined the matchers directly
// in jest-dom.d.ts

declare global {
    namespace Vi {
        interface JestAssertion<T = any> {
            // Matchers are already defined in jest-dom.d.ts
        }
    }
}
