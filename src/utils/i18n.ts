import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * 语言类型
 */
export type Language = 'zh' | 'en';

/**
 * 翻译消息类型
 */
export type Messages = Record<string, string>;

/**
 * 语言包
 */
interface Locale {
  [key: string]: string | Locale;
}

/**
 * i18n 管理器
 */
export class I18nManager {
  private currentLanguage: Language = 'zh';
  private locales: Map<Language, Locale> = new Map();
  private messages: Map<Language, Messages> = new Map();

  constructor() {
    this.loadLocales();
  }

  /**
   * 加载所有语言包
   */
  private loadLocales(): void {
    // 加载中文
    this.loadLanguage('zh');
    // 加载英文
    this.loadLanguage('en');
  }

  /**
   * 加载指定语言
   */
  private loadLanguage(lang: Language): void {
    try {
      const localePath = this.getLocalePath(lang);
      if (existsSync(localePath)) {
        const content = readFileSync(localePath, 'utf-8');
        this.locales.set(lang, JSON.parse(content));
      } else {
        console.warn(`语言包不存在: ${localePath}`);
      }
    } catch (error) {
      console.error(`加载语言包失败 (${lang}):`, error);
    }
  }

  /**
   * 获取语言包路径
   */
  private getLocalePath(lang: Language): string {
    // 优先查找源码目录
    const srcPath = path.join(__dirname, `../locales/${lang}.json`);
    if (existsSync(srcPath)) {
      return srcPath;
    }

    // 其次查找编译后的目录
    const distPath = path.join(__dirname, `../locales/${lang}.json`);
    if (existsSync(distPath)) {
      return distPath;
    }

    // 最后查找项目根目录
    const rootPath = path.join(process.cwd(), 'locales', `${lang}.json`);
    return rootPath;
  }

  /**
   * 设置当前语言
   */
  setLanguage(lang: Language): void {
    if (!this.locales.has(lang)) {
      console.warn(`不支持的语言: ${lang}，使用默认语言: zh`);
      this.currentLanguage = 'zh';
      return;
    }

    this.currentLanguage = lang;
  }

  /**
   * 获取当前语言
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): Language[] {
    return Array.from(this.locales.keys());
  }

  /**
   * 翻译文本
   */
  t(key: string, params?: Record<string, string | number>): string {
    const locale = this.locales.get(this.currentLanguage);

    if (!locale) {
      return key;
    }

    // 支持嵌套键，如 'common.success'
    const keys = key.split('.');
    let value: string | Locale = locale;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻译，返回 key
        console.warn(`翻译不存在: ${key}`);
        return key;
      }
    }

    // 如果值不是字符串，返回 key
    if (typeof value !== 'string') {
      console.warn(`翻译值不是字符串: ${key}`);
      return key;
    }

    // 替换参数
    if (params) {
      return this.interpolate(value, params);
    }

    return value;
  }

  /**
   * 替换翻译中的参数
   */
  private interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  /**
   * 检测系统语言
   */
  detectSystemLanguage(): Language {
    const envLang = process.env.LANGUAGE || process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG;

    if (envLang) {
      if (envLang.startsWith('zh') || envLang.startsWith('zh_CN')) {
        return 'zh';
      }
      if (envLang.startsWith('en')) {
        return 'en';
      }
    }

    return 'zh'; // 默认中文
  }

  /**
   * 自动设置语言
   */
  autoSetLanguage(): void {
    const systemLang = this.detectSystemLanguage();
    this.setLanguage(systemLang);
  }
}

/**
 * 全局 i18n 实例
 */
let i18nManager: I18nManager | null = null;

/**
 * 获取 i18n 管理器实例
 */
export function getI18n(): I18nManager {
  if (!i18nManager) {
    i18nManager = new I18nManager();
  }

  return i18nManager;
}

/**
 * 翻译函数的便利包装
 */
export function t(key: string, params?: Record<string, string | number>): string {
  return getI18n().t(key, params);
}

/**
 * 设置语言
 */
export function setLanguage(lang: Language): void {
  getI18n().setLanguage(lang);
}

/**
 * 获取当前语言
 */
export function getLanguage(): Language {
  return getI18n().getLanguage();
}
