# TODO: Implementation Plan for Testing Framework

## Phase 1: Setup & Dependencies
- [x] Install devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `happy-dom`, `@vitest/coverage-v8`.
- [x] Create `vitest.setup.ts` to include `@testing-library/jest-dom`.
- [x] Modify `vite.config.ts` to include `test` configuration (environment, setup file).
- [x] Update `package.json` with `test`, `test:watch`, and `test:coverage` scripts.

## Phase 2: Frontend Tests
- [x] Implement `src/lib/squash.test.ts` for unit testing the complex squash logic.
- [x] Implement `src/components/Tooltip.test.tsx` for component testing.
- [x] (Optional) Add tests for `src/lib/utils.ts` or `src/lib/storage.ts`.

## Phase 3: Worker Tests
- [x] Install `@cloudflare/vitest-pool-workers` for idiomatic Cloudflare Worker testing.
- [x] Create `worker/vitest.config.ts` for the worker directory.
- [x] Implement `worker/index.test.ts` to test the proxy logic (mocking `fetch` and Gemini responses).

## Phase 4: Verification & Coverage
- [x] Run `npm test` to ensure all tests pass.
- [x] Run `npm run test:coverage` to verify coverage reporting.
- [x] Ask the user for feedback and finalize.
