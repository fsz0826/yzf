<template>
  <div>
    <h2>仪表盘</h2>
    <a-row :gutter="16">
      <a-col :span="6">
        <a-card>
          <a-statistic title="手机号总数" :value="0" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="权益总数" :value="0" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="本月已领取" :value="0" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="待领取" :value="0" />
        </a-card>
      </a-col>
    </a-row>
    <a-divider />
    <a-empty description="功能开发中..." />
  </div>
</template>
