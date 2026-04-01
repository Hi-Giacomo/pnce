const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintPluginPrettier = require('eslint-plugin-prettier');
const nestjsPlugin = require('@nestjs/eslint-plugin-nestjs-typed');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-empty': 'off',
      'no-throw-literal': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
    },
  },
  // NestJS app configuration
  {
    files: ['src/app/**/*.ts'],
    plugins: {
      '@nestjs/typed': nestjsPlugin,
    },
    rules: {
      '@nestjs/typed/no-typed-lifecycle-methods': 'warn',
      '@nestjs/typed/no-suffix-in-controller-names': 'warn',
      '@nestjs/typed/no-unnecessary-prefix-in-controller-names': 'warn',
      '@nestjs/typed/typed-event-emitter-decorator': 'warn',
      '@nestjs/typed/no-singular-cycle-injectable-decorator': 'warn',
      '@nestjs/typed/no-duplicate-injectable-decorator': 'error',
      '@nestjs/typed/no-complex-injection-token': 'warn',
      '@nestjs/typed/injectable-class-name': 'warn',
      '@nestjs/typed/provided-in-invalid-range': 'error',
    },
  },
  // Template files - relaxed rules
  {
    files: ['src/templates/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'prefer-const': 'off',
    },
  },
  // Ignore patterns
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.js',
      'coverage/',
      'tests/',
      'temp/',
      '**/temp/',
      '**/*/temp/',
      'src/app/node_modules/',
      'src/app/dist/',
      'src/app/coverage/',
      'src/app/*.js',
      'src/app/tsconfig.tsbuildinfo',
      'src/app/*.json',
      '!src/app/package.json',
      '!src/app/tsconfig.json',
      '!src/app/nest-cli.json',
    ],
  },
];
