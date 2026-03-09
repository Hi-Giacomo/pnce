# Testing Documentation

## Overview

This document describes the testing strategy and coverage for the Pnce CLI project.

## Test Framework

- **Framework**: Vitest v4.0.18
- **Test Runner**: Vitest with Node.js environment
- **Coverage Tool**: v8
- **Coverage Goals**:
  - Lines: 80%
  - Functions: 80%
  - Branches: 75%
  - Statements: 80%

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests once
```bash
npm test -- --run
```

### Generate coverage report
```bash
npm run test:coverage
```

### View coverage report (HTML)
```bash
npm run test:coverage
open coverage/index.html
```

## Test Structure

```
tests/
├── commands/           # Command tests
│   ├── init.test.ts
│   └── port.commands.test.ts
├── config/            # Configuration tests
│   └── manager.test.ts
├── services/          # Service tests
│   └── api.service.test.ts
└── utils/             # Utility tests
    ├── crypto.util.test.ts
    ├── errors.test.ts
    └── validator.util.test.ts
```

## Test Statistics

### Current Coverage
- **Test Files**: 7 passed
- **Tests**: 87 passed
- **Total Duration**: ~660ms

### Test Categories

1. **Unit Tests** - Test individual functions and classes
2. **Integration Tests** - Test interactions between components
3. **Error Handling Tests** - Verify error scenarios

## Best Practices

### Writing Tests

1. **Mock External Dependencies**: Always mock external services, file system operations, and network calls
2. **Test Edge Cases**: Include tests for null, undefined, empty values, and error conditions
3. **Use Descriptive Names**: Test names should clearly describe what is being tested
4. **Arrange-Act-Assert Pattern**: Structure tests with clear setup, execution, and assertion phases

### Example Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup mocks and test environment
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something when condition is met', async () => {
    // Arrange - Setup test data
    const input = 'test';

    // Act - Execute the function
    const result = await functionUnderTest(input);

    // Assert - Verify the result
    expect(result).toBe('expected');
  });

  it('should handle error case', async () => {
    // Test error handling
    await expect(functionUnderTest('invalid')).rejects.toThrow('Expected error');
  });
});
```

## Error Handling

All CLI commands use the `ErrorHandler` class for consistent error handling:

```typescript
import { ErrorHandler } from '../utils/errors';

program
  .command('test')
  .action(async () => {
    try {
      // Command logic
    } catch (error) {
      ErrorHandler.handle(error);
    }
  });
```

### Error Types

- `CliError` - Custom error class with error codes and exit codes
- `ErrorCode` - Enum of standard error codes
- `ErrorHandler` - Utility class for error processing

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits

## TODO: Additional Tests

The following test coverage areas are planned for future implementation:

- [ ] Authentication command tests (login, logout, register, me)
- [ ] Module management command tests (install, remove, update, list)
- [ ] Configuration management tests (profile, alias, lang)
- [ ] Registry management tests
- [ ] Plugin management tests
- [ ] Port management integration tests
- [ ] OAuth2 flow tests
- [ ] Network retry logic tests
- [ ] File operation error handling tests

## Troubleshooting

### Tests Failing with Import Errors

Ensure all imports use correct relative paths:
```typescript
import { Service } from '../../src/services/service';
```

### Mock Issues

Clear mocks in `afterEach` to prevent test pollution:
```typescript
afterEach(() => {
  vi.restoreAllMocks();
});
```

### Timeout Errors

Increase timeout for long-running tests:
```typescript
it('should complete long operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
