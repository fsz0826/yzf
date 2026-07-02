<template>
  <div>
    <a-card :bordered="false" style="margin-bottom: 20px; border-radius: 12px">
      <div class="toolbar">
        <div class="toolbar-left">
          <a-input-search v-model:value="searchKeyword" placeholder="搜索权益名称" style="width: 260px" @search="handleSearch" allow-clear />
          <a-button type="primary" @click="openBenefitModal()"><template #icon><plus-outlined /></template>新增权益</a-button>
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
          <bars-outlined style="color: #1677ff" />
          <span>权益列表</span>
          <span style="color: #86909c; font-weight: 400; font-size: 13px">(共 {{ pagination.total }} 项)</span>
        </a-space>
      </template>
      <template #extra>
        <a-button size="small" @click="fetchBenefits"><reload-outlined /> 刷新</a-button>
      </template>

      <a-table
        ref="tableRef"
        :columns="columns"
        :data-source="benefitList"
        :pagination="tablePagination"
        :loading="loading"
        row-key="id"
        :custom-row="customRow"
        @change="handleTableChange"
        size="middle"
        class="benefit-expand-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <right-outlined :class="['expand-arrow', { rotated: isRowExpanded(record.id) }]" />
            <strong>{{ record.name }}</strong>
          </template>
          <template v-if="column.key === 'needGrab'">
            <a-tag :color="record.needGrab ? 'orange' : 'green'">{{ record.needGrab ? '是' : '否' }}</a-tag>
          </template>
          <template v-if="column.key === 'cost'">{{ record.cost != null ? `¥${record.cost}` : '-' }}</template>
          <template v-if="column.key === 'couponCount'"><a-tag color="blue">{{ record.coupons?.length || 0 }} 张</a-tag></template>
          <template v-if="column.key === 'status'">
            <a-badge :status="record.status === 1 ? 'success' : 'error'" :text="record.status === 1 ? '启用' : '停用'" />
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click.stop="openBenefitModal(record)"><edit-outlined /> 编辑</a>
              <a-popconfirm title="删除权益会取消关联的优惠券，确定删除？" @confirm="handleDeleteBenefit(record.id)" ok-text="确定" cancel-text="取消">
                <a style="color: #ff4d4f" @click.stop><delete-outlined /> 删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>

        <template #expandedRowRender="{ record }">
          <div style="padding: 8px 0">
            <a-space style="margin-bottom: 12px">
              <tag-outlined style="color: #1677ff" />
              <strong>关联优惠券</strong>
            </a-space>
            <a-table
              v-if="record.coupons && record.coupons.length"
              :columns="couponColumns"
              :data-source="record.coupons"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column: cCol, record: coupon }">
                <template v-if="cCol.key === 'needGrab'">
                  <a-tag :color="coupon.needGrab ? 'orange' : 'green'">{{ coupon.needGrab ? '是' : '否' }}</a-tag>
                </template>
                <template v-if="cCol.key === 'forPhysical'">
                  <a-tag :color="coupon.forPhysical ? 'orange' : 'default'">{{ coupon.forPhysical ? '实物' : '非实物' }}</a-tag>
                </template>
                <template v-if="cCol.key === 'validity'">{{ coupon.usableAfterDays > 0 ? `领取后第${coupon.usableAfterDays}天可用` : '立即可用' }}，{{ getDaysUntilMonthEnd() }}天后过期</template>
                <template v-if="cCol.key === 'status'">
                  <a-badge :status="coupon.status === 1 ? 'success' : 'error'" :text="coupon.status === 1 ? '启用' : '停用'" />
                </template>
              </template>
            </a-table>
            <a-empty v-else description="暂无关联优惠券" :image-style="{ height: '40px' }" />
          </div>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="benefitModalVisible" :title="editingBenefit ? '编辑权益' : '新增权益'" @ok="handleSubmitBenefit" :confirm-loading="submitting" width="640px" ok-text="确定" cancel-text="取消">
      <a-form :model="benefitForm" layout="vertical">
        <a-form-item label="权益名称" required>
          <a-input v-model:value="benefitForm.name" placeholder="请输入权益名称" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="是否需要抢">
              <a-select v-model:value="benefitForm.needGrab">
                <a-select-option :value="0">否</a-select-option>
                <a-select-option :value="1">是</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="成本">
              <a-input-number v-model:value="benefitForm.cost" :min="0" :precision="2" style="width: 100%" placeholder="请输入成本" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="收益描述">
          <a-input v-model:value="benefitForm.benefitValue" placeholder="请输入收益描述" />
        </a-form-item>
        <a-form-item label="领取推荐">
          <a-input v-model:value="benefitForm.recommendation" placeholder="请输入领取推荐" />
        </a-form-item>
        <a-form-item label="收益计算方式">
          <a-textarea v-model:value="benefitForm.calculationMethod" :rows="3" placeholder="请输入收益计算方式" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="排序">
              <a-input-number v-model:value="benefitForm.sortOrder" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="benefitForm.status">
                <a-select-option :value="1">启用</a-select-option>
                <a-select-option :value="0">停用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="关联优惠券">
          <a-select v-model:value="benefitForm.couponIds" mode="multiple" placeholder="请选择关联的优惠券" :options="availableCoupons" :field-names="{ label: 'name', value: 'id' }" show-search :filter-option="(input: string, option: any) => option.name.includes(input)" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { Table } from 'ant-design-vue';
