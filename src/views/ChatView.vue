<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { chatService } from '@/services/chatService';
import { useChatStore } from '@/stores/chat';
import { 
  ChevronLeft, 
  Phone, 
  Video, 
  PlusCircle, 
  Camera, 
  Image as ImageIcon, 
  Mic, 
  Smile, 
  Heart,
  Send,
  User
} from 'lucide-vue-next';
import { getUserProfileById } from '@/services/userService';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const chatStore = useChatStore();
const contactId = Number(route.params.contactId);
const contact = ref<any>(null);
const messages = computed(() => chatStore.messages[contactId] || []);
const newMessage = ref('');
const isTyping = ref(false);
const isKeyboardOpen = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);
let typingTimeout: any = null;

const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
};

onMounted(async () => {
  requestNotificationPermission();
  const user = auth.user;
  if (user) {
    // Load contact info
    try {
        const res = await getUserProfileById(contactId);
        contact.value = res.data.data;
    } catch (err) {
        console.error('Failed to load contact profile:', err);
    }
    
    // Load history if not already cached
    if (messages.value.length === 0) {
        const history = await chatService.getHistory(user.id, contactId);
        history.forEach((msg: any) => chatStore.addMessage(contactId, msg));
    }
    scrollToBottom();
    chatStore.clearUnread(contactId);
    chatStore.setCurrentContact(contactId);

    chatStore.initWebSocket();

    const onTyping = (typing: any) => {
      console.log('⌨️ [ChatView] Typing received:', typing);
      if (Number(typing.senderId) === contactId) {
          isTyping.value = typing.typing || typing.isTyping;
          scrollToBottom();
      }
    };

    // Fix for mobile keyboard layout jumping
    if (window.visualViewport) {
      const handleViewportChange = () => {
        const viewport = window.visualViewport;
        if (!viewport) return;
        
        const chatView = document.querySelector('.chat-view') as HTMLElement;
        if (chatView) {
          isKeyboardOpen.value = viewport.height < window.innerHeight - 50;
          chatView.style.height = `${viewport.height}px`;
          
          if (isKeyboardOpen.value) {
            scrollToBottom();
          }
        }
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      
      onUnmounted(() => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
        chatStore.setCurrentContact(null);
      });
    } else {
      onUnmounted(() => {
          chatStore.setCurrentContact(null);
      });
    }
  }
});

const shouldShowAvatar = (index: number) => {
    if (index === messages.value.length - 1) return true;
    return messages.value[index].senderId !== messages.value[index + 1].senderId;
};

const handleTyping = () => {
    const user = auth.user;
    if (!user) return;

    if (typingTimeout) clearTimeout(typingTimeout);
    
    chatService.sendTyping({
        senderId: user.id,
        receiverId: contactId,
        isTyping: true
    });

    typingTimeout = setTimeout(() => {
        chatService.sendTyping({
            senderId: user.id,
            receiverId: contactId,
            isTyping: false
        });
        typingTimeout = null;
    }, 3000);
};

const sendMessage = () => {
  const user = auth.user;
  if (!newMessage.value.trim() || !user) return;

  // Clear typing immediately on send
  if (typingTimeout) {
      clearTimeout(typingTimeout);
      chatService.sendTyping({ senderId: user.id, receiverId: contactId, isTyping: false });
      typingTimeout = null;
  }

  const msg = {
    senderId: user.id,
    senderName: user.fullName || user.username,
    receiverId: contactId,
    content: newMessage.value,
    timestamp: new Date().toISOString()
  };

  chatService.sendMessage(msg);
  chatStore.addMessage(contactId, msg);
  newMessage.value = '';
  scrollToBottom();
};

const sendHeart = () => {
    const user = auth.user;
    if (!user) return;
    const msg = {
        senderId: user.id,
        senderName: user.fullName || user.username,
        receiverId: contactId,
        content: '❤️',
        timestamp: new Date().toISOString()
    };
    chatService.sendMessage(msg);
    chatStore.addMessage(contactId, msg);
    scrollToBottom();
};

