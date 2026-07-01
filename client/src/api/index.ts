import axios from 'axios';
import { message } from 'ant-design-vue';
import router from '../router';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data.code === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      message.error(data.message);
      return Promise.reject(data);
    }
    return data;
  },
  (error) => {
    message.error('网络错误');
    return Promise.reject(error);
  }
);

export default api;
