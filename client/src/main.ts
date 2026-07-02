import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import zhCN from 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import App from './App.vue';
import router from './router';
import './assets/main.css';

dayjs.locale(zhCN);

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Antd);
app.mount('#app');
