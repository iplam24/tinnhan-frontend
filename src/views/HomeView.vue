<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { chatService } from '@/services/chatService';
import { useChatStore } from '@/stores/chat';
import { 
  Search, 
  Edit, 
  Camera, 
  MessageCircle, 
  Users, 
  Menu as MenuIcon,
  Circle,
  User
} from 'lucide-vue-next';

import { getUserProfileById } from '@/services/userService';

const router = useRouter();
const auth = useAuthStore();
const chatStore = useChatStore();
const contacts = computed(() => {
  return chatStore.contacts.map(c => ({
    ...c,
    unreadCount: chatStore.unreadCounts[c.id] || 0
  })).sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA;
  });
});
const search = ref('');
const loading = ref(false);

const loadData = async () => {
  await auth.validateToken();
  const user = auth.user;
  if (!user) return;
  
  // Only show loading if we have no contacts cached
  if (chatStore.contacts.length === 0) {
      loading.value = true;
  }
  
  try {
    const contactIds = await chatService.getContacts(user.id);
    if (Array.isArray(contactIds)) {
        const contactDataPromises = contactIds.map(async (id) => {
          try {
            // Fetch profile and history in parallel
            const [profileRes, history] = await Promise.all([
              getUserProfileById(id),
              chatService.getHistory(user.id, id)
            ]);
            
            const profile = profileRes.data.data;
            const lastMsg = history && history.length > 0 ? history[history.length - 1] : null;
            
            return {
              ...profile,
              lastMessage: lastMsg?.content || 'Bắt đầu cuộc trò chuyện',
              lastMessageTime: lastMsg?.timestamp || null
            };
          } catch (err) {
            return null;
          }
        });
        
        const contactResults = await Promise.all(contactDataPromises);
        chatStore.setContacts(contactResults.filter(p => p !== null));
    } else if (contactIds && typeof contactIds === 'object') {
        const list = Array.isArray(contactIds) ? contactIds : [contactIds];
        chatStore.setContacts(list);
    }
    chatStore.initWebSocket();
  } catch (error) {
    console.error('Failed to load contacts:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (auth.user) {
    loadData();
    
    // Request notification permission
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
});
watch(() => auth.user, (newUser: any) => {
  if (newUser && contacts.value.length === 0) {
    loadData();
  }
}, { immediate: true });

const openChat = (contact: any) => {
  router.push(`/chat/${contact.id}`);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const resolveImageUrl = (url?: string | null) => {
  if (!url || url === '') return undefined;
  if (url.startsWith('http')) return url;
  
  // Use environment variable but remove /api suffix
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const origin = baseUrl.replace(/\/api\/?$/, '');
    
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${cleanPath}`;
};
</script>

<template>
  <div class="home-container">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <div v-if="!auth.user?.avatar" class="header-user-avatar placeholder" @click="router.push('/menu')">
            <User :size="20" />
        </div>
        <img 
          v-else
          :src="resolveImageUrl(auth.user?.avatar)" 
          class="header-user-avatar" 
          @click="router.push('/menu')"
        />
        <h1 class="logo">v-edu</h1>
      </div>
      <div class="header-right">
        <button class="icon-btn"><Edit :size="20" /></button>
        <button class="icon-btn"><Camera :size="20" /></button>
      </div>
    </header>

    <!-- Search -->
    <div class="search-container">
      <div class="search-bar">
        <Search :size="18" class="search-icon" />
        <input type="text" v-model="search" placeholder="Hỏi Meta AI hoặc tìm kiếm" />
      </div>
    </div>

    <!-- Active Stories (Avatars at top) -->
    <div class="stories-container">
      <div class="story create-story">
        <div class="avatar-wrapper">
          <div class="avatar placeholder">
            <Users :size="24" />
          </div>
          <div class="add-badge">+</div>
        </div>
        <span class="story-name">Tạo tin</span>
      </div>
      <div v-for="contact in contacts.slice(0, 5)" :key="'story-'+contact.id" class="story">
        <div class="avatar-wrapper">
          <div v-if="!contact.avatar" class="avatar placeholder">
            <User :size="24" />
          </div>
          <img v-else :src="resolveImageUrl(contact.avatar)" :alt="contact.fullName" class="avatar" />
          <div v-if="contact.online" class="online-status"></div>
        </div>
        <span class="story-name">{{ contact.fullName ? contact.fullName.split(' ').pop() : (contact.username || 'User') }}</span>
      </div>
    </div>

    <!-- Conversation List -->
    <div class="chat-list">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải đoạn chat...</p>
      </div>

      <div v-else-if="contacts.length === 0" class="empty-state">
        <MessageCircle :size="48" class="empty-icon" />
        <p>Chưa có đoạn chat nào</p>
        <button class="start-chat-btn">Bắt đầu trò chuyện</button>
      </div>

      <div 
        v-else
        v-for="(contact, index) in contacts" 
        :key="contact.id" 
        class="chat-item"
        @click="openChat(contact)"
        :style="{ animationDelay: index * 0.05 + 's' }"
      >
        <div class="chat-avatar-wrapper">
          <div v-if="!contact.avatar" class="chat-avatar placeholder">
            <User :size="24" />
          </div>
          <img v-else :src="resolveImageUrl(contact.avatar)" :alt="contact.fullName" class="chat-avatar" />
          <div v-if="contact.online" class="online-status"></div>
        </div>
        <div class="chat-info">
          <div class="chat-top">
            <span class="chat-name">{{ contact.fullName || contact.username }}</span>
            <span class="chat-time">{{ formatDate(contact.lastMessageTime) }}</span>
          </div>
          <div class="chat-bottom">
            <span class="chat-preview" :class="{ unread: contact.unreadCount > 0 }">
              {{ contact.lastMessage || 'Bắt đầu cuộc trò chuyện' }}
            </span>
            <div v-if="contact.unreadCount > 0" class="unread-dot"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <div class="nav-item active">
        <MessageCircle :size="24" />
        <span>Đoạn chat</span>
      </div>
      <div class="nav-item">
        <Users :size="24" />
        <span>Tin</span>
      </div>
      <div class="nav-item" @click="router.push('/menu')">
        <MenuIcon :size="24" />
        <span>Menu</span>
      </div>
    </nav>

    <!-- V-Edu AI Floating Button -->
    <button class="meta-ai-btn" @click="router.push('/ai')">
       <Circle :size="24" color="#a855f7" />
       <span>Hỏi V-Edu AI</span>
    </button>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 70px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-user-avatar.placeholder {
    background: #f0f2f5;
    color: #65676b;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.header-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.logo {
  font-size: 28px;
  font-weight: 800;
  color: var(--messenger-blue);
  letter-spacing: -1px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.icon-btn {
  background: var(--messenger-light-gray);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-container {
  padding: 8px 16px;
}

.search-bar {
  background: var(--messenger-light-gray);
  border-radius: 20px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  color: var(--messenger-gray);
}

.search-bar input {
  background: transparent;
  border: none;
  outline: none;
  flex: 1;
  font-size: 16px;
  color: var(--messenger-text);
}

.stories-container {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.stories-container::-webkit-scrollbar {
  display: none;
}

.story {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 65px;
}

.avatar-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.avatar.placeholder {
  background: var(--messenger-light-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--messenger-gray);
}

.add-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.online-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  background: #31a24c;
  border: 2px solid white;
  border-radius: 50%;
}

.story-name {
  font-size: 12px;
  color: var(--messenger-gray);
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
  transition: all 0.2s ease;
  cursor: pointer;
  animation: slideIn 0.3s ease-out backwards;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
}

.avatar.placeholder,
.chat-avatar.placeholder {
  background: #f0f2f5;
  color: #65676b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-item:active {
  background-color: #f0f2f5;
  transform: scale(0.98);
}

.chat-item:active {
  background: var(--messenger-light-gray);
}

.chat-avatar-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
}

.chat-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.chat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-name {
  font-weight: 600;
  font-size: 16px;
}

.chat-time {
  font-size: 12px;
  color: var(--messenger-gray);
}

.chat-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-preview {
  font-size: 14px;
  color: var(--messenger-gray);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.chat-preview.unread {
  color: var(--messenger-text);
  font-weight: 700;
}

.unread-dot {
  width: 12px;
  height: 12px;
  background: var(--messenger-blue);
  border-radius: 50%;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--messenger-gray);
  text-align: center;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--messenger-light-gray);
  border-top-color: var(--messenger-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.2;
}

.start-chat-btn {
  margin-top: 16px;
  background: var(--messenger-blue);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(85px + env(safe-area-inset-bottom, 0px));
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid var(--messenger-light-gray);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--messenger-gray);
  cursor: pointer;
}

.nav-item.active {
  color: var(--messenger-blue);
}

.nav-item span {
  font-size: 10px;
  font-weight: 500;
}

.meta-ai-btn {
  position: fixed;
  bottom: calc(105px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  background: white;
  border: none;
  padding: 10px 16px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
</style>
