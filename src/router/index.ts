import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import HomeView from '@/views/HomeView.vue';
import ChatView from '@/views/ChatView.vue';
import LoginView from '@/views/LoginView.vue';
import AiChatView from '@/views/AiChatView.vue';
import MenuView from '@/views/MenuView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/chat/:contactId',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/ai',
      name: 'ai-chat',
      component: AiChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/menu',
      name: 'menu',
      component: MenuView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login';
  } else if (to.name === 'login' && auth.isAuthenticated) {
    return '/';
  }
});

export default router;
