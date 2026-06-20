import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync, existsSync, writeFileSync, rmSync, readdirSync } from 'fs';

function fixExtensionHtml(): { name: string; closeBundle: () => void } {
  return {
    name: 'fix-extension-html-paths',
    closeBundle() {
      const nestedDir = path.resolve(__dirname, 'dist/src');
      if (!existsSync(nestedDir)) return;

      readdirSync(nestedDir)
        .filter((f) => f.endsWith('.html'))
        .forEach((file) => {
          let html = readFileSync(path.join(nestedDir, file), 'utf-8');
          html = html.replace(/\.\.\/([\w-]+\.js)/g, './$1');
          html = html.replace(/\.\.\/assets\//g, './assets/');
          writeFileSync(path.resolve(__dirname, 'dist', file), html);
        });

      rmSync(nestedDir, { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), fixExtensionHtml()],
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup.html'),
        manager: path.resolve(__dirname, 'src/manager.html'),
        options: path.resolve(__dirname, 'src/options.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'background' ? 'background.js' : '[name].js',
      },
    },
  },
});
