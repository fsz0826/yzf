import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getUserInfo, login as loginApi } from '../api/auth';
import router from '../router';

interface UserInfo {
  id: number;
  username: string;
  name: string;
  role: string;
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref<UserInfo | null>(null);

  const login = async (username: string, password: string) => {
    const res: any = await loginApi(username, password);
    if (res.code === 200) {
      token.value = res.data.token;
      userInfo.value = res.data.user;
      localStorage.setItem('token', res.data.token);
      router.push('/');
      return true;
    }
    return false;
  };

  const fetchUserInfo = async () => {
    try {
      const res: any = await getUserInfo();
      if (res.code === 200) {
        userInfo.value = res.data;
      }
    } catch {}
  };

  const logout = () => {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    router.push('/login');
  };

  return { token, userInfo, login, fetchUserInfo, logout };
});
