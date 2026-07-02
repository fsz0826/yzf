import api from './index';

export const getPhones = (params?: { keyword?: string; page?: number; pageSize?: number }) => {
  return api.get('/phone', { params });
};

export const getPhoneDetail = (id: number) => {
  return api.get(`/phone/${id}`);
};

export const createPhone = (data: { phoneNumber: string; status?: number; benefitIds?: number[] }) => {
  return api.post('/phone', data);
};

export const updatePhone = (id: number, data: { phoneNumber: string; status: number; benefitIds?: number[] }) => {
  return api.put(`/phone/${id}`, data);
};

export const deletePhone = (id: number) => {
  return api.delete(`/phone/${id}`);
};

export const grabBenefit = (phoneId: number, benefitId: number) => {
  return api.post(`/phone/${phoneId}/grab`, { benefitId });
};

export const ungrabBenefit = (phoneId: number, benefitId: number) => {
  return api.post(`/phone/${phoneId}/ungrab`, { benefitId });
};
