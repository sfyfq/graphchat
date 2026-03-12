# Refined Prompt: Testing Framework Implementation

Implement a comprehensive testing framework for the GraphChat project using Vitest, tailored for a Vite + React + TypeScript and Cloudflare Worker stack.

## Goal:
Configure Vitest for unit, component, and worker testing, including coverage reporting. Ensure a smooth developer experience and zero-regression capability.

## Technical Details:
- **Test Runner**: Vitest (shared config with Vite).
- **Environment**: `happy-dom` for frontend, `miniflare` or the Cloudflare Vitest plugin for worker tests.
- **Libraries**:
    - `@testing-library/react` and `@testing-library/jest-dom` for React components.
    - `@vitest/coverage-v8` for coverage reporting.
- **Coverage**: Target at least 80% coverage for core utility functions (e.g., `src/lib/squash.ts`).
- **Scripts**:
    - `npm test`: Run all tests once.
    - `npm test:watch`: Run tests in watch mode.
    - `npm test:coverage`: Run tests and generate coverage report.

## Tasks:
1.  Install necessary devDependencies (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `happy-dom`, `@vitest/coverage-v8`).
2.  Configure `vite.config.ts` to include Vitest settings.
3.  Add a `vitest.setup.ts` to initialize `jest-dom` matchers.
4.  Implement example tests:
    - **Utility Test**: `src/lib/squash.test.ts` to verify the complex squash logic.
    - **Component Test**: `src/components/Tooltip.test.tsx` to verify standard UI behavior.
    - **Worker Test**: `worker/index.test.ts` to verify proxy logic (if possible with Vitest/Miniflare).
5.  Update `package.json` with the new test scripts.
