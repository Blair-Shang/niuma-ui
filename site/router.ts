import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', component: () => import('./pages/HomePage.vue') },
    { path: '/guide/:slug', component: () => import('./pages/GuidePage.vue') },
    { path: '/components/:slug', component: () => import('./pages/ComponentPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
