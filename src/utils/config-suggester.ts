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
 * Config suggestion
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
        message: 'API serviceURLinvalid',
        suggestion: 'https://pnce.example.com',
      });
    }

    //  OAuth
    if (config.oauthEndpoint && !this.isValidUrl(config.oauthEndpoint)) {
      issues.push({
        type: 'warning',
        field: 'oauthEndpoint',
        message: 'OAuth URLinvalid',
      });
    }

    // Log Level
    if (config.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
      issues.push({
        type: 'warning',
        field: 'logLevel',
        message: 'invalidLog Level',
        suggestion: 'info',
      });
    }

    // Output directory
    if (config.outputDir && !this.isValidPath(config.outputDir)) {
      issues.push({
        type: 'error',
        field: 'outputDir',
        message: 'Output directoryPathinvalid',
        suggestion: './modules',
      });
    }

    //
    if (config.useProxy && !config.proxyUrl) {
      issues.push({
        type: 'warning',
        field: 'proxyUrl',
        message: 'EnableSettingProxy URL',
        suggestion: 'http://127.0.0.1:7890',
      });
    }

    if (config.proxyUrl && !this.isValidUrl(config.proxyUrl)) {
      issues.push({
        type: 'warning',
        field: 'proxyUrl',
        message: 'Proxy URLFormatinvalid',
      });
    }

    //
    if (config.downloadTimeout && config.downloadTimeout < 5000) {
      issues.push({
        type: 'warning',
        field: 'downloadTimeout',
        message: 'DownloadTimeout，fileDownloadfailed',
        suggestion: 60000,
      });
    }

    if (config.uploadTimeout && config.uploadTimeout < 10000) {
      issues.push({
        type: 'warning',
        field: 'uploadTimeout',
        message: 'UploadTimeout，fileUploadfailed',
        suggestion: 120000,
      });
    }

    //
    if (config.maxConcurrentDownloads && config.maxConcurrentDownloads > 10) {
      issues.push({
        type: 'suggestion',
        field: 'maxConcurrentDownloads',
        message: 'ConcurrentDownloadSettingHigh，In use',
        suggestion: 3,
      });
    }

    return issues;
  }

  /**
   * Yes/No URL
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
   * Yes/No
   */
  private isValidPath(path: string): boolean {
    // Validation：
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    return !invalidChars.test(path);
  }

  /**
   * Get configurationsuggestion
   */

  getsuggestions(_config: PnceConfig, issues: ConfigIssue[]): string[] {
    const suggestions: string[] = [];

    if (issues.some((i) => i.type === 'error')) {
      suggestions.push('⚠️  ConfigureError，PleaseFixIssue');
    }

    if (issues.some((i) => i.type === 'warning')) {
      suggestions.push('⚠️  ConfigureWarning，suggestioncheck');
    }

    if (issues.some((i) => i.type === 'suggestion')) {
      suggestions.push('💡  OptimizesuggestionUse');
    }

    return suggestions;
  }

  /**
   * FormatIssueOutput
   */
  formatIssues(issues: ConfigIssue[]): string {
    if (issues.length === 0) {
      return '✅ ConfigureValidation，Issue';
    }

    const lines: string[] = [];

    // TypeGroup
    const errors = issues.filter((i) => i.type === 'error');
    const warnings = issues.filter((i) => i.type === 'warning');
    const suggestions = issues.filter((i) => i.type === 'suggestion');

    if (errors.length > 0) {
      lines.push('\n❌ Error:');
      errors.forEach((issue) => {
        lines.push(`  • ${issue.field}: ${issue.message}`);
        if (issue.suggestion !== undefined) {
          lines.push(`    suggestionValue: ${JSON.stringify(issue.suggestion)}`);
        }
      });
    }

    if (warnings.length > 0) {
      lines.push('\n⚠️  Warning:');
      warnings.forEach((issue) => {
        lines.push(`  • ${issue.field}: ${issue.message}`);
        if (issue.suggestion !== undefined) {
          lines.push(`    suggestionValue: ${JSON.stringify(issue.suggestion)}`);
        }
      });
    }

    if (suggestions.length > 0) {
      lines.push('\n💡 suggestion:');
      suggestions.forEach((issue) => {
        lines.push(`  • ${issue.field}: ${issue.message}`);
        if (issue.suggestion !== undefined) {
          lines.push(`    suggestionValue: ${JSON.stringify(issue.suggestion)}`);
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * FixFixIssue
   */
  autoFix(config: PnceConfig, issues: ConfigIssue[]): PnceConfig {
    const fixedConfig = { ...config };

    issues.forEach((issue) => {
      if (issue.suggestion !== undefined) {
        (fixedConfig as Record<string, unknown>)[issue.field] = issue.suggestion;
        logger.debug(`FixConfigure: ${issue.field} = ${issue.suggestion}`);
      }
    });

    return fixedConfig;
  }
}

/**
 * ExportFunction
 */
export function createConfigSuggester(): ConfigSuggester {
  return new ConfigSuggester();
}
