import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

export default defineConfig({
  plugins: [
    vue(),
    createSvgIconsPlugin({
      // Specify the icon folder to be cached
      iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
      // Specify symbolId format
      symbolId: 'icon-[name]'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'path': 'path-browserify'
    }
  },
  css: {
    postcss: {
      plugins: []
    },
    preprocessorOptions: {
      scss: {
        // Make SCSS variables available globally (optional)
        additionalData: '',
        silenceDeprecations: ['import', 'legacy-js-api']
      }
    }
  },
  server: {
    port: 9527,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
