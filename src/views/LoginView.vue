<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/services/api';
import { LogIn, Github } from 'lucide-vue-next';

const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!username.value || !password.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await apiClient.post('/auth/login', {
      username: username.value,
      password: password.value
    });
    
    if (response.data && response.data.data) {
      auth.login(response.data.data);
      router.push('/');
    } else if (response.data) {
      // Fallback if backend doesn't use ApiResponse wrapper
      auth.login(response.data);
      router.push('/');
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-wrapper">
         <img src="/pwa-192x192.png" alt="Logo" class="login-logo" />
         <h1>V-Edu</h1>
         <p>Đăng nhập để tiếp tục</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <input 
            type="text" 
            v-model="username" 
            placeholder="Tên đăng nhập hoặc Email" 
            required
          />
        </div>
        <div class="input-group">
          <input 
            type="password" 
            v-model="password" 
            placeholder="Mật khẩu" 
            required
          />
        </div>
        
        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading">Đang đăng nhập...</span>
          <span v-else>Đăng nhập</span>
        </button>
      </form>

      <div class="divider">
        <span>HOẶC</span>
      </div>

      <div class="social-login">
        <button class="social-btn facebook">
           <span>Tiếp tục với Facebook</span>
        </button>
      </div>

      <p class="footer-text">
        Quên mật khẩu?
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100dvh;
  background: white;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo-wrapper {
  margin-bottom: 40px;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

h1 {
  font-size: 32px;
  font-weight: 800;
  color: var(--messenger-text);
  margin-bottom: 8px;
}

p {
  color: var(--messenger-gray);
  font-size: 16px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  background: var(--messenger-light-gray);
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: border 0.2s;
}

.input-group input:focus {
  border-color: var(--messenger-blue);
}

.error-msg {
  color: #fa3e3e;
  font-size: 14px;
  text-align: left;
}

.login-btn {
  background: var(--messenger-blue);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  transition: opacity 0.2s;
}

.login-btn:disabled {
  opacity: 0.6;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: var(--messenger-gray);
  font-size: 12px;
  font-weight: 600;
}

.divider::before, .divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e4e6eb;
}

.divider span {
  padding: 0 10px;
}

.social-login {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.social-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.social-btn.facebook {
  background: #1877f2;
  color: white;
}

.footer-text {
  margin-top: 30px;
  font-size: 14px;
  font-weight: 600;
  color: var(--messenger-blue);
  cursor: pointer;
}
</style>
