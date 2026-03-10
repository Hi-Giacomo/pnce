#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

// Common Chinese to English translations (add more as needed)
const translations: Record<string, string> = {
  // Command comments
  '注册Command': 'Register command',
  '注册command': 'Register command',
  '注册相关Command': 'Register related commands',
  '注册相关command': 'Register related commands',
  'logincommand': 'login command',
  '查看user infocommand': 'View user info command',
  'logoutcommand': 'logout command',
  'Authentication相关Command': 'Authentication related command',
  'Authentication相关command': 'Authentication related command',
  
  // Comments
  '注册Authentication相关Command': 'Register authentication-related commands',
  'Authentication服务实例': 'Authentication service instance',
  '查看UserInfoCommand': 'View current user information',
  'LoginCommand': 'Login command',
  'LogoutCommand': 'Logout command',
  '如果提供了Email和Password，使用传统Login方式': 'If email and password are provided, use traditional login method',
  'Default使用网页AuthorizationLogin': 'Default use web-based authorization login',
  'Token已由AuthService自动保存到配置': 'Token automatically saved to configuration by AuthService',
};

// Function to replace Chinese characters with English for code-only contexts
function replaceChineseInCode(content: string): string {
  // Replace specific phrases
  for (const [chinese, english] of Object.entries(translations)) {
    content = content.split(chinese).join(english);
  }
  
  // Replace Chinese characters in comments (outside of strings)
  // This is a simplified approach - it replaces Chinese chars outside quotes
  let result = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let i = 0;
  
  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1] || '';
    const prevChar = content[i - 1] || '';
    
    // Track quote state
    if (char === "'" && prevChar !== '\\' && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && prevChar !== '\\' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }
    
    // Replace Chinese characters only when not in quotes
    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      // Replace Chinese characters (this is a basic replacement)
      // For comments with Chinese, translate common phrases
      if (char >= '\u4e00' && char <= '\u9fff') {
        result += ''; // Remove Chinese characters
        i++;
        continue;
      }
    }
    
    result += char;
    i++;
  }
  
  return result;
}

function replaceChineseInFile(filePath: string): void {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const original = content;
    
    content = replaceChineseInCode(content);
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error);
  }
}

function processDirectory(dirPath: string, ext: string): void {
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      processDirectory(filePath, ext);
    } else if (file.endsWith(ext)) {
      replaceChineseInFile(filePath);
    }
  }
}

// Main execution
console.log('Replacing Chinese text with English...\n');

processDirectory('src', '.ts');

console.log('\n✓ Translation complete!');
