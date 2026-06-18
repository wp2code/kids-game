import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/components/HomeScreen.vue'),
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('@/components/GameScreen.vue'),
    },
    {
      path: '/result',
      name: 'result',
      component: () => import('@/components/ResultScreen.vue'),
    },
  ],
})

export default router
