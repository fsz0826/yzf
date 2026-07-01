import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Index.vue'),
        meta: { title: '仪表盘' },
      },
      {
        path: 'matrix',
        name: 'Matrix',
        component: () => import('../views/matrix/Index.vue'),
        meta: { title: '矩阵登记' },
      },
      {
        path: 'phone',
        name: 'Phone',
        component: () => import('../views/phone/Index.vue'),
        meta: { title: '号码管理' },
      },
      {
        path: 'phone/:id',
        name: 'PhoneDetail',
        component: () => import('../views/phone/Detail.vue'),
        meta: { title: '号码详情', parentTitle: '号码管理' },
      },
      {
        path: 'benefit/list',
        name: 'BenefitList',
        component: () => import('../views/benefit/Index.vue'),
        meta: { title: '权益管理', parentTitle: '权益管理' },
      },
      {
        path: 'benefit/coupon',
        name: 'BenefitCoupon',
        component: () => import('../views/coupon/Index.vue'),
        meta: { title: '优惠券管理', parentTitle: '权益管理' },
      },
      {
        path: 'express',
        name: 'Express',
        component: () => import('../views/express/Index.vue'),
        meta: { title: '快递管理' },
      },
      {
        path: 'import',
        name: 'Import',
        component: () => import('../views/import/Index.vue'),
        meta: { title: '数据导入' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
