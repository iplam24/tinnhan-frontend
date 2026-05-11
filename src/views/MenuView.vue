<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  Bell, 
  HelpCircle, 
  ChevronRight,
  ChevronLeft
} from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};

const goBack = () => router.push('/');

const resolveImageUrl = (url?: string | null) => {
  if (!url || url === '') return undefined;
  if (url.startsWith('http')) return url;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const origin = baseUrl.replace(/\/api\/?$/, '');
    
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${cleanPath}`;
};
</script>

<template>
  <div class="menu-view">
    <header class="header">
      <button class="back-btn" @click="goBack"><ChevronLeft :size="28" /></button>
      <h1>Menu</h1>
      <div class="spacer"></div>
    </header>

    <div class="content" v-if="auth.user">
      <!-- Profile Section -->
      <div class="profile-card">
        <div v-if="!auth.user.avatar" class="profile-avatar placeholder">
          <User :size="30" />
        </div>
        <img v-else :src="resolveImageUrl(auth.user.avatar)" class="profile-avatar" />
        <div class="profile-info">
          <h2>{{ auth.user.fullName || auth.user.username }}</h2>
          <p>Xem trang cá nhân của bạn</p>
        </div>
        <ChevronRight :size="20" color="#ccc" />
      </div>

      <!-- Menu Items -->
      <div class="menu-section">
        <div class="menu-item">
          <div class="icon-wrapper blue"><Settings :size="20" /></div>
          <span>Cài đặt</span>
          <ChevronRight :size="16" color="#ccc" />
        </div>
        <div class="menu-item">
          <div class="icon-wrapper green"><Shield :size="20" /></div>
          <span>Quyền riêng tư</span>
          <ChevronRight :size="16" color="#ccc" />
        </div>
        <div class="menu-item">
          <div class="icon-wrapper red"><Bell :size="20" /></div>
          <span>Thông báo</span>
          <ChevronRight :size="16" color="#ccc" />
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-item">
          <div class="icon-wrapper gray"><HelpCircle :size="20" /></div>
          <span>Trợ giúp & hỗ trợ</span>
          <ChevronRight :size="16" color="#ccc" />
        </div>
      </div>

      <!-- Logout Button -->
      <button class="logout-btn" @click="handleLogout">
        <LogOut :size="20" />
        <span>Đăng xuất</span>
      </button>

      <div class="footer">
        <p>V-Edu Messenger v1.0.0</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--messenger-light-gray);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e4e6eb;
}

.header h1 {
  font-size: 18px;
  font-weight: 700;
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
}

.spacer { width: 28px; }

.content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.profile-avatar.placeholder {
  background: #f0f2f5;
  color: #65676b;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.profile-info p {
  font-size: 14px;
  color: var(--messenger-gray);
  margin: 0;
}

.menu-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item span {
  flex: 1;
  font-weight: 500;
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.icon-wrapper.blue { background: #1877f2; }
.icon-wrapper.green { background: #31a24c; }
.icon-wrapper.red { background: #fa3e3e; }
.icon-wrapper.gray { background: #65676b; }

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #f0f2f5;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  color: #fa3e3e;
  cursor: pointer;
  margin-top: auto;
}

.footer {
  text-align: center;
  padding: 20px 0;
}

.footer p {
  font-size: 12px;
  color: var(--messenger-gray);
}
</style>
