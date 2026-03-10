/**
 * CLI Error class - Unified error handling system
 */
export class CliError extends Error {
  public readonly code: string;
  public readonly exitCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    exitCode: number = 1,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.exitCode = exitCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  // Static methods for quick creation of common errors (using standard exit codes)
  static unauthorized(message = 'Unauthorized, please login first') {
    return new CliError('AUTH_UNAUTHORIZED', message, 1);
  }

  static tokenExpired(message = 'Token expired, please login again') {
    return new CliError('AUTH_TOKEN_EXPIRED', message, 1);
  }

  static networkError(message = 'Network request failed') {
    return new CliError('NETWORK_ERROR', message, 2);
  }

  static moduleNotFound(name: string) {
    return new CliError('MODULE_NOT_FOUND', `module "${name}" not found`, 3, { name });
  }

  static versionNotFound(name: string, version: string) {
    return new CliError(
      'VERSION_NOT_FOUND',
      `Version "${version}" of module "${name}" not found`,
      3,
      { name, version }
    );
  }

  static uploadFailed(message = 'Upload failed') {
    return new CliError('UPLOAD_FAILED', message, 4);
  }

  static configError(message = 'Configuration error') {
    return new CliError('CONFIG_ERROR', message, 5);
  }

  static invalidInput(message = 'Invalid input parameter') {
    return new CliError('INVALID_INPUT', message, 6);
  }

  static serverError(message = 'Server error') {
    return new CliError('SERVER_ERROR', message, 7);
  }

  static fileNotFound(path: string) {
    return new CliError('FILE_NOT_FOUND', `File not found: ${path}`, 8, { path });
  }

  static fileAccessDenied(path: string) {
    return new CliError('FILE_ACCESS_DENIED', `Cannot access file: ${path}`, 9, { path });
  }
}

/**
 * Error code specification
 */
export enum ErrorCode {
  // Authentication errors (4xx)
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_LOGIN_FAILED = 'AUTH_LOGIN_FAILED',
  AUTH_REGISTER_FAILED = 'AUTH_REGISTER_FAILED',

  // OAuth2 errors
  OAUTH_REDIRECT_FAILED = 'OAUTH_REDIRECT_FAILED',
  OAUTH_TOKEN_EXCHANGE_FAILED = 'OAUTH_TOKEN_EXCHANGE_FAILED',
  OAUTH_INVALID_STATE = 'OAUTH_INVALID_STATE',

  // module errors
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  VERSION_NOT_FOUND = 'VERSION_NOT_FOUND',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  INVALID_MODULE_FORMAT = 'INVALID_MODULE_FORMAT',

  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',

  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Input errors
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_VERSION = 'INVALID_VERSION',

  // Server errors (5xx)
  SERVER_ERROR = 'SERVER_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Error Handler
 */
export class ErrorHandler {
  private static logger: { error: (message: string, meta?: unknown) => void } | null = null;

  static setLogger(logger: { error: (message: string, meta?: unknown) => void }) {
    this.logger = logger;
  }

  /**
   * Handle error and display user-friendly error message
   */
  static handle(error: unknown, exit: boolean = true): never {
    let cliError: CliError;

    if (error instanceof CliError) {
      cliError = error;
    } else if (error instanceof Error) {
      // Convert regular Error to CliError
      const code = this.inferErrorCode(error.message);
      cliError = new CliError(code, error.message);
    } else {
      cliError = new CliError(ErrorCode.INTERNAL_ERROR, String(error));
    }

    // Log error
    if (this.logger) {
      this.logger.error('CLI Error', {
        code: cliError.code,
        message: cliError.message,
        exitCode: cliError.exitCode,
        details: cliError.details,
        stack: cliError.stack,
      });
    }

    // Display user-friendly error message
    this.displayError(cliError);

    if (exit) {
      process.exit(cliError.exitCode);
    }

    throw cliError;
  }

  /**
   * Non-exit error handling (for recoverable scenarios)
   */
  static handleNonFatal(error: unknown): void {
    let cliError: CliError;

    if (error instanceof CliError) {
      cliError = error;
    } else if (error instanceof Error) {
      const code = this.inferErrorCode(error.message);
      cliError = new CliError(code, error.message);
    } else {
      cliError = new CliError(ErrorCode.INTERNAL_ERROR, String(error));
    }

    if (this.logger) {
      this.logger.error('Non-fatal Error', {
        code: cliError.code,
        message: cliError.message,
        details: cliError.details,
      });
    }

    this.displayError(cliError);
  }

  /**
   * Display error message
   */
  private static displayError(error: CliError) {
    const chalk = require('chalk');
    console.error(chalk.red('✗ Error:'), error.message);

    if (error.details && Object.keys(error.details).length > 0) {
      console.error(chalk.gray('Details:'));
      Object.entries(error.details).forEach(([key, value]) => {
        console.error(chalk.gray(`  ${key}: ${value}`));
      });
    }

    // Display help hint
    const hint = this.getHelpHint(error.code);
    if (hint) {
      console.error(chalk.yellow('\nTip:'), hint);
    }
  }

  /**
   * Provide help hints based on error code
   */
  private static getHelpHint(code: string): string | null {
    const hints: Record<string, string> = {
      AUTH_UNAUTHORIZED: 'Please login using `pnce login`',
      AUTH_TOKEN_EXPIRED: 'Please login again using `pnce login`',
      MODULE_NOT_FOUND: 'Check module name or use `pnce list` to view available modules',
      VERSION_NOT_FOUND: 'Use `pnce info <name>` to view available versions',
      UPLOAD_FAILED: 'Check network connection and module format, ensure project is properly configured',
      CONFIG_ERROR: 'Check configuration file or run `pnce init` to initialize configuration',
      NETWORK_ERROR: 'Check network connection or try again later',
      TIMEOUT_ERROR: 'Request timed out, check network or try again later',
      INVALID_INPUT: 'Check if input parameters are correct',
      FILE_NOT_FOUND: 'Check if file path is correct',
      FILE_ACCESS_DENIED: 'Check file permissions',
      INTERNAL_ERROR: 'Unknown error occurred, please retry or contact support team',
    };

    return hints[code] || null;
  }

  /**
   * Infer error code from error message
   */
  private static inferErrorCode(message: string): ErrorCode {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('token') && lowerMessage.includes('expired')) {
      return ErrorCode.AUTH_TOKEN_EXPIRED;
    }
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
      return ErrorCode.AUTH_UNAUTHORIZED;
    }
    if (lowerMessage.includes('timeout')) {
      return ErrorCode.TIMEOUT_ERROR;
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return ErrorCode.NETWORK_ERROR;
    }

    return ErrorCode.INTERNAL_ERROR;
  }

  /**
   * Async error wrapper - for error handling in async functions
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof CliError) {
        throw error;
      }
      throw new CliError(ErrorCode.INTERNAL_ERROR, errorMessage, 500);
    }
  }
}
