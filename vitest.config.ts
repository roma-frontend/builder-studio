import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { tmpdir } from 'node:os';

// Unit tests run in Node (the app uses node:crypto scrypt + better-sqlite3).
// DB-backed tests get an isolated throwaway SQLite file so they never touch the
// real data/app.db. `@` maps to the repo root (matches tsconfig paths).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'tests/**/*.test.ts'],
    env: {
      DATABASE_FILE: path.join(tmpdir(), `cwk-test-${process.pid}.db`),
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text-summary'],
      include: ['lib/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', 'lib/db/schema.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // `server-only` throws when imported outside a React Server env; stub it.
      'server-only': path.resolve(__dirname, 'tests/empty-module.ts'),
    },
  },
});
