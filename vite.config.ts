import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createPreloadPlugin, createUpxPlugin } from 'vite-plugin-utools-helper';

import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 35181
  },
  optimizeDeps: {
    exclude: ['7z-wasm']
  },
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: false // use element-plus/global
    }),
    createPreloadPlugin({
      // name: 'window.preload',
      // path: 'src/preload/index.ts',
    }),
    createUpxPlugin({
      // outDir: 'upx',
      outFileName: 'frpc-client-[version].upx'
    })
  ]
});
