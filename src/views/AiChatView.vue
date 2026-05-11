<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { aiService } from '@/services/aiService';
import { 
  ChevronLeft, 
  Send,
  Bot,
  User,
  Sparkles
} from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();
const messages = ref<any[]>([]);
const newMessage = ref('');
const loading = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

const isUpgraded = computed(() => {
  if (!auth.user?.roles) return false;
  // If user has any role other than ROLE_USER, they are upgraded
  return auth.user.roles.some((r: any) => {
    const roleName = typeof r === 'string' ? r : (r.name || '');
    return roleName !== 'ROLE_USER';
  });
});

const scrollToBottom = async () => {
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
};

onMounted(async () => {
  // Load history if available
  try {
      const history = await aiService.getSessionMessages(0); // Assuming 0 or latest session
      if (history && Array.isArray(history)) {
          messages.value = history;
          scrollToBottom();
      }
  } catch (err) {
      console.log('No existing AI chat history');
  }
  
  if (messages.value.length === 0) {
      messages.value.push({
          role: 'assistant',
          content: 'Xin chào! Tôi là V-Edu AI. Tôi có thể giúp gì cho bạn hôm nay?'
      });
  }
});

const handleSend = async () => {
  if (!newMessage.value.trim() || loading.value) return;

  const userMsg = newMessage.value;
  messages.value.push({ role: 'user', content: userMsg });
  newMessage.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const response = await aiService.sendMessage(userMsg);
    const resData = response.data || response;
    const aiContent = typeof resData === 'string' ? resData : (resData.content || JSON.stringify(resData));
    
    messages.value.push({
      role: 'assistant',
      content: aiContent
    });
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: 'Rất tiếc, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.'
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const goBack = () => router.push('/');
</script>

<template>
  <div class="ai-chat-view">
    <header class="header">
      <button class="back-btn" @click="goBack"><ChevronLeft :size="28" /></button>
      <div class="ai-info">
        <div class="ai-avatar"><Sparkles :size="20" color="white" /></div>
        <div class="ai-text">
          <span class="ai-name">V-Edu AI</span>
          <span class="ai-status">Đang trực tuyến</span>
        </div>
      </div>
      <div class="spacer"></div>
    </header>

    <div class="messages-container" ref="scrollContainer">
      <div 
        v-for="(msg, index) in messages" 
        :key="index" 
        class="message-row"
        :class="msg.role === 'user' ? 'self' : 'bot'"
      >
        <div v-if="msg.role !== 'user'" class="bot-avatar">
          <Bot :size="18" />
        </div>
        <div class="message-bubble">
          {{ msg.content }}
        </div>
      </div>

      <div v-if="loading" class="message-row bot">
        <div class="bot-avatar"><Bot :size="18" /></div>
        <div class="message-bubble typing">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <!-- Upgrade Overlay -->
    <div v-if="!isUpgraded" class="upgrade-overlay">
      <div class="upgrade-card">
        <div class="upgrade-icon">
          <Sparkles :size="40" />
        </div>
        <h3>Tính năng dành cho Hội viên</h3>
        <p>Vui lòng nâng cấp tài khoản của bạn để sử dụng V-Edu AI và nhiều tính năng cao cấp khác.</p>
        <a href="https://vuxuanlam.me/upgrade" target="_blank" class="upgrade-link-btn">
          Nâng cấp ngay
        </a>
        <button class="not-now-btn" @click="goBack">Để sau</button>
      </div>
    </div>

    <footer class="footer">
      <div class="input-container">
        <input 
          type="text" 
          v-model="newMessage" 
          placeholder="Hỏi V-Edu AI..." 
          @keyup.enter="handleSend"
          :disabled="loading"
        />
        <button class="send-btn" @click="handleSend" :disabled="!newMessage.trim() || loading">
          <Send :size="20" />
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.ai-chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #e4e6eb;
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
}

.ai-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-text {
  display: flex;
  flex-direction: column;
}

.ai-name {
  font-weight: 700;
  font-size: 15px;
}

.ai-status {
  font-size: 11px;
  color: #31a24c;
  font-weight: 600;
}

.spacer { width: 28px; }

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}

.message-row.self {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bot-avatar {
  width: 28px;
  height: 28px;
  background: #e4e6eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #65676b;
  margin-bottom: 4px;
}

.message-bubble {
  padding: 10px 14px;
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

.message-row.bot .message-bubble {
  background: white;
  color: var(--messenger-text);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.footer {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e4e6eb;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f2f5;
  border-radius: 20px;
  padding: 4px 12px;
}

.input-container input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 8px 0;
  font-size: 15px;
}

.send-btn {
  background: transparent;
  border: none;
  color: var(--messenger-blue);
  cursor: pointer;
  display: flex;
  opacity: 1;
  transition: opacity 0.2s;
}

.send-btn:disabled {
  opacity: 0.3;
}

.typing {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
}

.dot {
    width: 6px;
    height: 6px;
    background: #90949c;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}
.upgrade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.upgrade-card {
  background: white;
  padding: 32px 24px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 320px;
  width: 100%;
  animation: cardFadeIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes cardFadeIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.upgrade-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #0084ff, #00c6ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  box-shadow: 0 10px 20px rgba(0, 132, 255, 0.3);
}

.upgrade-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1c1e21;
}

.upgrade-card p {
  font-size: 15px;
  color: #65676b;
  margin-bottom: 24px;
  line-height: 1.5;
}

.upgrade-link-btn {
  display: block;
  background: #0084ff;
  color: white;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.upgrade-link-btn:hover {
  background: #0073e6;
  transform: translateY(-2px);
}

.not-now-btn {
  background: none;
  border: none;
  color: #65676b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.not-now-btn:hover {
  text-decoration: underline;
}

</style>
