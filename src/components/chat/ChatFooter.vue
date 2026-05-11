<script setup lang="ts">
import { PlusCircle, Camera, Image as ImageIcon, Mic, Smile, Send, Heart } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  isKeyboardOpen: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'send', 'sendHeart', 'typing']);

const message = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

</script>

<template>
  <footer
    class="chat-footer"
    :class="{ 'keyboard-open': isKeyboardOpen }"
  >
    <transition name="actions-slide">
      <div v-if="!isKeyboardOpen" class="footer-actions">
        <button class="action-btn"><PlusCircle :size="24" /></button>
        <button class="action-btn"><Camera :size="24" /></button>
        <button class="action-btn"><ImageIcon :size="24" /></button>
        <button class="action-btn"><Mic :size="24" /></button>
      </div>
    </transition>

    <button v-if="isKeyboardOpen" class="action-btn">
      <PlusCircle :size="22" />
    </button>

    <div class="input-container">
      <input
        type="text"
        v-model="message"
        placeholder="Aa"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="none"
        spellcheck="false"
        @input="emit('typing')"
        @keyup.enter="emit('send')"
      />
      <button class="emoji-btn"><Smile :size="22" /></button>
    </div>

    <button
      v-if="message.length > 0 || isKeyboardOpen"
      class="send-btn"
      @click="emit('send')"
    >
      <Send :size="22" />
    </button>
    <button v-else class="heart-btn" @click="emit('sendHeart')">
      <Heart :size="22" fill="red" color="red" />
    </button>
  </footer>
</template>

<style scoped>
.chat-footer {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  padding-bottom: max(50px, env(safe-area-inset-bottom));
  background: white;
  border-top: 1px solid var(--messenger-light-gray, #e4e6eb);
  z-index: 30;
  flex-shrink: 0;
  min-height: 52px;
}

.chat-footer.keyboard-open {
  padding-bottom: 8px;
}

.footer-actions { display: flex; gap: 4px; flex-shrink: 0; }

.actions-slide-enter-active,
.actions-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease, max-width 0.18s ease;
  overflow: hidden;
}
.actions-slide-enter-from,
.actions-slide-leave-to   { opacity: 0; transform: translateX(-6px); max-width: 0; }
.actions-slide-enter-to,
.actions-slide-leave-from { opacity: 1; transform: translateX(0);    max-width: 160px; }

.action-btn {
  background: transparent; border: none;
  color: var(--messenger-blue, #0084ff);
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  padding: 4px; border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.action-btn:active { background: var(--messenger-light-gray, #f0f2f5); }

.input-container {
  flex: 1; min-width: 0;
  background: var(--messenger-light-gray, #f0f2f5);
  border-radius: 22px;
  display: flex; align-items: center;
  padding: 0 10px; gap: 6px;
}

.input-container input {
  flex: 1; min-width: 0;
  background: transparent; border: none; outline: none;
  padding: 9px 0;
  font-size: 16px;
  line-height: 1.3;
}

.emoji-btn {
  background: transparent; border: none;
  color: var(--messenger-blue, #0084ff);
  cursor: pointer; flex-shrink: 0; display: flex;
  -webkit-tap-highlight-color: transparent;
}

.send-btn, .heart-btn {
  background: transparent; border: none;
  color: var(--messenger-blue, #0084ff);
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  flex-shrink: 0; padding: 4px; border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, background 0.15s;
}
.send-btn:active,
.heart-btn:active { transform: scale(0.88); background: var(--messenger-light-gray, #f0f2f5); }
</style>
