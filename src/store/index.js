import { createStore } from 'vuex'
import getters from './getters'

// Use import.meta.glob instead of require.context (Vite)
const modulesFiles = import.meta.glob('./modules/*.js', { eager: true })

const modules = Object.keys(modulesFiles).reduce((modules, modulePath) => {
  // set './modules/app.js' => 'app'
  const moduleName = modulePath.replace(/^\.\/modules\/(.*)\.\w+$/, '$1')
  const value = modulesFiles[modulePath]
  modules[moduleName] = value.default
  return modules
}, {})

const store = createStore({
  modules,
  getters
})

export default store
