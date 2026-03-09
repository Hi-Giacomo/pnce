import * as crypto from 'crypto';

/**
 * 输入验证工具类
 */
export class ValidatorUtil {
  /**
   * 验证 URL 格式
   */
  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 验证端口号
   */
  static isValidPort(port: number | string): boolean {
    const portNum = typeof port === 'string' ? parseInt(port) : port;
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
  }

  /**
   * 验证模块名称
   * 遵循 npm 包命名规范
   */
  static isValidModuleName(name: string): boolean {
    // npm 包名规则：1-214字符，小写字母、数字、下划线、连字符、点
    const regex = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
    return regex.test(name) && name.length <= 214;
  }

  /**
   * 验证版本号（语义化版本）
   */
  static isValidVersion(version: string): boolean {
    const regex =
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return regex.test(version);
  }

  /**
   * 验证文件路径
   */
  static isValidPath(path: string): boolean {
    if (!path || path.length === 0) {
      return false;
    }
    // 基本的路径验证
    return !path.includes('\0') && path.length < 260;
  }

  /**
   * 验证 Token 格式（JWT）
   */
  static isValidToken(token: string): boolean {
    if (!token || token.length < 10) {
      return false;
    }
    // JWT 格式：header.payload.signature
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * 验证邮箱地址
   */
  static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * 验证密码强度
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    if (password.length < 8) {
      issues.push('密码长度至少8位');
    } else {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      issues.push('缺少小写字母');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      issues.push('缺少大写字母');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      issues.push('缺少数字');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      issues.push('缺少特殊字符');
    }

    let strength: 'weak' | 'medium' | 'strong';
    if (score <= 2) {
      strength = 'weak';
    } else if (score <= 4) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return {
      valid: score >= 4,
      strength,
      issues,
    };
  }

  /**
   * 验证 JSON 格式
   */
  static isValidJSON(json: string): boolean {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证并清理输入（防止命令注入）
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[\n\r\t]/g, '') // 移除换行符
      .replace(/[;&|`$()]/g, '') // 移除特殊字符
      .trim();
  }

  /**
   * 验证 IP 地址
   */
  static isValidIP(ip: string): boolean {
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex =
      /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * 生成安全的随机字符串
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 验证目录路径是否安全
   */
  static isSafePath(path: string): boolean {
    // 防止路径遍历攻击
    const normalized = path.replace(/\\/g, '/');
    return !normalized.includes('../') && !normalized.includes('..\\');
  }
}
