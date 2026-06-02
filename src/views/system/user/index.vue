<script setup lang="ts"></script>

<template>
  <section class="page">
    <h2 class="page__title">用户管理</h2>
    <div class="page__actions">
      <el-button v-hasPermi="['system:user:add']" type="primary">新增用户</el-button>
      <el-button v-hasPermi="['nonexist:perm']" type="warning">不存在权限</el-button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.page {
  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  &__actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
  }
}
</style>
