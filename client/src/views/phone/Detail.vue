<template>
  <div>
    <a-card :bordered="false" style="margin-bottom: 20px; border-radius: 12px">
      <div style="display: flex; align-items: center; gap: 16px">
        <a-button @click="router.push('/phone')"><template #icon><arrow-left-outlined /></template>返回</a-button>
        <template v-if="phoneDetail">
          <a-space>
            <phone-outlined style="color: #1677ff; font-size: 18px" />
            <span style="font-size: 16px; font-weight: 500">{{ phoneDetail.phoneNumber }}</span>
          </a-space>
          <a-badge :status="phoneDetail.status === 1 ? 'success' : 'default'" :text="phoneDetail.status === 1 ? '启用' : '停用'" />
        </template>
      </div>
    </a-card>

    <a-spin :spinning="loading">
      <template v-if="phoneDetail">
        <!-- 月份选择器 -->
        <a-card :bordered="false" style="border-radius: 12px; margin-bottom: 20px">
          <a-space>
            <span style="font-weight: 500">查看月份：</span>
            <a-month-picker v-model:value="selectedMonth" :disabled-date="(current: any) => current > dayjs()" @change="onMonthChange" />
            <a-tag :color="isCurrentMonth ? 'blue' : 'default'">{{ isCurrentMonth ? '当前月份' : '历史记录（只读）' }}</a-tag>
          </a-space>
        </a-card>

        <!-- 统计卡片 -->
        <a-row :gutter="16" style="margin-bottom: 20px">
          <a-col :span="6">
            <a-card :bordered="false" style="border-radius: 12px; text-align: center">
              <a-statistic title="已配置权益" :value="phoneDetail.benefits.length" suffix="项">
                <template #prefix><gift-outlined style="color: #1677ff" /></template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card :bordered="false" style="border-radius: 12px; text-align: center">
              <a-statistic :title="`${selectedMonthLabel}已领取`" :value="grabbedCount" suffix="项" :value-style="{ color: '#52c41a' }">
                <template #prefix><check-circle-outlined /></template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card :bordered="false" style="border-radius: 12px; text-align: center">
              <a-statistic :title="`${selectedMonthLabel}未领取`" :value="phoneDetail.benefits.length - grabbedCount" suffix="项" :value-style="{ color: '#faad14' }">
                <template #prefix><hourglass-outlined /></template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card :bordered="false" style="border-radius: 12px; text-align: center">
              <a-statistic title="本月成本" :value="totalCost" :precision="2" prefix="¥" :value-style="{ color: '#ff4d4f' }">
                <template #prefix><pay-circle-outlined /></template>
              </a-statistic>
            </a-card>
          </a-col>
        </a-row>

        <!-- 已配置权益 -->
        <a-card :bordered="false" style="border-radius: 12px; margin-bottom: 20px">
          <template #title>
            <a-space><gift-outlined style="color: #1677ff" />已配置权益<span style="color: #86909c; font-weight: 400; font-size: 13px">(共 {{ phoneDetail.benefits.length }} 项)</span></a-space>
          </template>
          <a-table :columns="benefitColumns" :data-source="phoneDetail.benefits" :pagination="false" row-key="id" size="middle">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'needGrab'">
                <a-tag :color="record.benefit?.needGrab ? 'orange' : 'green'">{{ record.benefit?.needGrab ? '是' : '否' }}</a-tag>
              </template>
              <template v-if="column.key === 'cost'">{{ record.benefit?.cost != null ? `¥${record.benefit.cost}` : '-' }}</template>
              <template v-if="column.key === 'status'">
                <a-badge :status="getGrabStatus(record.benefitId) === '已领取' ? 'success' : 'warning'" :text="getGrabStatus(record.benefitId)" />
              </template>
              <template v-if="column.key === 'action'">
                <template v-if="isCurrentMonth">
                  <a-button v-if="getGrabStatus(record.benefitId) === '未领取'" type="primary" size="small" @click="handleGrab(record.benefitId)">领取</a-button>
                  <a-button v-else type="link" size="small" danger @click="handleUngrab(record.benefitId)">取消领取</a-button>
                </template>
                <span v-else style="color: #c9cdd4; font-size: 13px">历史月份不可操作</span>
              </template>
              <template v-if="column.key === 'range'">{{ record.grabDayStart }}-{{ record.grabDayEnd }}日</template>
            </template>
          </a-table>
        </a-card>

        <!-- 领取记录 -->
        <a-card :bordered="false" style="border-radius: 12px">
          <template #title>
            <a-space><history-outlined style="color: #1677ff" />领取记录<span style="color: #86909c; font-weight: 400; font-size: 13px">({{ selectedMonthLabel }})</span></a-space>
          </template>
          <a-table :columns="recordColumns" :data-source="filteredRecords" :pagination="false" row-key="benefitId" size="middle">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'benefitName'">
                {{ getBenefitName(record.benefitId) }}
              </template>
              <template v-if="column.key === 'status'">
                <a-badge :status="record.status === '已领取' ? 'success' : 'warning'" :text="record.status" />
              </template>
              <template v-if="column.key === 'time'">
                {{ record.grabbedAt ? dayjs(record.grabbedAt).format('MM-DD HH:mm') : '--' }}
              </template>
            </template>
            <template #emptyText><a-empty description="该月暂无领取记录" /></template>
          </a-table>
        </a-card>
      </template>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined, PhoneOutlined, GiftOutlined, CheckCircleOutlined,
  HourglassOutlined, PayCircleOutlined, HistoryOutlined,
} from '@ant-design/icons-vue';
import { getPhoneDetail, grabBenefit, ungrabBenefit } from '../../api/phone';

