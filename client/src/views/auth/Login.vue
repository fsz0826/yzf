<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">翼支付权益登记管理系统</h1>
      <a-form :model="formState" @finish="handleLogin" layout="vertical">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formState.username" size="large" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.password" size="large" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" block :loading="loading">
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();
const loading = ref(false);

const formState = reactive({
  username: '',
  password: '',
});

const handleLogin = async () => {
  loading.value = true;
  try {
    const success = await userStore.login(formState.username, formState.password);
    if (!success) {
      message.error('用户名或密码错误');
    }
  } catch {
    message.error('登录失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.login-title {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
  font-size: 24px;
}
</style>
