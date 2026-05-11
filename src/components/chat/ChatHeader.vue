<script setup lang="ts">
import { ChevronLeft, Phone, Video, User } from 'lucide-vue-next';

defineProps<{
  contact: any;
  resolveImageUrl: (url?: string | null) => string | undefined;
}>();

const emit = defineEmits(['back']);
</script>

<template>
  <header class="chat-header">
    <div class="header-left">
      <button class="back-btn" @click="emit('back')">
        <ChevronLeft :size="28" />
      </button>

      <!-- Skeleton until contact loads -->
      <div v-if="!contact" class="contact-info">
        <div class="header-avatar placeholder skeleton-pulse"></div>
        <div class="header-text">
          <span class="skeleton-bar" style="width:100px;height:13px;border-radius:6px;display:block"></span>
          <span class="skeleton-bar" style="width:64px;height:10px;border-radius:4px;display:block;margin-top:5px"></span>
        </div>
      </div>

      <!-- Loaded -->
      <div v-else class="contact-info">
        <div v-if="!contact.avatar" class="header-avatar placeholder">
          <User :size="20" />
        </div>
        <img v-else :src="resolveImageUrl(contact.avatar)" class="header-avatar" alt="" />
        <div class="header-text">
          <span class="contact-name">{{ contact.fullName || contact.username }}</span>
          <span class="status-text">
            {{ contact.online ? 'Đang hoạt động' : 'Ngoại tuyến' }}
          </span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <button class="header-icon"><Phone :size="22" /></button>
      <button class="header-icon"><Video :size="22" /></button>
    </div>
  </header>
</template>

<style scoped>
.chat-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  border-bottom: 1px solid var(--messenger-light-gray, #e4e6eb);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  min-height: 56px;
}

.header-left  { display: flex; align-items: center; gap: 4px; }
.header-right { display: flex; gap: 12px; }

.back-btn {
  background: transparent; border: none;
  color: var(--messenger-blue, #0084ff);
  cursor: pointer; padding: 4px;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.contact-info { display: flex; align-items: center; gap: 10px; }

.header-avatar {
  width: 36px; height: 36px;
  border-radius: 50%; object-fit: cover; flex-shrink: 0;
}

.header-text  { display: flex; flex-direction: column; }
.contact-name { font-weight: 700; font-size: 15px; }
.status-text  { font-size: 11px; color: var(--messenger-gray, #65676b); }

.header-icon {
  background: transparent; border: none;
  color: var(--messenger-blue, #0084ff);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.skeleton-pulse {
  background: linear-gradient(90deg, #f0f2f5 25%, #e4e6eb 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton-bar {
  background: linear-gradient(90deg, #f0f2f5 25%, #e4e6eb 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.header-avatar.placeholder { 
  width: 36px; height: 36px; 
  background: #f0f2f5; color: #65676b;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
}
</style>
