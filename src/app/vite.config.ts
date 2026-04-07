import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import * as fs from 'fs';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';
  const base = isDev ? '/' : '/app/';

  return {
    plugins: [
      react(),
      {
        name: 'replace-assets-path',
        closeBundle() {
          const outDir = path.resolve(__dirname, '../service/public/app');
          const htmlPath = path.join(outDir, 'index.html');
          if (fs.existsSync(htmlPath)) {
            let html = fs.readFileSync(htmlPath, 'utf-8');
            html = html
              .replace(/href="\.\//g, `href="${base}"`)
              .replace(/src="\.\//g, `src="${base}"`);
            fs.writeFileSync(htmlPath, html);
          }
        },
      },
    ],
    base,
    server: {
      port: 5173,
      strictPort: true, // 如果端口被占用则报错
    },
    build: {
      outDir: path.resolve(__dirname, '../service/public/app'),
      emptyOutDir: true,
    },
  } as UserConfig;
});
