import type { App } from 'vue'
import hasPermi from './hasPermi'
import hasRole from './hasRole'

export default {
  install(app: App) {
    app.directive('hasPermi', hasPermi)
    app.directive('hasRole', hasRole)
  },
}
