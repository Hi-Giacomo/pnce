import { describe, it, expect } from 'vitest';
import { ValidatorUtil } from '../../src/utils/validator.util';

describe('ValidatorUtil', () => {
  describe('isValidUrl', () => {
    it('ValidatevalidHTTP URL', () => {
      expect(ValidatorUtil.isValidUrl('http://example.com')).toBe(true);
      expect(ValidatorUtil.isValidUrl('http://localhost:3000')).toBe(true);
      expect(ValidatorUtil.isValidUrl('http://192.168.1.1:8080')).toBe(true);
    });

    it('ValidatevalidHTTPS URL', () => {
      expect(ValidatorUtil.isValidUrl('https://example.com')).toBe(true);
      expect(ValidatorUtil.isValidUrl('https://api.example.com/v1')).toBe(true);
    });

    it('invalidURL', () => {
      expect(ValidatorUtil.isValidUrl('ftp://example.com')).toBe(false);
      expect(ValidatorUtil.isValidUrl('not-a-url')).toBe(false);
      expect(ValidatorUtil.isValidUrl('')).toBe(false);
    });
  });

  describe('isValidPort', () => {
    it('ValidatevalidPort', () => {
      expect(ValidatorUtil.isValidPort(80)).toBe(true);
      expect(ValidatorUtil.isValidPort(3000)).toBe(true);
      expect(ValidatorUtil.isValidPort(65535)).toBe(true);
      expect(ValidatorUtil.isValidPort('8080')).toBe(true);
    });

    it('invalidPort', () => {
      expect(ValidatorUtil.isValidPort(0)).toBe(false);
      expect(ValidatorUtil.isValidPort(-1)).toBe(false);
      expect(ValidatorUtil.isValidPort(65536)).toBe(false);
      expect(ValidatorUtil.isValidPort('abc')).toBe(false);
    });
  });

  describe('isValidModuleName', () => {
    it('Validatevalidmodule', () => {
      expect(ValidatorUtil.isValidModuleName('my-module')).toBe(true);
      expect(ValidatorUtil.isValidModuleName('my_module')).toBe(true);
      expect(ValidatorUtil.isValidModuleName('@scope/module')).toBe(true);
      expect(ValidatorUtil.isValidModuleName('module.1')).toBe(true);
    });

    it('invalidmodule', () => {
      expect(ValidatorUtil.isValidModuleName('My-Module')).toBe(false); // 
      expect(ValidatorUtil.isValidModuleName('module space')).toBe(false); // Empty
      expect(ValidatorUtil.isValidModuleName('')).toBe(false);
      expect(ValidatorUtil.isValidModuleName('a'.repeat(215))).toBe(false); // 
    });
  });

  describe('isValidversion', () => {
    it('Validatevalidversion', () => {
      expect(ValidatorUtil.isValidversion('1.0.0')).toBe(true);
      expect(ValidatorUtil.isValidversion('2.3.4')).toBe(true);
      expect(ValidatorUtil.isValidversion('1.0.0-alpha')).toBe(true);
      expect(ValidatorUtil.isValidversion('1.0.0-beta.1')).toBe(true);
      expect(ValidatorUtil.isValidversion('1.0.0+build')).toBe(true);
    });

    it('invalidversion', () => {
      expect(ValidatorUtil.isValidversion('1.0')).toBe(false);
      expect(ValidatorUtil.isValidversion('v1.0.0')).toBe(false);
      expect(ValidatorUtil.isValidversion('')).toBe(false);
      expect(ValidatorUtil.isValidversion('1.0.0.0')).toBe(false);
    });
  });

  describe('isValidToken', () => {
    it('ValidatevalidJWT Token', () => {
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(ValidatorUtil.isValidToken(validToken)).toBe(true);
    });

    it('invalidToken', () => {
      expect(ValidatorUtil.isValidToken('')).toBe(false);
      expect(ValidatorUtil.isValidToken('invalid')).toBe(false);
      expect(ValidatorUtil.isValidToken('a.b')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('ValidatevalidURL', () => {
      expect(ValidatorUtil.isValidEmail('user@example.com')).toBe(true);
      expect(ValidatorUtil.isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(ValidatorUtil.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('invalidURL', () => {
      expect(ValidatorUtil.isValidEmail('')).toBe(false);
      expect(ValidatorUtil.isValidEmail('invalid')).toBe(false);
      expect(ValidatorUtil.isValidEmail('@example.com')).toBe(false);
      expect(ValidatorUtil.isValidEmail('user@')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('', () => {
      const result = ValidatorUtil.validatePasswordStrength('StrongP@ssw0rd!');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('Medium', () => {
      const result = ValidatorUtil.validatePasswordStrength('Password1');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('', () => {
      const result = ValidatorUtil.validatePasswordStrength('123456');
      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.issues).toContain('Password must be at least 8 characters');
    });
  });

  describe('sanitizeInput', () => {
    it('CleanInput', () => {
      expect(ValidatorUtil.sanitizeInput('normal')).toBe('normal');
      expect(ValidatorUtil.sanitizeInput('rm -rf /')).toBe('rm -rf /');
      expect(ValidatorUtil.sanitizeInput('test\ncommand')).toBe('testcommand');
      expect(ValidatorUtil.sanitizeInput('test; command')).toBe('test command');
    });
  });

  describe('generateSecureRandom', () => {
    it('SecurityRandomString', () => {
      const random1 = ValidatorUtil.generateSecureRandom(32);
      const random2 = ValidatorUtil.generateSecureRandom(32);
      expect(random1).toHaveLength(64); // hexEncoding，32Section=64
      expect(random2).toHaveLength(64);
      expect(random1).not.toBe(random2);
    });
  });
});
