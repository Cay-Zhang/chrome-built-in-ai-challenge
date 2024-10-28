import { resolve } from 'node:path';
import { makeEntryPointPlugin } from '@extension/hmr';
import { isDev, withPageConfig } from '@extension/vite-config';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
    },
  },
  plugins: [isDev && makeEntryPointPlugin(), nodePolyfills()],
  publicDir: resolve(rootDir, 'public'),
  build: {
    lib: {
      entry: resolve(srcDir, 'index.tsx'),
      name: 'contentUI',
      formats: ['iife'],
      fileName: 'index',
    },
    outDir: resolve(rootDir, '..', '..', 'dist', 'content-ui'),
  },
});
