<template>
  <div>
    <a-card :bordered="false" style="margin-bottom: 20px; border-radius: 12px">
      <div class="toolbar">
        <div class="toolbar-left">
          <a-input-search v-model:value="searchKeyword" placeholder="搜索优惠券名称" style="width: 260px" @search="handleSearch" allow-clear />
          <a-select v-model:value="searchBenefitId" placeholder="筛选权益" allow-clear style="width: 180px" @change="handleSearch">
            <a-select-option v-for="b in allBenefits" :key="b.id" :value="b.id">{{ b.name }}</a-select-option>
          </a-select>
          <a-button type="primary" @click="openModal()"><template #icon><plus-outlined /></template>新增优惠券</a-button>
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

    <a-card :bordered="false" style="border-radius: 12px">
      <template #title>
        <a-space>
          <tags-outlined style="color: #1677ff" />
          <span>优惠券列表</span>
          <span style="color: #86909c; font-weight: 400; font-size: 13px">(共 {{ pagination.total }} 项)</span>
        </a-space>
      </template>
      <template #extra>
        <a-button size="small" @click="fetchCoupons"><reload-outlined /> 刷新</a-button>
      </template>

      <a-table :columns="columns" :data-source="couponList" :pagination="tablePagination" :loading="loading" row-key="id" @change="handleTableChange" size="middle">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'benefitName'">
            <a-tag v-if="record.benefit" color="blue">{{ record.benefit.name }}</a-tag>
            <span v-else style="color: #c9cdd4">未关联</span>
          </template>
          <template v-if="column.key === 'needGrab'">
            <a-tag :color="record.needGrab ? 'orange' : 'green'">{{ record.needGrab ? '是' : '否' }}</a-tag>
          </template>
          <template v-if="column.key === 'forPhysical'">
            <a-tag :color="record.forPhysical ? 'orange' : 'default'">{{ record.forPhysical ? '实物' : '非实物' }}</a-tag>
          </template>
          <template v-if="column.key === 'validity'">{{ formatValidity(record) }}</template>
          <template v-if="column.key === 'status'">
            <a-badge :status="record.status === 1 ? 'success' : 'error'" :text="record.status === 1 ? '启用' : '停用'" />
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="openModal(record)"><edit-outlined /> 编辑</a>
              <a-popconfirm title="确定删除该优惠券？" @confirm="handleDelete(record.id)" ok-text="确定" cancel-text="取消">
                <a style="color: #ff4d4f"><delete-outlined /> 删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="modalVisible" :title="editingRecord ? '编辑优惠券' : '新增优惠券'" @ok="handleSubmit" :confirm-loading="submitting" ok-text="确定" cancel-text="取消">
      <a-form :model="formState" layout="vertical">
        <a-form-item label="优惠券名称" required>
          <a-input v-model:value="formState.name" placeholder="请输入优惠券名称" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="是否需要抢">
              <a-select v-model:value="formState.needGrab">
                <a-select-option :value="0">否</a-select-option>
                <a-select-option :value="1">是</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="是否实物券">
              <a-select v-model:value="formState.forPhysical">
                <a-select-option :value="0">否</a-select-option>
                <a-select-option :value="1">是</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="排序">
              <a-input-number v-model:value="formState.sortOrder" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="有效期类型">
          <a-radio-group v-model:value="validityType">
            <a-radio value="days">按天数</a-radio>
            <a-radio value="range">固定日期</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="validityType === 'days'" label="有效天数">
          <a-input-number v-model:value="formState.validDays" :min="1" style="width: 100%" placeholder="领取后N天内有效" />
        </a-form-item>
        <a-row v-if="validityType === 'range'" :gutter="16">
          <a-col :span="12">
            <a-form-item label="有效期开始">
              <a-date-picker v-model:value="formState.validStart" style="width: 100%" value-format="YYYY-MM-DD" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="有效期结束">
              <a-date-picker v-model:value="formState.validEnd" style="width: 100%" value-format="YYYY-MM-DD" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="状态">
          <a-select v-model:value="formState.status">
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="0">停用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  CalendarOutlined, ClockCircleOutlined, TagsOutlined,
} from '@ant-design/icons-vue';
import { getBenefits } from '../../api/benefit';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../api/coupon';

