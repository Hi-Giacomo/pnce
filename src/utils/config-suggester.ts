import type { PnceConfig } from '../config/manager';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * 
 */
export interface ConfigIssue {
  /**
   * Type
   */
  type: 'error' | 'warning' | 'suggestion';

  /**
   * 
   */
  field: string;

  /**
   * Description
   */
  message: string;

  /**
   * 
   */
  suggestion?: string | number | boolean;
}

/**
 * Configuration suggestion
 */
export class ConfigSuggester {
  /**
   * ValidationList
   */
  validate(config: PnceConfig): ConfigIssue[] {
    const issues: ConfigIssue[] = [];

    //  API 
    if (!config.apiServer || !this.isValidUrl(config.apiServer)) {
      issues.push({
        type: 'error',
        field: 'apiServer',
        message: 'API 服务器地址无效',
        suggestion: 'https://pnce.example.com',
      });
    }

    //  OAuth 
    if (config.oauthEndpoint && !this.isValidUrl(config.oauthEndpoint)) {
      issues.push({
        type: 'warning',
        field: 'oauthEndpoint',
        message: 'OAuth 端点地址可能无效',
      });
    }

    // Log Level
    if (config.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
      issues.push({
        type: 'warning',
        field: 'logLevel',
        message: '无效的Log Level',
        suggestion: 'info',
      });
    }

    // Output directory
    if (config.outputDir && !this.isValidPath(config.outputDir)) {
      issues.push({
        type: 'error',
        field: 'outputDir',
        message: 'Output directory路径无效',
        suggestion: './modules',
      });
    }

    // 
    if (config.useProxy && !config.proxyUrl) {
      issues.push({
        type: 'warning',
        field: 'proxyUrl',
        message: '已启用代理但未设置Proxy URL',
        suggestion: 'http://127.0.0.1:7890',
      });
    }

    if (config.proxyUrl && !this.isValidUrl(config.proxyUrl)) {
      issues.push({
        type: 'warning',
        field: 'proxyUrl',
        message: 'Proxy URL格式可能无效',
      });
    }

    // 
    if (config.downloadTimeout && config.downloadTimeout < 5000) {
      issues.push({
        type: 'warning',
        field: 'downloadTimeout',
        message: '下载超时时间过短，可能导致大File下载Failed',
        suggestion: 60000,
      });
    }

    if (config.uploadTimeout && config.uploadTimeout < 10000) {
      issues.push({
        type: 'warning',
        field: 'uploadTimeout',
        message: '上传超时时间过短，可能导致大File上传Failed',
        suggestion: 120000,
      });
    }

    // 
    if (config.maxConcurrentDownloads && config.maxConcurrentDownloads > 10) {
      issues.push({
        type: 'suggestion',
        field: 'maxConcurrentDownloads',
        message: '并发下载设置过高，可能In use过多资源',
        suggestion: 3,
      });
    }

    return issues;
  }

  /**
   * YesNo URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * YesNo
   */
  private isValidPath(path: string): boolean {
    // Validation：
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    return !invalidChars.test(path);
  }

  /**
   * Get configuration建议
   */

  getSuggestions(_config: PnceConfig, issues: ConfigIssue[]): string[] {
    const suggestions: string[] = [];

    if (issues.some((i) => i.type === 'error')) {
      suggestions.push('⚠️  配置存在Error，请先修复这些问题');
    }

    if (issues.some((i) => i.type === 'warning')) {
      suggestions.push('⚠️  配置存在Warning，建议检查');
    }

    if (issues.some((i) => i.type === 'suggestion')) {
      suggestions.push('💡  以下优化建议可能提升使用体验');
    }

    return suggestions;
  }

  /**
   * 格式化问题输出
   */
  formatIssues(issues: ConfigIssue[]): string {
    if (issues.length === 0) {
      return '✅ 配置Validation通过，未发现问题';
    }

    const lines: string[] = [];

    // 按Type分组
    const errors = issues.filter((i) => i.type === 'error');
    const warnings = issues.filter((i) => i.type === 'warning');
    const suggestions = issues.filter((i) => i.type === 'suggestion');

    if (errors.length > 0) {
      lines.push('\n❌ Error:');
      errors.forEach((issue) => {
        lines.push(`  • ${issue.field}: ${issue.message}`);
        if (issue.suggestion !== undefined) {
          lines.push(`    建议值: ${JSON.stringify(issue.suggestion)}`);
        }
      });
    }

    if (warnings.length > 0) {
      lines.push('\n⚠️  Warning:');
      warnings.forEach((issue) => {
        lines.push(`  • ${issue.field}: ${issue.message}`);
        if (issue.suggestion !== undefined) {
          lines.push(`    建议值: ${JSON.stringify(issue.suggestion)}`);
        }
      });
    }

    if (suggestions.length > 0) {
      lines.push('\n💡 建议:');
      suggestions.forEach((issue) => {
        lines.push(`  • ${issue.field}: ${issue.message}`);
        if (issue.suggestion !== undefined) {
          lines.push(`    建议值: ${JSON.stringify(issue.suggestion)}`);
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * 自动修复可自动修复的问题
   */
  autoFix(config: PnceConfig, issues: ConfigIssue[]): PnceConfig {
    const fixedConfig = { ...config };

    issues.forEach((issue) => {
      if (issue.suggestion !== undefined) {
        (fixedConfig as Record<string, unknown>)[issue.field] = issue.suggestion;
        logger.debug(`自动修复配置: ${issue.field} = ${issue.suggestion}`);
      }
    });

    return fixedConfig;
  }
}

/**
 * 导出便利函数
 */
export function createConfigSuggester(): ConfigSuggester {
  return new ConfigSuggester();
}
