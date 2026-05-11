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
const footerBottom = ref(0);
const scrollContainer = ref<HTMLElement | null>(null);
let typingTimeout: any = null;

const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

const scrollToBottom = async (smooth = false) => {
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: scrollContainer.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
};

watch(messages, () => {
  scrollToBottom(true);
}, { deep: true });

onMounted(async () => {
  requestNotificationPermission();
  const user = auth.user;
  if (user) {
    try {
      const res = await getUserProfileById(contactId);
      contact.value = res.data.data;
    } catch (err) {
      console.error('Failed to load contact profile:', err);
    }

    if (messages.value.length === 0) {
      const history = await chatService.getHistory(user.id, contactId);
      history.forEach((msg: any) => chatStore.addMessage(contactId, msg));
    }
    scrollToBottom();
    chatStore.clearUnread(contactId);
    chatStore.setCurrentContact(contactId);
    chatStore.initWebSocket();
  }

  // ── Visual Viewport: track keyboard open/close ──────────────────────────
  const viewport = window.visualViewport;
  if (viewport) {
    const handler = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const viewportOffsetTop = viewport.offsetTop;

      // Keyboard is open when viewport is significantly shorter than window
      isKeyboardOpen.value = viewportHeight < windowHeight * 0.85;

      // Move the footer up so it sits just above the keyboard
      // offsetTop accounts for any browser chrome at the top
      const hiddenBottom = windowHeight - (viewportOffsetTop + viewportHeight);
      footerBottom.value = Math.max(0, hiddenBottom);

      if (isKeyboardOpen.value) {
        scrollToBottom(true);
      }
    };

    viewport.addEventListener('resize', handler);
    viewport.addEventListener('scroll', handler);

    onUnmounted(() => {
      viewport.removeEventListener('resize', handler);
      viewport.removeEventListener('scroll', handler);
    });
  }
});

onUnmounted(() => {
  chatStore.setCurrentContact(null);
});

const shouldShowAvatar = (index: number) => {
  if (index === messages.value.length - 1) return true;
  return messages.value[index].senderId !== messages.value[index + 1].senderId;
};

const handleTyping = () => {
  const user = auth.user;
  if (!user) return;

  if (typingTimeout) clearTimeout(typingTimeout);

  chatService.sendTyping({ senderId: user.id, receiverId: contactId, isTyping: true });

  typingTimeout = setTimeout(() => {
    chatService.sendTyping({ senderId: user.id, receiverId: contactId, isTyping: false });
    typingTimeout = null;
  }, 3000);
};

const sendMessage = () => {
  const user = auth.user;
  if (!newMessage.value.trim() || !user) return;

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
  <div class="chat-view">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
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

    <!-- ── Messages ───────────────────────────────────────────────────── -->
    <div
      class="messages-container"
      ref="scrollContainer"
      :style="{ paddingBottom: isKeyboardOpen ? '64px' : '80px' }"
    >
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

    <!-- ── Footer ─────────────────────────────────────────────────────── -->
    <!--
      footerBottom: pixel gap between footer bottom edge and window bottom.
      When keyboard is open this equals the keyboard height, so the footer
      floats just above it regardless of safe-area or browser chrome.
    -->
    <footer
      class="chat-footer"
      :style="{ bottom: footerBottom + 'px' }"
      :class="{ 'keyboard-open': isKeyboardOpen }"
    >
      <!-- Media actions: hidden when keyboard is open -->
      <transition name="actions-slide">
        <div v-if="!isKeyboardOpen" class="footer-actions">
          <button class="action-btn"><PlusCircle :size="24" /></button>
          <button class="action-btn"><Camera :size="24" /></button>
          <button class="action-btn"><ImageIcon :size="24" /></button>
          <button class="action-btn"><Mic :size="24" /></button>
        </div>
      </transition>

      <!-- Collapsed action toggle when keyboard is open -->
      <button
        v-if="isKeyboardOpen"
        class="action-btn collapse-toggle"
        @click="isKeyboardOpen = false"
      >
        <PlusCircle :size="22" />
      </button>

      <div class="input-container">
        <input
          type="text"
          v-model="newMessage"
          placeholder="Aa"
          @input="handleTyping"
          @keyup.enter="sendMessage"
        />
        <button class="emoji-btn"><Smile :size="22" /></button>
      </div>

      <!-- Send button: always visible when keyboard open OR when has text -->
      <button
        v-if="newMessage.length > 0 || isKeyboardOpen"
        class="send-btn"
        @click="sendMessage"
      >
        <Send :size="22" />
      </button>
      <button v-else class="heart-btn" @click="sendHeart">
        <Heart :size="22" fill="red" color="red" />
      </button>
    </footer>
  </div>
</template>

<style scoped>
/* ── Base ─────────────────────────────────────────────────────────────── */
.chat-view {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

/* ── Header ───────────────────────────────────────────────────────────── */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  border-bottom: 1px solid var(--messenger-light-gray);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  flex-shrink: 0;
  z-index: 20;
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
  -webkit-tap-highlight-color: transparent;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
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
  -webkit-tap-highlight-color: transparent;
}

/* ── Messages ─────────────────────────────────────────────────────────── */
.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  /* padding-bottom set dynamically via :style */
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
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
  object-fit: cover;
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
  animation: messageSlideIn 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.2) forwards;
}

@keyframes messageSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.message-row.self {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.msg-avatar-placeholder {
  width: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
}

.msg-avatar-spacer {
  width: 28px;
  flex-shrink: 0;
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
  max-width: 100%;
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
  animation: heartPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes heartPop {
  0%   { transform: scale(0); }
  70%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Typing */
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
  40%           { transform: scale(1); }
}

/* Placeholder avatars */
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

.header-avatar.placeholder { width: 36px; height: 36px; }
.intro-avatar.placeholder  { width: 80px; height: 80px; }
.msg-avatar.placeholder    { width: 28px; height: 28px; }

/* ── Footer ───────────────────────────────────────────────────────────── */
.chat-footer {
  position: fixed;
  left: 0;
  right: 0;
  /* bottom is set dynamically via :style to float above the keyboard */
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  padding-bottom: max(50px, env(safe-area-inset-bottom));
  background: white;
  border-top: 1px solid var(--messenger-light-gray);
  z-index: 30;
  transition: bottom 0.0s; /* intentionally no transition — viewport events fire fast enough */
}

/* When keyboard is open, collapse safe-area padding (keyboard covers it) */
.chat-footer.keyboard-open {
  padding-bottom: 8px;
}

.footer-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Slide-out animation for media action buttons */
.actions-slide-enter-active,
.actions-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease, max-width 0.2s ease;
  overflow: hidden;
}

.actions-slide-enter-from,
.actions-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
  max-width: 0;
}

.actions-slide-enter-to,
.actions-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
  max-width: 160px;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.action-btn:active {
  background: var(--messenger-light-gray);
}

.collapse-toggle {
  flex-shrink: 0;
}

.input-container {
  flex: 1;
  min-width: 0;
  background: var(--messenger-light-gray);
  border-radius: 22px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 6px;
  transition: border-radius 0.2s;
}

.input-container input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  padding: 9px 0;
  font-size: 16px; /* 16px prevents iOS auto-zoom */
  line-height: 1.3;
}

.emoji-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.send-btn,
.heart-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, background 0.15s;
}

.send-btn:active,
.heart-btn:active {
  transform: scale(0.88);
  background: var(--messenger-light-gray);
}

/* ── Transitions ──────────────────────────────────────────────────────── */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>