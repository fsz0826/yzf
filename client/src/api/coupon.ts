import api from './index';

export const getAllCoupons = (params?: { keyword?: string; benefitId?: number; page?: number; pageSize?: number }) => {
  return api.get('/coupon', { params });
};

export const createCoupon = (data: any) => {
  return api.post('/coupon', data);
};

export const updateCoupon = (id: number, data: any) => {
  return api.put(`/coupon/${id}`, data);
};

export const deleteCoupon = (id: number) => {
  return api.delete(`/coupon/${id}`);
};