const goBack = () => router.back();

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
  <div class="chat-view" :class="{ 'keyboard-open': isKeyboardOpen }">
    <!-- Chat Header -->
    <header class="chat-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack"><ChevronLeft :size="28" /></button>
        <div class="contact-info" v-if="contact">
            <div v-if="!contact.avatar" class="header-avatar placeholder">
                <User :size="20" />
            </div>
            <img v-else :src="resolveImageUrl(contact.avatar)" class="header-avatar" />
          <div class="header-text">
            <span class="contact-name">{{ contact.fullName || contact.username }}</span>
            <span class="status-text">{{ contact.online ? 'Đang hoạt động' : 'Ngoại tuyến' }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="header-icon"><Phone :size="22" /></button>
        <button class="header-icon"><Video :size="22" /></button>
      </div>
    </header>

    <!-- Message Container -->
    <div class="messages-container" ref="scrollContainer">
      <div v-if="contact" class="chat-intro">
          <div v-if="!contact.avatar" class="intro-avatar placeholder">
              <User :size="40" />
          </div>
          <img v-else :src="resolveImageUrl(contact.avatar)" class="intro-avatar" />
         <h2 class="intro-name">{{ contact.fullName || contact.username }}</h2>
         <p class="intro-sub">Các bạn là bạn bè trên Messenger</p>
         <button class="view-profile">XEM TRANG CÁ NHÂN</button>
      </div>

      <div 
        v-for="(msg, index) in messages" 
        :key="msg.timestamp + index" 
        class="message-row" 
        :class="{ self: Number(msg.senderId) === Number(auth.user?.id) }"
      >
        <!-- Only show avatar if it's the last message in a sequence from this sender -->
        <template v-if="msg.senderId !== auth.user?.id">
          <div v-if="shouldShowAvatar(index)" class="msg-avatar-placeholder">
            <div v-if="!contact?.avatar" class="msg-avatar placeholder">
                <User :size="14" />
            </div>
            <img v-else :src="resolveImageUrl(contact?.avatar)" class="msg-avatar" />
          </div>
          <div v-else class="msg-avatar-spacer"></div>
        </template>
        
        <div class="message-bubble" :class="{ 'emoji-only': msg.content === '❤️' }">
          {{ msg.content }}
        </div>
      </div>

      <!-- Typing Indicator -->
      <transition name="fade-slide">
        <div v-if="isTyping" class="message-row typing-row">
          <div v-if="!contact?.avatar" class="msg-avatar-placeholder">
              <div class="msg-avatar placeholder">
                <User :size="14" />
              </div>
          </div>
          <img v-else :src="resolveImageUrl(contact?.avatar)" class="msg-avatar" />
          <div class="message-bubble typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </transition>
    </div>

    <!-- Chat Footer -->
    <footer class="chat-footer">
      <div class="footer-actions">
        <button class="action-btn"><PlusCircle :size="24" /></button>
        <button class="action-btn"><Camera :size="24" /></button>
        <button class="action-btn"><ImageIcon :size="24" /></button>
        <button class="action-btn"><Mic :size="24" /></button>
      </div>
      <div class="input-container">
        <input 
            type="text" 
            v-model="newMessage" 
            placeholder="Aa" 
            @keyup.enter="sendMessage"
            @input="handleTyping"
        />
        <button class="emoji-btn"><Smile :size="24" /></button>
      </div>
      <button v-if="newMessage.length > 0" class="send-btn" @click="sendMessage">
        <Send :size="24" />
      </button>
      <button v-else class="heart-btn" @click="sendHeart">
        <Heart :size="24" fill="red" color="red" />
      </button>
    </footer>
  </div>
</template>

<style scoped>
.chat-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--messenger-light-gray);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
  padding: 4px;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-avatar-wrapper {
  position: relative;
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.online-status.mini {
  width: 10px;
  height: 10px;
  bottom: 0;
  right: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-weight: 700;
  font-size: 15px;
}

.status-text {
  font-size: 11px;
  color: var(--messenger-gray);
}

.header-right {
  display: flex;
  gap: 12px;
}

.header-icon {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

.chat-intro {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 0;
    text-align: center;
}

.intro-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 12px;
}

.intro-name {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
}

.intro-sub {
    font-size: 13px;
    color: var(--messenger-gray);
    margin-bottom: 16px;
}

.view-profile {
    background: var(--messenger-light-gray);
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
}

.message-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  max-width: 80%;
  animation: messageSlideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-row.self {
  align-self: flex-end;
  flex-direction: row-reverse;
  max-width: 80%;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.msg-avatar-placeholder {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
}

.msg-avatar-spacer {
  width: 32px;
  flex-shrink: 0;
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

.message-row.self .message-bubble {
  background: var(--messenger-bubble-self);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-row:not(.self) .message-bubble {
  background: var(--messenger-bubble-other);
  color: var(--messenger-text);
  border-bottom-left-radius: 4px;
}

.message-bubble.emoji-only {
    background: transparent !important;
    font-size: 32px;
    padding: 0;
    animation: heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes heartPop {
    0% { transform: scale(0); }
    70% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.typing {
    display: flex;
    gap: 4px;
    padding: 10px 14px;
}

.dot {
    width: 6px;
    height: 6px;
    background: var(--messenger-gray);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}

.header-avatar.placeholder,
.intro-avatar.placeholder,
.msg-avatar.placeholder {
    background: #f0f2f5;
    color: #65676b;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.header-avatar.placeholder { width: 40px; height: 40px; }
.intro-avatar.placeholder { width: 80px; height: 80px; }
.msg-avatar.placeholder { width: 28px; height: 28px; margin-bottom: 4px; }

.chat-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-bottom: calc(25px + env(safe-area-inset-bottom, 0px));
  background: white;
  border-top: 1px solid var(--messenger-light-gray);
  transition: padding-bottom 0.1s ease;
}

.chat-view.keyboard-open .chat-footer {
  padding-bottom: 8px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
  display: flex;
}

.input-container {
  flex: 1;
  background: var(--messenger-light-gray);
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
}

.input-container input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 8px 0;
  font-size: 16px;
}

.emoji-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
}

.send-btn, .heart-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
  display: flex;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
