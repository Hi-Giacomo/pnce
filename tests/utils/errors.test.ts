import { describe, it, expect } from 'vitest';
import { CliError, ErrorCode } from '../../src/utils/errors';

describe('Error Classes', () => {
  describe('CliError', () => {
    it('should create error with code and message', () => {
      const error = new CliError('E001', 'Test error');
      expect(error.code).toBe('E001');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('CliError');
      expect(error.exitCode).toBe(1);
    });

    it('should create error with custom exit code', () => {
      const error = new CliError('E002', 'Fatal error', 2);
      expect(error.code).toBe('E002');
      expect(error.exitCode).toBe(2);
    });

    it('should create error with details', () => {
      const error = new CliError('E003', 'Error with details', 1, { field: 'value' });
      expect(error.details).toEqual({ field: 'value' });
    });
  });

  describe('CliError Static Methods', () => {
    it('should create unauthorized error', () => {
      const error = CliError.unauthorized();
      expect(error.code).toBe('AUTH_UNAUTHORIZED');
      expect(error.exitCode).toBe(1); // 标准 CLI 退出码
    });

    it('should create token expired error', () => {
      const error = CliError.tokenExpired();
      expect(error.code).toBe('AUTH_TOKEN_EXPIRED');
    });

    it('should create network error', () => {
      const error = CliError.networkError();
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should create module not found error', () => {
      const error = CliError.moduleNotFound('test-module');
      expect(error.code).toBe('MODULE_NOT_FOUND');
      expect(error.details).toEqual({ name: 'test-module' });
    });

    it('should create config error', () => {
      const error = CliError.configError();
      expect(error.code).toBe('CONFIG_ERROR');
    });
  });
});
