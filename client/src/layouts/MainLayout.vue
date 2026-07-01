<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible theme="light" :width="220" :collapsed-width="64" style="border-right: 1px solid #e8ecf1">
      <div class="logo">
        <credit-card-outlined style="color: #1677ff; font-size: 22px" />
        <span v-show="!collapsed">翼支付权益</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        theme="light"
        @click="handleMenuClick"
      >
        <a-menu-item key="/dashboard">
          <template #icon><dashboard-outlined /></template>
          <span>仪表盘</span>
        </a-menu-item>
        <a-menu-item key="/matrix">
          <template #icon><table-outlined /></template>
          <span>矩阵登记</span>
        </a-menu-item>
        <a-sub-menu key="benefit">
          <template #icon><gift-outlined /></template>
          <template #title>权益管理</template>
          <a-menu-item key="/benefit/list">权益列表</a-menu-item>
          <a-menu-item key="/benefit/coupon">优惠券管理</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="/phone">
          <template #icon><phone-outlined /></template>
          <span>号码管理</span>
        </a-menu-item>
        <a-menu-item key="/express">
          <template #icon><car-outlined /></template>
          <span>快递管理</span>
        </a-menu-item>
        <a-menu-item key="/import">
          <template #icon><upload-outlined /></template>
          <span>数据导入</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="topbar">
        <div class="topbar-left">
          <a-button type="text" @click="collapsed = !collapsed">
            <template #icon>
              <menu-unfold-outlined v-if="collapsed" />
              <menu-fold-outlined v-else />
            </template>
          </a-button>
          <a-breadcrumb class="breadcrumb">
            <a-breadcrumb-item>
              <router-link to="/"><home-outlined /> 首页</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-for="(crumb, index) in breadcrumbs" :key="index">
              <span v-if="index === breadcrumbs.length - 1" class="current-crumb">
                <component :is="crumb.icon" /> {{ crumb.title }}
              </span>
              <span v-else>{{ crumb.title }}</span>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="topbar-right">
          <a-badge :count="0" :offset="[-2, 2]">
            <a-button type="text" shape="circle">
              <template #icon><bell-outlined /></template>
            </a-button>
          </a-badge>
          <a-dropdown>
            <div class="admin-info">
              <a-avatar :size="32" style="background-color: #e8f0fe; color: #1677ff">
                {{ avatarText }}
              </a-avatar>
              <span class="name">{{ userStore.userInfo?.name || '管理员' }}</span>
              <a-tag color="default" :bordered="false" style="margin: 0; border-radius: 12px; font-size: 12px;">超级管理</a-tag>
            </div>
            <template #overlay>
              <a-menu @click="handleUserMenu">
                <a-menu-item key="logout">
                  <logout-outlined /> 退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="main-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';
import {
  DashboardOutlined,
  TableOutlined,
  GiftOutlined,
  PhoneOutlined,
  CarOutlined,
  UploadOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  LogoutOutlined,
  CreditCardOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const collapsed = ref(false);
const openKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([route.path]);

const menuItems = [
  { path: '/dashboard', label: '仪表盘', icon: 'DashboardOutlined' },
  { path: '/matrix', label: '矩阵登记', icon: 'TableOutlined' },
  {
    key: 'benefit',
    label: '权益管理',
    icon: 'GiftOutlined',
    children: [
      { path: '/benefit/list', label: '权益列表' },
      { path: '/benefit/coupon', label: '优惠券管理' },
    ],
  },
  { path: '/phone', label: '号码管理', icon: 'PhoneOutlined' },
  { path: '/express', label: '快递管理', icon: 'CarOutlined' },
  { path: '/import', label: '数据导入', icon: 'UploadOutlined' },
];

const avatarText = computed(() => {
  const name = userStore.userInfo?.name || '管';
  return name.charAt(0);
});

const breadcrumbs = computed(() => {
  const crumbs: { title: string; icon?: any }[] = [];
  for (const item of menuItems) {
    if (item.children) {
      const child = item.children.find((c) => c.path === route.path);
      if (child) {
        crumbs.push({ title: item.label });
        crumbs.push({ title: child.label });
        return crumbs;
      }
    } else if (item.path === route.path) {
      crumbs.push({ title: item.label });
      return crumbs;
    }
  }
  return crumbs;
});

watch(
  () => route.path,
  (path) => {
    selectedKeys.value = [path];
    for (const item of menuItems) {
      if (item.children && item.children.some((c) => c.path === path)) {
        if (!openKeys.value.includes(item.key!)) {
          openKeys.value = [...openKeys.value, item.key!];
        }
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchUserInfo();
  }
});

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key);
};

const handleUserMenu = ({ key }: { key: string }) => {
  if (key === 'logout') {
    userStore.logout();
  }
};
</script>

<style scoped>
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 4px;
  padding: 0 16px;
  overflow: hidden;
  white-space: nowrap;
}

.topbar {
  background: #ffffff;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8ecf1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  position: sticky;
  top: 0;
  z-index: 10;
  line-height: 56px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.breadcrumb {
  background: #f7f8fa;
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid #f0f2f5;
  font-size: 13px;
}

.breadcrumb :deep(.ant-breadcrumb-separator) {
  color: #c9cdd4;
}

.breadcrumb a {
  color: #4e5969;
  transition: color 0.15s;
}

.breadcrumb a:hover {
  color: #1677ff;
}

.current-crumb {
  color: #1d2129;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.admin-info:hover {
  background: #f7f8fa;
}

.name {
  font-size: 14px;
  font-weight: 450;
  color: #4e5969;
}

.main-content {
  margin: 24px;
  min-height: 280px;
}
</style>
