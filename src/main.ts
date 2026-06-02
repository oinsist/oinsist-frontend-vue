import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from '@/router/index'
import directives from '@/directives'
import '@/permission'

const app = createApp(App)
app.use(createPinia())
app.use(directives)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
