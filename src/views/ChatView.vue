<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { chatService } from '@/services/chatService';
import { useChatStore } from '@/stores/chat';
import { getUserProfileById } from '@/services/userService';

// Components
import ChatHeader from '@/components/chat/ChatHeader.vue';
import MessageList from '@/components/chat/MessageList.vue';
import ChatFooter from '@/components/chat/ChatFooter.vue';

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
const keyboardHeight = ref(0);
const messageListRef = ref<any>(null);
let typingTimeout: any = null;

const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

const scrollToBottom = async (smooth = false) => {
  await nextTick();
  const container = messageListRef.value?.scrollContainer;
  if (container) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }
};

watch(messages, () => scrollToBottom(true), { deep: true });

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

  // Keyboard detection
  const viewport = window.visualViewport;
  if (viewport) {
    const handler = () => {
      const winH = window.innerHeight;
      const vpH = viewport.height;
      const vpTop = viewport.offsetTop;
      const hidden = Math.max(0, winH - (vpTop + vpH));

      keyboardHeight.value = hidden;
      isKeyboardOpen.value = hidden > 80;

      if (isKeyboardOpen.value) scrollToBottom(true);
    };
    viewport.addEventListener('resize', handler);
    viewport.addEventListener('scroll', handler);
    onUnmounted(() => {
      viewport.removeEventListener('resize', handler);
      viewport.removeEventListener('scroll', handler);
    });
  }
});

onUnmounted(() => chatStore.setCurrentContact(null));

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

const FOOTER_H = 58;
const messagesPaddingBottom = computed(() => `${FOOTER_H + keyboardHeight.value + 8}px`);
</script>

<template>
  <div class="chat-view">
    <ChatHeader 
      :contact="contact" 
      :resolve-image-url="resolveImageUrl" 
      @back="goBack" 
    />

    <MessageList 
      ref="messageListRef"
      :messages="messages"
      :contact="contact"
      :auth="auth"
      :is-typing="isTyping"
      :messages-padding-bottom="messagesPaddingBottom"
      :resolve-image-url="resolveImageUrl"
      :should-show-avatar="shouldShowAvatar"
    />

    <ChatFooter 
      v-model="newMessage"
      :is-keyboard-open="isKeyboardOpen"
      :keyboard-height="keyboardHeight"
      @send="sendMessage"
      @send-heart="sendHeart"
      @typing="handleTyping"
    />
  </div>
</template>

<style scoped>
.chat-view {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}
</style>