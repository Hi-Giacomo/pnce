import * as crypto from 'crypto';

/**
 * InputValidateUtilityClass
 */
export class ValidatorUtil {
  /**
   * Validate URL Format
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
   * ValidatePort
   */
  static isValidPort(port: number | string): boolean {
    const portNum = typeof port === 'string' ? parseInt(port) : port;
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
  }

  /**
   * ValidatemoduleName
   *  npm PackageSpecification
   */
  static isValidModuleName(name: string): boolean {
    // npm PackageRule：1-214，、Number、、、
    const regex = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
    return regex.test(name) && name.length <= 214;
  }

  /**
   * Validateversion（version）
   */
  static isValidversion(version: string): boolean {
    const regex =
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return regex.test(version);
  }

  /**
   * ValidatefilePath
   */
  static isValidPath(path: string): boolean {
    if (!path || path.length === 0) {
      return false;
    }
    // PathValidate
    return !path.includes('\0') && path.length < 260;
  }

  /**
   * Validate Token Format（JWT）
   */
  static isValidToken(token: string): boolean {
    if (!token || token.length < 10) {
      return false;
    }
    // JWT Format：header.payload.signature
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * ValidateURL
   */
  static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validate
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    if (password.length < 8) {
      issues.push('Password must be at least 8 characters');
    } else {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      issues.push('Missing lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      issues.push('Missing uppercase letters');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      issues.push('Missing numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      issues.push('Missing special characters');
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
   * Validate JSON Format
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
   * ValidateCleanInput（）
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[\n\r\t]/g, '') //
      .replace(/[;&|`$()]/g, '') //
      .trim();
  }

  /**
   * Validate IP URL
   */
  static isValidIP(ip: string): boolean {
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex =
      /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * SecurityRandomString
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * ValidateDirectoryPathYes/NoSecurity
   */
  static isSafePath(path: string): boolean {
    // Path
    const normalized = path.replace(/\\/g, '/');
    return !normalized.includes('../') && !normalized.includes('..\\');
  }
}