import {
  PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  CalendarOutlined, ClockCircleOutlined, BarsOutlined, TagOutlined, RightOutlined,
} from '@ant-design/icons-vue';
import { getBenefits, createBenefit, updateBenefit, deleteBenefit } from '../../api/benefit';
import { getAllCoupons } from '../../api/coupon';

const searchKeyword = ref('');
const benefitList = ref<any[]>([]);
const availableCoupons = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const tableRef = ref<InstanceType<typeof Table> | null>(null);

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
  { title: '权益名称', key: 'name', width: 180 },
  { title: '需要抢', key: 'needGrab', width: 80 },
  { title: '成本', key: 'cost', width: 100 },
  { title: '收益描述', dataIndex: 'benefitValue', key: 'benefitValue', ellipsis: true },
  { title: '关联优惠', key: 'couponCount', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' as const },
];

const couponColumns = [
  { title: '优惠券名称', dataIndex: 'name', key: 'name' },
  { title: '需要抢', key: 'needGrab', width: 80 },
  { title: '实物券', key: 'forPhysical', width: 80 },
  { title: '有效期', key: 'validity', width: 200 },
  { title: '状态', key: 'status', width: 80 },
];

const benefitModalVisible = ref(false);
const editingBenefit = ref<any>(null);
const benefitForm = reactive({
  name: '', needGrab: 0, cost: null as number | null, benefitValue: '',
  recommendation: '', calculationMethod: '', sortOrder: 0, status: 1, couponIds: [] as number[],
});

const getDaysUntilMonthEnd = () => {
  const now = dayjs();
  const lastDay = now.endOf('month');
  return lastDay.diff(now, 'day');
};

const isRowExpanded = (id: number) => {
  try {
    const expandedRows = tableRef.value?.expandedRowKeys || [];
    return expandedRows.includes(id);
  } catch { return false; }
};

const customRow = (record: any) => ({
  style: { cursor: 'pointer' },
  onClick: (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('.ant-popconfirm') || t.closest('button') || t.closest('input') || t.closest('.ant-tag') || t.closest('a')) return;
    nextTick(() => {
      const rows = document.querySelectorAll('.benefit-expand-table .ant-table-row');
      rows.forEach((row) => {
        if (row.getAttribute('data-row-key') === String(record.id)) {
          const expandBtn = row.querySelector('.ant-table-row-expand-icon') as HTMLElement;
          if (expandBtn) expandBtn.click();
        }
      });
    });
  },
});

const fetchBenefits = async () => {
  loading.value = true;
  try {
    const res: any = await getBenefits({ keyword: searchKeyword.value || undefined, page: pagination.current, pageSize: pagination.pageSize });
    if (res.code === 200) { benefitList.value = res.data.list; pagination.total = res.data.total; }
  } catch { message.error('获取权益列表失败'); } finally { loading.value = false; }
};

const fetchCoupons = async () => {
  try { const res: any = await getAllCoupons({ pageSize: 200 }); if (res.code === 200) availableCoupons.value = res.data.list; } catch {}
};

const handleSearch = () => { pagination.current = 1; fetchBenefits(); };
const handleTableChange = (pag: any) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchBenefits(); };

const openBenefitModal = (record?: any) => {
  editingBenefit.value = record || null;
  fetchCoupons();
  if (record) {
    Object.assign(benefitForm, {
      name: record.name, needGrab: record.needGrab, cost: record.cost, benefitValue: record.benefitValue,
      recommendation: record.recommendation, calculationMethod: record.calculationMethod, sortOrder: record.sortOrder,
      status: record.status, couponIds: (record.coupons || []).map((c: any) => c.id),
    });
  } else {
    Object.assign(benefitForm, { name: '', needGrab: 0, cost: null, benefitValue: '', recommendation: '', calculationMethod: '', sortOrder: 0, status: 1, couponIds: [] });
  }
  benefitModalVisible.value = true;
};

const handleSubmitBenefit = async () => {
  if (!benefitForm.name) { message.warning('请输入权益名称'); return; }
  submitting.value = true;
  try {
    const res: any = editingBenefit.value ? await updateBenefit(editingBenefit.value.id, { ...benefitForm }) : await createBenefit({ ...benefitForm });
    if (res.code === 200) { message.success(res.message); benefitModalVisible.value = false; fetchBenefits(); } else message.error(res.message);
  } catch { message.error('操作失败'); } finally { submitting.value = false; }
};

const handleDeleteBenefit = async (id: number) => {
  try {
    const res: any = await deleteBenefit(id);
    if (res.code === 200) { message.success('删除成功'); fetchBenefits(); } else message.error(res.message);
  } catch { message.error('删除失败'); }
};

onMounted(() => fetchBenefits());
</script>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.toolbar-left { display: flex; align-items: center; gap: 12px; }
.toolbar-right { display: flex; align-items: center; }

/* 隐藏默认加号，但保留 DOM 让 JS 可以触发 */
.benefit-expand-table :deep(.ant-table-row-expand-icon) {
  opacity: 0;
  width: 0;
  padding: 0;
  border: none;
  pointer-events: none;
}

/* 自定义箭头 */
.expand-arrow {
  font-size: 12px;
  color: #86909c;
  margin-right: 8px;
  transition: transform 0.2s;
  display: inline-block;
}
.expand-arrow.rotated {
  transform: rotate(90deg);
  color: #1677ff;
}
</style>
