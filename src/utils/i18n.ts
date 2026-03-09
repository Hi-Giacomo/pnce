import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Language type
 */
export type Language = 'zh' | 'en';

/**
 * Translation message type
 */
export type Messages = Record<string, string>;

/**
 * Language pack
 */
interface Locale {
  [key: string]: string | Locale;
}

/**
 * i18n manager
 */
export class I18nManager {
  private currentLanguage: Language = 'zh';
  private locales: Map<Language, Locale> = new Map();

  constructor() {
    this.loadLocales();
  }

  /**
   * Load all language packs
   */
  private loadLocales(): void {
    // Load Chinese
    this.loadLanguage('zh');
    // Load English
    this.loadLanguage('en');
  }

  /**
   * Load specified language
   */
  private loadLanguage(lang: Language): void {
    try {
      const localePath = this.getLocalePath(lang);
      if (existsSync(localePath)) {
        const content = readFileSync(localePath, 'utf-8');
        this.locales.set(lang, JSON.parse(content));
      } else {
        console.warn(`Language pack not found: ${localePath}`);
      }
    } catch (error) {
      console.error(`Failed to load language pack (${lang}):`, error);
    }
  }

  /**
   * Get language pack path
   */
  private getLocalePath(lang: Language): string {
    // Search source directory first
    const srcPath = path.join(__dirname, `../locales/${lang}.json`);
    if (existsSync(srcPath)) {
      return srcPath;
    }

    // Then search compiled directory
    const distPath = path.join(__dirname, `../locales/${lang}.json`);
    if (existsSync(distPath)) {
      return distPath;
    }

    // Finally search project root directory
    const rootPath = path.join(process.cwd(), 'locales', `${lang}.json`);
    return rootPath;
  }

  /**
   * Set current language
   */
  setLanguage(lang: Language): void {
    if (!this.locales.has(lang)) {
      console.warn(`Unsupported language: ${lang}, using default language: zh`);
      this.currentLanguage = 'zh';
      return;
    }

    this.currentLanguage = lang;
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): Language[] {
    return Array.from(this.locales.keys());
  }

  /**
   * Translate text
   */
  t(key: string, params?: Record<string, string | number>): string {
    const locale = this.locales.get(this.currentLanguage);

    if (!locale) {
      return key;
    }

    // Support nested keys, e.g., 'common.success'
    const keys = key.split('.');
    let value: string | Locale = locale;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        const val = value as Record<string, string | Locale>;
        value = val[k] as string | Locale;
      } else {
        // If translation not found, return key
        console.warn(`Translation not found: ${key}`);
        return key;
      }
    }

    // Ensure value is not undefined
    if (value === undefined) {
      console.warn(`Translation not found: ${key}`);
      return key;
    }

    // If value is not a string, return key
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Replace parameters
    if (params) {
      return this.interpolate(value, params);
    }

    return value;
  }

  /**
   * Replace parameters in translation
   */
  private interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  /**
   * Detect system language
   */
  detectSystemLanguage(): Language {
    const envLang =
      process.env.LANGUAGE || process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG;

    if (envLang) {
      if (envLang.startsWith('zh') || envLang.startsWith('zh_CN')) {
        return 'zh';
      }
      if (envLang.startsWith('en')) {
        return 'en';
      }
    }

    return 'zh'; // Default to Chinese
  }

  /**
   * Auto-set language
   */
  autoSetLanguage(): void {
    const systemLang = this.detectSystemLanguage();
    this.setLanguage(systemLang);
  }
}

/**
 * Global i18n instance
 */
let i18nManager: I18nManager | null = null;

/**
 * Get i18n manager instance
 */
export function getI18n(): I18nManager {
  if (!i18nManager) {
    i18nManager = new I18nManager();
  }

  return i18nManager;
}

/**
 * Convenience wrapper for translation function
 */
export function t(key: string, params?: Record<string, string | number>): string {
  return getI18n().t(key, params);
}

/**
 * Set language
 */
export function setLanguage(lang: Language): void {
  getI18n().setLanguage(lang);
}

/**
 * Get current language
 */
export function getLanguage(): Language {
  return getI18n().getLanguage();
}
