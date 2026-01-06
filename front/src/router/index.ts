import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import MyBets from '../views/MyBets.vue'
import WelcomeBonus from '../views/WelcomeBonus.vue'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'dashboard', component: Dashboard },
        { path: 'my-bets', name: 'my-bets', component: MyBets },
        { path: 'welcome-bonus', name: 'welcome-bonus', component: WelcomeBonus },
      ],
    },
  ]
})

export default router
