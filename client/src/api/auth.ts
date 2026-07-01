import api from './index';

export const login = (username: string, password: string) => {
  return api.post('/auth/login', { username, password });
};

export const getUserInfo = () => {
  return api.get('/auth/userinfo');
};
