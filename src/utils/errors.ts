/**
 * CLI错误类 - 统一的错误处理系统
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

  // 静态方法快速创建常见错误
  static unauthorized(message = '未授权，请先登录') {
    return new CliError('AUTH_UNAUTHORIZED', message, 401);
  }

  static tokenExpired(message = 'Token已过期，请重新登录') {
    return new CliError('AUTH_TOKEN_EXPIRED', message, 401);
  }

  static networkError(message = '网络请求失败') {
    return new CliError('NETWORK_ERROR', message, 503);
  }

  static moduleNotFound(name: string) {
    return new CliError('MODULE_NOT_FOUND', `模块 "${name}" 不存在`, 404, { name });
  }

  static versionNotFound(name: string, version: string) {
    return new CliError('VERSION_NOT_FOUND', `模块 "${name}" 的版本 "${version}" 不存在`, 404, { name, version });
  }

  static uploadFailed(message = '上传失败') {
    return new CliError('UPLOAD_FAILED', message, 500);
  }

  static configError(message = '配置错误') {
    return new CliError('CONFIG_ERROR', message, 500);
  }

  static invalidInput(message = '输入参数无效') {
    return new CliError('INVALID_INPUT', message, 400);
  }

  static serverError(message = '服务器错误') {
    return new CliError('SERVER_ERROR', message, 500);
  }

  static fileNotFound(path: string) {
    return new CliError('FILE_NOT_FOUND', `文件不存在: ${path}`, 404, { path });
  }

  static fileAccessDenied(path: string) {
    return new CliError('FILE_ACCESS_DENIED', `无法访问文件: ${path}`, 403, { path });
  }
}

/**
 * 错误码规范
 */
export enum ErrorCode {
  // 认证错误 (4xx)
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_LOGIN_FAILED = 'AUTH_LOGIN_FAILED',
  AUTH_REGISTER_FAILED = 'AUTH_REGISTER_FAILED',

  // OAuth2错误
  OAUTH_REDIRECT_FAILED = 'OAUTH_REDIRECT_FAILED',
  OAUTH_TOKEN_EXCHANGE_FAILED = 'OAUTH_TOKEN_EXCHANGE_FAILED',
  OAUTH_INVALID_STATE = 'OAUTH_INVALID_STATE',

  // 模块错误
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  VERSION_NOT_FOUND = 'VERSION_NOT_FOUND',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  INVALID_MODULE_FORMAT = 'INVALID_MODULE_FORMAT',

  // 配置错误
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',

  // 文件错误
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',

  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // 输入错误
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_VERSION = 'INVALID_VERSION',

  // 服务器错误 (5xx)
  SERVER_ERROR = 'SERVER_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static logger: any = null;

  static setLogger(logger: any) {
    this.logger = logger;
  }

  /**
   * 处理错误并显示友好的错误信息
   */
  static handle(error: unknown, exit: boolean = true): never {
    let cliError: CliError;

    if (error instanceof CliError) {
      cliError = error;
    } else if (error instanceof Error) {
      // 将普通Error转换为CliError
      const code = this.inferErrorCode(error.message);
      cliError = new CliError(code, error.message);
    } else {
      cliError = new CliError(ErrorCode.INTERNAL_ERROR, String(error));
    }

    // 记录错误日志
    if (this.logger) {
      this.logger.error({
        code: cliError.code,
        message: cliError.message,
        exitCode: cliError.exitCode,
        details: cliError.details,
        stack: cliError.stack,
      }, 'CLI Error');
    }

    // 显示用户友好的错误信息
    this.displayError(cliError);

    if (exit) {
      process.exit(cliError.exitCode);
    }

    throw cliError;
  }

  /**
   * 显示错误信息
   */
  private static displayError(error: CliError) {
    const chalk = require('chalk');
    console.error(chalk.red('✗ 错误:'), error.message);

    if (error.details && Object.keys(error.details).length > 0) {
      console.error(chalk.gray('详细信息:'));
      Object.entries(error.details).forEach(([key, value]) => {
        console.error(chalk.gray(`  ${key}: ${value}`));
      });
    }

    // 显示帮助提示
    const hint = this.getHelpHint(error.code);
    if (hint) {
      console.error(chalk.yellow('\n提示:'), hint);
    }
  }

  /**
   * 根据错误码提供帮助提示
   */
  private static getHelpHint(code: string): string | null {
    const hints: Record<string, string> = {
      'AUTH_UNAUTHORIZED': '请使用 `pnce auth login` 登录',
      'AUTH_TOKEN_EXPIRED': '请使用 `pnce auth login` 重新登录',
      'MODULE_NOT_FOUND': '请检查模块名称是否正确，或使用 `pnce search <keyword>` 搜索',
      'VERSION_NOT_FOUND': '请使用 `pnce info <name>` 查看可用版本',
      'UPLOAD_FAILED': '请检查网络连接和模块格式',
      'CONFIG_ERROR': '请检查配置文件或运行 `pnce init`',
    };

    return hints[code] || null;
  }

  /**
   * 根据错误消息推断错误码
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
   * 异步错误包装器 - 用于async函数的错误处理
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    errorMessage: string = '操作失败'
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
