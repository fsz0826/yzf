<template>
  <div>
    <a-tabs v-model:activeKey="activeKey" @change="handleTabChange">
      <a-tab-pane key="/benefit/list" tab="权益列表" />
      <a-tab-pane key="/benefit/coupon" tab="优惠券管理" />
    </a-tabs>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const activeKey = computed(() => route.path);

const handleTabChange = (key: string) => {
  router.push(key);
};
</script>
