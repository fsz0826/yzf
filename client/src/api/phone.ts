import api from './index';

export const getPhones = (params?: { keyword?: string; page?: number; pageSize?: number }) => {
  return api.get('/phone', { params });
};

export const getPhoneDetail = (id: number) => {
  return api.get(`/phone/${id}`);
};

interface BenefitConfig {
  benefitId: number;
  grabDayStart?: number;
  grabDayEnd?: number;
}

export const createPhone = (data: { phoneNumber: string; status?: number; benefitConfigs?: BenefitConfig[] }) => {
  return api.post('/phone', data);
};

export const updatePhone = (id: number, data: { phoneNumber: string; status: number; benefitConfigs?: BenefitConfig[] }) => {
  return api.put(`/phone/${id}`, data);
};

export const deletePhone = (id: number) => {
  return api.delete(`/phone/${id}`);
};
