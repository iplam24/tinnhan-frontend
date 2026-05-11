<script setup lang="ts">
import { User } from 'lucide-vue-next';
import { ref } from 'vue';

defineProps<{
  messages: any[];
  contact: any;
  auth: any;
  isTyping: boolean;
  messagesPaddingBottom: string;
  resolveImageUrl: (url?: string | null) => string | undefined;
  shouldShowAvatar: (index: number) => boolean;
}>();

const scrollContainer = ref<HTMLElement | null>(null);

defineExpose({
  scrollContainer
});
</script>

<template>
  <div
    class="messages-container"
    ref="scrollContainer"
    :style="{ paddingBottom: messagesPaddingBottom }"
  >
    <div v-if="contact" class="chat-intro">
      <div v-if="!contact.avatar" class="intro-avatar placeholder">
        <User :size="40" />
      </div>
      <img v-else :src="resolveImageUrl(contact.avatar)" class="intro-avatar" alt="" />
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
      <template v-if="Number(msg.senderId) !== Number(auth.user?.id)">
        <div v-if="shouldShowAvatar(index)" class="msg-avatar-placeholder">
          <div v-if="!contact?.avatar" class="msg-avatar placeholder">
            <User :size="14" />
          </div>
          <img v-else :src="resolveImageUrl(contact?.avatar)" class="msg-avatar" alt="" />
        </div>
        <div v-else class="msg-avatar-spacer"></div>
      </template>

      <div class="message-bubble" :class="{ 'emoji-only': msg.content === '❤️' }">
        {{ msg.content }}
      </div>
    </div>

    <transition name="fade-slide">
      <div v-if="isTyping" class="message-row">
        <div class="msg-avatar-placeholder">
          <div v-if="!contact?.avatar" class="msg-avatar placeholder">
            <User :size="14" />
          </div>
          <img v-else :src="resolveImageUrl(contact?.avatar)" class="msg-avatar" alt="" />
        </div>
        <div class="message-bubble typing">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.chat-intro {
  display: flex; flex-direction: column;
  align-items: center; padding: 30px 0 16px;
  text-align: center;
}

.intro-avatar {
  width: 80px; height: 80px;
  border-radius: 50%; object-fit: cover; margin-bottom: 12px;
}

.intro-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.intro-sub  { font-size: 13px; color: var(--messenger-gray, #65676b); margin-bottom: 16px; }

.view-profile {
  background: var(--messenger-light-gray, #f0f2f5);
  border: none; padding: 6px 12px; border-radius: 6px;
  font-weight: 600; font-size: 12px; cursor: pointer;
}

.message-row {
  display: flex; gap: 8px; align-items: flex-end;
  max-width: 80%;
  animation: msgIn 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.15) forwards;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.message-row.self {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 28px; height: 28px;
  border-radius: 50%; object-fit: cover;
  flex-shrink: 0; margin-bottom: 2px;
}

.msg-avatar-placeholder {
  width: 28px; flex-shrink: 0;
  display: flex; align-items: flex-end;
}

.msg-avatar-spacer { width: 28px; flex-shrink: 0; }

.message-bubble {
  padding: 8px 12px; border-radius: 18px;
  font-size: 15px; line-height: 1.4;
  word-break: break-word; max-width: 100%;
}

.message-row.self .message-bubble {
  background: var(--messenger-bubble-self, #0084ff);
  color: white; border-bottom-right-radius: 4px;
}

.message-row:not(.self) .message-bubble {
  background: var(--messenger-bubble-other, #f0f2f5);
  color: var(--messenger-text, #050505);
  border-bottom-left-radius: 4px;
}

.message-bubble.emoji-only {
  background: transparent !important;
  font-size: 32px; padding: 0;
  animation: heartPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes heartPop {
  0%   { transform: scale(0); }
  70%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.typing { display: flex; gap: 4px; padding: 10px 14px; }
.dot {
  width: 6px; height: 6px;
  background: var(--messenger-gray, #65676b);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40%           { transform: scale(1); }
}

.intro-avatar.placeholder,
.msg-avatar.placeholder {
  background: #f0f2f5; color: #65676b;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
}
.intro-avatar.placeholder  { width: 80px; height: 80px; }
.msg-avatar.placeholder    { width: 28px; height: 28px; }

.fade-slide-enter-active,
.fade-slide-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.fade-slide-enter-from   { opacity: 0; transform: translateY(6px); }
.fade-slide-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
