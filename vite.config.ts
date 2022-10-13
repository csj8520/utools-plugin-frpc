import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createPreloadPlugin, createUpxPlugin } from 'vite-plugin-utools-helper';

// import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  base: './',
  server: {
    port: 3101
  },
  optimizeDeps: {
    exclude: ['7z-wasm']
  },
  plugins: [
    vue(),
    // AutoImport({
    //   resolvers: [ElementPlusResolver()],
    //   dts: './src/auto-imports.d.ts'
    // }),
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
      outFileName: 'tinypng-[version].upx'
    })
  ]
});
