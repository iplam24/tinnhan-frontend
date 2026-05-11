import { defineStore } from 'pinia';
import Cookies from 'js-cookie';
import apiClient from '@/services/api';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  roles: string[];
  avatar?: string | null;
  fullName?: string | null;
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: Cookies.get('token') || null,
    user: JSON.parse(Cookies.get('user') || 'null') as AuthUser | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    login(data: any) {
      this.token = data.token;
      this.user = {
        id: data.id,
        username: data.username,
        email: data.email,
        roles: data.roles,
        avatar: data.avatar,
        fullName: data.fullName
      };
      // Save to cookies with 7 days expiration
      Cookies.set('token', data.token, { expires: 7 });
      Cookies.set('user', JSON.stringify(this.user), { expires: 7 });
    },
    logout() {
      this.token = null;
      this.user = null;
      Cookies.remove('token');
      Cookies.remove('user');
    },
    async validateToken() {
        if (!this.token) return false;
        try {
            const response = await apiClient.get('/users/me');
            const userData = response.data?.data || response.data;
            if (userData) {
                this.user = userData;
                Cookies.set('user', JSON.stringify(this.user), { expires: 7 });
                return true;
            }
        } catch (error) {
            this.logout();
            return false;
        }
        return false;
    }
  },
});
