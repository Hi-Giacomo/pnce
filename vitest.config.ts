import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'scripts/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/templates/',
        'src/templates/',
      ],
      lines: 80, // 生产级覆盖率目标
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
});