const searchKeyword = ref('');
const searchBenefitId = ref<number | undefined>(undefined);
const couponList = ref<any[]>([]);
const allBenefits = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });

const currentDate = computed(() => dayjs().format('YYYY-MM-DD'));
const currentTime = computed(() => dayjs().format('HH:mm'));

const tablePagination = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50'],
}));

const columns = [
  { title: '优惠券名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '所属权益', key: 'benefitName', width: 120 },
  { title: '需要抢', key: 'needGrab', width: 80 },
  { title: '实物券', key: 'forPhysical', width: 80 },
  { title: '有效期', key: 'validity', width: 220 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' as const },
];

const modalVisible = ref(false);
const editingRecord = ref<any>(null);
const formState = reactive({
  name: '', needGrab: 0, forPhysical: 0,
  validDays: null as number | null,
  validStart: null as string | null,
  validEnd: null as string | null,
  sortOrder: 0, status: 1,
});
const validityType = ref<'days' | 'range'>('days');

const formatValidity = (coupon: any) => {
  if (coupon.validDays) return `领取后${coupon.validDays}天内有效`;
  if (coupon.validStart && coupon.validEnd) {
    return `${dayjs(coupon.validStart).format('YYYY-MM-DD')} ~ ${dayjs(coupon.validEnd).format('YYYY-MM-DD')}`;
  }
  return '-';
};

const fetchBenefits = async () => {
  try {
    const res: any = await getBenefits({ pageSize: 100 });
    if (res.code === 200) allBenefits.value = res.data.list;
  } catch {}
};

const fetchCoupons = async () => {
  loading.value = true;
  try {
    const res: any = await getAllCoupons({
      keyword: searchKeyword.value || undefined,
      benefitId: searchBenefitId.value,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
    if (res.code === 200) {
      couponList.value = res.data.list;
      pagination.total = res.data.total;
    }
  } catch {
    message.error('获取优惠券列表失败');
  } finally { loading.value = false; }
};

const handleSearch = () => { pagination.current = 1; fetchCoupons(); };
const handleTableChange = (pag: any) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchCoupons(); };

const openModal = (record?: any) => {
  editingRecord.value = record || null;
  if (record) {
    validityType.value = record.validDays ? 'days' : 'range';
    Object.assign(formState, {
      name: record.name, needGrab: record.needGrab, forPhysical: record.forPhysical ?? 0,
      validDays: record.validDays,
      validStart: record.validStart ? dayjs(record.validStart).format('YYYY-MM-DD') : null,
      validEnd: record.validEnd ? dayjs(record.validEnd).format('YYYY-MM-DD') : null,
      sortOrder: record.sortOrder, status: record.status,
    });
  } else {
    validityType.value = 'days';
    Object.assign(formState, {
      name: '', needGrab: 0, forPhysical: 0, validDays: null, validStart: null,
      validEnd: null, sortOrder: 0, status: 1,
    });
  }
  modalVisible.value = true;
};

const handleSubmit = async () => {
  if (!formState.name) { message.warning('请输入优惠券名称'); return; }
  submitting.value = true;
  try {
    const data: any = {
      name: formState.name, needGrab: formState.needGrab, forPhysical: formState.forPhysical,
      sortOrder: formState.sortOrder, status: formState.status,
      validDays: validityType.value === 'days' ? formState.validDays : null,
      validStart: validityType.value === 'range' ? formState.validStart : null,
      validEnd: validityType.value === 'range' ? formState.validEnd : null,
    };
    const res: any = editingRecord.value
      ? await updateCoupon(editingRecord.value.id, data)
      : await createCoupon(data);
    if (res.code === 200) { message.success(res.message); modalVisible.value = false; fetchCoupons(); }
    else message.error(res.message);
  } catch { message.error('操作失败'); } finally { submitting.value = false; }
};

const handleDelete = async (id: number) => {
  try {
    const res: any = await deleteCoupon(id);
    if (res.code === 200) { message.success('删除成功'); fetchCoupons(); }
    else message.error(res.message);
  } catch { message.error('删除失败'); }
};

onMounted(() => { fetchBenefits(); fetchCoupons(); });
</script>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.toolbar-left { display: flex; align-items: center; gap: 12px; }
</style>
