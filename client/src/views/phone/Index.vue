<template>
  <div>
    <a-card :bordered="false" style="margin-bottom: 20px; border-radius: 12px">
      <div class="toolbar">
        <div class="toolbar-left">
          <a-input-search v-model:value="searchKeyword" placeholder="搜索手机号" style="width: 260px" @search="handleSearch" allow-clear />
          <a-button type="primary" @click="openModal()"><template #icon><plus-outlined /></template>新增号码</a-button>
        </div>
        <div class="toolbar-right">
          <a-space>
            <span style="color: #86909c; font-size: 13px"><calendar-outlined /> {{ currentDate }}</span>
            <span style="color: #e8ecf1">|</span>
            <span style="color: #86909c; font-size: 13px"><clock-circle-outlined /> {{ currentTime }}</span>
          </a-space>
        </div>
      </div>
    </a-card>

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && phoneList.length === 0" description="暂无号码数据" style="margin: 40px 0">
        <template #image><folder-open-outlined style="font-size: 48px; color: #d9dde3" /></template>
        <a-button type="primary" @click="openModal()"><template #icon><plus-outlined /></template>新增号码</a-button>
      </a-empty>

      <a-row v-else :gutter="[16, 16]">
        <a-col v-for="phone in phoneList" :key="phone.id" :xs="24" :sm="12" :lg="8" :xl="6">
          <a-card hoverable style="border-radius: 12px; cursor: pointer" @click="goToDetail(phone.id)">
            <template #title>
              <div style="display: flex; align-items: center; justify-content: space-between">
                <a-space>
                  <phone-outlined style="color: #1677ff" />
                  <span style="font-weight: 600; letter-spacing: 0.5px">{{ phone.phoneNumber }}</span>
                </a-space>
                <a-badge :status="phone.status === 1 ? 'success' : 'default'" :text="phone.status === 1 ? '启用' : '停用'" />
              </div>
            </template>

            <a-row :gutter="[8, 8]" style="text-align: center; margin-bottom: 16px">
              <a-col :span="8">
                <div style="font-size: 20px; font-weight: 600; color: #1d2129">{{ phone.totalBenefits }}</div>
                <div style="font-size: 12px; color: #86909c">已配置权益</div>
              </a-col>
              <a-col :span="8">
                <div style="font-size: 20px; font-weight: 600; color: #52c41a">{{ phone.grabbedCount }}</div>
                <div style="font-size: 12px; color: #86909c">已领取</div>
              </a-col>
              <a-col :span="8">
                <div style="font-size: 20px; font-weight: 600; color: #faad14">{{ phone.notGrabbedCount }}</div>
                <div style="font-size: 12px; color: #86909c">未领取</div>
              </a-col>
            </a-row>

            <a-divider style="margin: 12px 0" />

            <a-space direction="vertical" :size="6" style="width: 100%">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4e5969">
                <span><pay-circle-outlined style="margin-right: 6px; color: #86909c" />本月成本</span>
                <span style="font-weight: 500">¥{{ phone.monthlyCost.toFixed(2) }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4e5969">
                <span><rise-outlined style="margin-right: 6px; color: #86909c" />本月收益</span>
                <span style="font-weight: 500; color: #52c41a">¥{{ (phone.monthlyBenefit || 0).toFixed(2) }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4e5969">
                <span><clock-circle-outlined style="margin-right: 6px; color: #86909c" />最近领取</span>
                <span>{{ phone.lastGrabTime ? dayjs(phone.lastGrabTime).format('MM-DD') : '--' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4e5969">
                <span><car-outlined style="margin-right: 6px; color: #86909c" />快递状态</span>
                <a-tag :color="phone.expressStatus === '已签收' ? 'green' : phone.expressStatus === '已发货' ? 'blue' : 'default'" size="small">
                  {{ phone.expressStatus }}
                </a-tag>
              </div>
            </a-space>

            <template #actions>
              <span @click.stop="openModal(phone)"><edit-outlined /> 编辑</span>
              <span @click.stop="handleDelete(phone.id)" style="color: #ff4d4f"><delete-outlined /> 删除</span>
            </template>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>

    <div v-if="pagination.total > pagination.pageSize" style="margin-top: 20px; display: flex; justify-content: flex-end">
      <a-pagination
        v-model:current="pagination.current"
        v-model:pageSize="pagination.pageSize"
        :total="pagination.total"
        :page-size-options="['12', '24', '48']"
        show-size-changer
        :show-total="(total: number) => `共 ${total} 条`"
        @change="fetchPhones"
      />
    </div>

    <a-modal v-model:open="modalVisible" :title="editingRecord ? '编辑号码' : '新增号码'" @ok="handleSubmit" :confirm-loading="submitting" ok-text="确定" cancel-text="取消" width="560px">
      <a-form :model="formState" layout="vertical">
        <a-form-item label="手机号" required>
          <a-input v-model:value="formState.phoneNumber" placeholder="请输入手机号" maxlength="20" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formState.status">
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="0">停用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关联权益">
          <a-checkbox-group v-model:value="formState.benefitIds" :options="allBenefits.map(b => ({ label: b.name, value: b.id }))" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, ClockCircleOutlined,
  PhoneOutlined, FolderOpenOutlined, PayCircleOutlined, RiseOutlined, CarOutlined,
} from '@ant-design/icons-vue';
import { getPhones, createPhone, updatePhone, deletePhone } from '../../api/phone';
import { getBenefits } from '../../api/benefit';

const router = useRouter();
const searchKeyword = ref('');
const phoneList = ref<any[]>([]);
const allBenefits = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const pagination = reactive({ current: 1, pageSize: 12, total: 0 });

const currentDate = computed(() => dayjs().format('YYYY-MM-DD'));
const currentTime = computed(() => dayjs().format('HH:mm'));

const modalVisible = ref(false);
const editingRecord = ref<any>(null);
const formState = reactive({ phoneNumber: '', status: 1, benefitIds: [] as number[] });

const fetchPhones = async () => {
  loading.value = true;
  try {
    const res: any = await getPhones({ keyword: searchKeyword.value || undefined, page: pagination.current, pageSize: pagination.pageSize });
    if (res.code === 200) { phoneList.value = res.data.list; pagination.total = res.data.total; }
  } catch { message.error('获取号码列表失败'); } finally { loading.value = false; }
};

const fetchBenefits = async () => {
  try { const res: any = await getBenefits({ pageSize: 100 }); if (res.code === 200) allBenefits.value = res.data.list; } catch {}
};

const handleSearch = () => { pagination.current = 1; fetchPhones(); };
const goToDetail = (id: number) => router.push(`/phone/${id}`);

const openModal = (record?: any) => {
  editingRecord.value = record || null;
  fetchBenefits();
  if (record) {
    Object.assign(formState, { phoneNumber: record.phoneNumber, status: record.status, benefitIds: (record.benefits || []).map((b: any) => b.benefitId) });
  } else {
    Object.assign(formState, { phoneNumber: '', status: 1, benefitIds: [] });
  }
  modalVisible.value = true;
};

const handleSubmit = async () => {
  if (!formState.phoneNumber) { message.warning('请输入手机号'); return; }
  submitting.value = true;
  try {
    const res: any = editingRecord.value
      ? await updatePhone(editingRecord.value.id, { ...formState })
      : await createPhone({ ...formState });
    if (res.code === 200) { message.success(res.message); modalVisible.value = false; fetchPhones(); }
    else message.error(res.message);
  } catch { message.error('操作失败'); } finally { submitting.value = false; }
};

const handleDelete = (id: number) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该号码吗？相关数据将一并删除，此操作不可恢复。',
    okText: '确定删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      const res: any = await deletePhone(id);
      if (res.code === 200) { message.success('删除成功'); fetchPhones(); }
      else message.error(res.message);
    },
  });
};

onMounted(() => fetchPhones());
</script>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.toolbar-left { display: flex; align-items: center; gap: 12px; }
</style>
