import api from './index';

export const getBenefits = (params?: { keyword?: string; page?: number; pageSize?: number }) => {
  return api.get('/benefit', { params });
};

export const getBenefitDetail = (id: number) => {
  return api.get(`/benefit/${id}`);
};

export const createBenefit = (data: any) => {
  return api.post('/benefit', data);
};

export const updateBenefit = (id: number, data: any) => {
  return api.put(`/benefit/${id}`, data);
};

export const deleteBenefit = (id: number) => {
  return api.delete(`/benefit/${id}`);
};
