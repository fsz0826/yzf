<template>
  <a-config-provider :locale="zhCN" :theme="themeConfig">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { theme } from 'ant-design-vue';

const themeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f6fa',
    colorBorder: '#e8ecf1',
    colorText: '#1d2129',
    colorTextSecondary: '#86909c',
    fontSize: 14,
  },
  components: {
    Table: {
      headerBg: '#fafbfc',
      headerColor: '#4e5969',
      borderColor: '#f0f2f5',
      rowHoverBg: '#fafbfc',
    },
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Button: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
      activeBorderColor: '#1677ff',
    },
    Select: {
      borderRadius: 8,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Tag: {
      borderRadiusSM: 4,
    },
  },
};
</script>
