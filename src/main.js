import { createApp } from 'vue'

import Cookies from 'js-cookie'

import 'normalize.css' // a modern alternative to CSS resets

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import '@/styles/index.scss' // global css

import App from './App.vue'
import store from './store'
import router from './router'

import './permission' // permission control
import { setupErrorLog } from './utils/error-log' // error log
import SvgIcon from '@/components/SvgIcon/index.vue'
import 'virtual:svg-icons-register'

const app = createApp(App)

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Register SvgIcon globally
app.component('svg-icon', SvgIcon)

app.use(ElementPlus, {
  size: Cookies.get('size') || 'default'
})
app.use(store)
app.use(router)

// Setup error log
setupErrorLog(app)

app.mount('#app')
