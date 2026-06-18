import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/index.css'

// 数据预热：应用启动后非阻塞加载 Supabase 数据
import { fetchCategories } from '@/services/categories.service'
import { fetchQuestions } from '@/services/questions.service'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// 应用挂载后立即预热数据缓存（非阻塞，不阻塞渲染）
fetchCategories()
fetchQuestions()
