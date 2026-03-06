import { describe, it, expect } from 'vitest';
import { ValidatorUtil } from '../../src/utils/validator.util';

describe('ValidatorUtil', () => {
  describe('isValidUrl', () => {
    it('应该验证有效的HTTP URL', () => {
      expect(ValidatorUtil.isValidUrl('http://example.com')).toBe(true);
      expect(ValidatorUtil.isValidUrl('http://localhost:3000')).toBe(true);
      expect(ValidatorUtil.isValidUrl('http://192.168.1.1:8080')).toBe(true);
    });

    it('应该验证有效的HTTPS URL', () => {
      expect(ValidatorUtil.isValidUrl('https://example.com')).toBe(true);
      expect(ValidatorUtil.isValidUrl('https://api.example.com/v1')).toBe(true);
    });

    it('应该拒绝无效的URL', () => {
      expect(ValidatorUtil.isValidUrl('ftp://example.com')).toBe(false);
      expect(ValidatorUtil.isValidUrl('not-a-url')).toBe(false);
      expect(ValidatorUtil.isValidUrl('')).toBe(false);
    });
  });

  describe('isValidPort', () => {
    it('应该验证有效的端口号', () => {
      expect(ValidatorUtil.isValidPort(80)).toBe(true);
      expect(ValidatorUtil.isValidPort(3000)).toBe(true);
      expect(ValidatorUtil.isValidPort(65535)).toBe(true);
      expect(ValidatorUtil.isValidPort('8080')).toBe(true);
    });

    it('应该拒绝无效的端口号', () => {
      expect(ValidatorUtil.isValidPort(0)).toBe(false);
      expect(ValidatorUtil.isValidPort(-1)).toBe(false);
      expect(ValidatorUtil.isValidPort(65536)).toBe(false);
      expect(ValidatorUtil.isValidPort('abc')).toBe(false);
    });
  });

  describe('isValidModuleName', () => {
    it('应该验证有效的模块名', () => {
      expect(ValidatorUtil.isValidModuleName('my-module')).toBe(true);
      expect(ValidatorUtil.isValidModuleName('my_module')).toBe(true);
      expect(ValidatorUtil.isValidModuleName('@scope/module')).toBe(true);
      expect(ValidatorUtil.isValidModuleName('module.1')).toBe(true);
    });

    it('应该拒绝无效的模块名', () => {
      expect(ValidatorUtil.isValidModuleName('My-Module')).toBe(false); // 大写字母
      expect(ValidatorUtil.isValidModuleName('module space')).toBe(false); // 空格
      expect(ValidatorUtil.isValidModuleName('')).toBe(false);
      expect(ValidatorUtil.isValidModuleName('a'.repeat(215))).toBe(false); // 超长
    });
  });

  describe('isValidVersion', () => {
    it('应该验证有效的语义化版本', () => {
      expect(ValidatorUtil.isValidVersion('1.0.0')).toBe(true);
      expect(ValidatorUtil.isValidVersion('2.3.4')).toBe(true);
      expect(ValidatorUtil.isValidVersion('1.0.0-alpha')).toBe(true);
      expect(ValidatorUtil.isValidVersion('1.0.0-beta.1')).toBe(true);
      expect(ValidatorUtil.isValidVersion('1.0.0+build')).toBe(true);
    });

    it('应该拒绝无效的版本号', () => {
      expect(ValidatorUtil.isValidVersion('1.0')).toBe(false);
      expect(ValidatorUtil.isValidVersion('v1.0.0')).toBe(false);
      expect(ValidatorUtil.isValidVersion('')).toBe(false);
      expect(ValidatorUtil.isValidVersion('1.0.0.0')).toBe(false);
    });
  });

  describe('isValidToken', () => {
    it('应该验证有效的JWT Token', () => {
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(ValidatorUtil.isValidToken(validToken)).toBe(true);
    });

    it('应该拒绝无效的Token', () => {
      expect(ValidatorUtil.isValidToken('')).toBe(false);
      expect(ValidatorUtil.isValidToken('invalid')).toBe(false);
      expect(ValidatorUtil.isValidToken('a.b')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      expect(ValidatorUtil.isValidEmail('user@example.com')).toBe(true);
      expect(ValidatorUtil.isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(ValidatorUtil.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('应该拒绝无效的邮箱地址', () => {
      expect(ValidatorUtil.isValidEmail('')).toBe(false);
      expect(ValidatorUtil.isValidEmail('invalid')).toBe(false);
      expect(ValidatorUtil.isValidEmail('@example.com')).toBe(false);
      expect(ValidatorUtil.isValidEmail('user@')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('应该评估强密码', () => {
      const result = ValidatorUtil.validatePasswordStrength('StrongP@ssw0rd!');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('应该评估中等密码', () => {
      const result = ValidatorUtil.validatePasswordStrength('Password1');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('应该评估弱密码', () => {
      const result = ValidatorUtil.validatePasswordStrength('123456');
      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.issues).toContain('密码长度至少8位');
    });
  });

  describe('sanitizeInput', () => {
    it('应该清理恶意输入', () => {
      expect(ValidatorUtil.sanitizeInput('normal')).toBe('normal');
      expect(ValidatorUtil.sanitizeInput('rm -rf /')).toBe('rm -rf /');
      expect(ValidatorUtil.sanitizeInput('test\ncommand')).toBe('testcommand');
      expect(ValidatorUtil.sanitizeInput('test; command')).toBe('test command');
    });
  });

  describe('generateSecureRandom', () => {
    it('应该生成安全的随机字符串', () => {
      const random1 = ValidatorUtil.generateSecureRandom(32);
      const random2 = ValidatorUtil.generateSecureRandom(32);
      expect(random1).toHaveLength(64); // hex编码，32字节=64字符
      expect(random2).toHaveLength(64);
      expect(random1).not.toBe(random2);
    });
  });
});