const router = useRouter();
const route = useRoute();
const phoneDetail = ref<any>(null);
const loading = ref(false);
const selectedMonth = ref<any>(dayjs());

const selectedMonthLabel = computed(() => selectedMonth.value?.format('YYYY年MM月') || '');
const selectedMonthStr = computed(() => selectedMonth.value?.format('YYYY-MM') || '');
const isCurrentMonth = computed(() => selectedMonthStr.value === dayjs().format('YYYY-MM'));

const grabbedCount = computed(() => {
  return phoneDetail.value?.grabRecords?.filter((r: any) => r.month === selectedMonthStr.value && r.status === '已领取').length || 0;
});

const totalCost = computed(() => {
  return phoneDetail.value?.benefits?.reduce((sum: number, pb: any) => sum + (pb.benefit?.cost ? Number(pb.benefit.cost) : 0), 0) || 0;
});

const getGrabStatus = (benefitId: number) => {
  const record = phoneDetail.value?.grabRecords?.find((r: any) => r.benefitId === benefitId && r.month === selectedMonthStr.value);
  if (record && record.status === '已领取') return '已领取';
  return '未领取';
};

const getBenefitName = (benefitId: number) => {
  const pb = phoneDetail.value?.benefits?.find((b: any) => b.benefitId === benefitId);
  return pb?.benefit?.name || '-';
};

const filteredRecords = computed(() => {
  return phoneDetail.value?.grabRecords?.filter((r: any) => r.month === selectedMonthStr.value) || [];
});

const benefitColumns = [
  { title: '权益名称', key: 'name', customRender: ({ record }: any) => record.benefit?.name || '-' },
  { title: '需要抢', key: 'needGrab', width: 80 },
  { title: '成本', key: 'cost', width: 100 },
  { title: '收益描述', key: 'value', customRender: ({ record }: any) => record.benefit?.benefitValue || '-', ellipsis: true },
  { title: '状态', key: 'status', width: 100 },
  { title: '领取日期范围', key: 'range', width: 120 },
  { title: '操作', key: 'action', width: 140 },
];

const recordColumns = [
  { title: '权益名称', key: 'benefitName', width: 180 },
  { title: '状态', key: 'status', width: 100 },
  { title: '领取时间', key: 'time', width: 120 },
];

const onMonthChange = () => {};

const handleGrab = async (benefitId: number) => {
  try {
    const res: any = await grabBenefit(Number(route.params.id), benefitId);
    if (res.code === 200) {
      message.success(res.message);
      fetchDetail();
    } else {
      message.error(res.message);
    }
  } catch {
    message.error('领取失败');
  }
};

const handleUngrab = async (benefitId: number) => {
  try {
    const res: any = await ungrabBenefit(Number(route.params.id), benefitId);
    if (res.code === 200) {
      message.success(res.message);
      fetchDetail();
    } else {
      message.error(res.message);
    }
  } catch {
    message.error('取消领取失败');
  }
};

const fetchDetail = async () => {
  loading.value = true;
  try {
    const id = Number(route.params.id);
    const res: any = await getPhoneDetail(id);
    if (res.code === 200) phoneDetail.value = res.data;
    else { message.error(res.message); router.push('/phone'); }
  } catch { message.error('获取详情失败'); router.push('/phone'); } finally { loading.value = false; }
};

onMounted(() => fetchDetail());
</script>
