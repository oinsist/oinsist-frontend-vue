<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { listTenantOptions } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'
import type { LoginBody, TenantOptionVo } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

defineOptions({
  name: 'LoginView',
})

const formRef = ref<FormInstance>()
const loading = ref(false)
const tenantLoading = ref(false)
const tenantOptions = ref<TenantOptionVo[]>([])
const form = reactive<LoginBody>({
  username: '',
  password: '',
  tenantId: localStorage.getItem('TenantId') ?? '1',
})

const rules: FormRules<LoginBody> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  tenantId: [{ required: true, message: '请选择租户', trigger: 'change' }],
}

const getRedirect = () => {
  const redirect = route.query.redirect
  const value = Array.isArray(redirect) ? redirect[0] : redirect
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.login(form)
    await router.push(getRedirect())
  } finally {
    loading.value = false
  }
}

const loadTenants = async () => {
  tenantLoading.value = true
  try {
    const tenants = (await listTenantOptions()).map((tenant) => ({
      ...tenant,
      tenantId: String(tenant.tenantId),
    }))
    tenantOptions.value = tenants
    if (!tenants.some((tenant) => String(tenant.tenantId) === form.tenantId)) {
      form.tenantId = tenants[0]?.tenantId ?? '1'
    }
  } catch {
    tenantOptions.value = [{ tenantId: '1', tenantName: '默认租户' }]
    form.tenantId = '1'
  } finally {
    tenantLoading.value = false
  }
}

onMounted(() => {
  loadTenants()
})
</script>

<template>
  <main class="login">
    <el-form ref="formRef" class="login__form" :model="form" :rules="rules" @submit.prevent>
      <h1 class="login__title">系统登录</h1>
      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="用户名" autocomplete="username" />
      </el-form-item>
      <el-form-item prop="tenantId">
        <el-select
          v-model="form.tenantId"
          class="login__select"
          placeholder="请选择租户"
          :loading="tenantLoading"
          filterable
        >
          <el-option
            v-for="tenant in tenantOptions"
            :key="tenant.tenantId"
            :label="tenant.tenantName"
            :value="tenant.tenantId"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          placeholder="密码"
          type="password"
          autocomplete="current-password"
          show-password
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
      <el-button class="login__button" type="primary" :loading="loading" @click="handleSubmit">
        登录
      </el-button>
    </el-form>
  </main>
</template>

<style scoped lang="scss">
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2f7;

  &__form {
    width: 360px;
    padding: 32px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 12px 32px rgb(15 23 42 / 12%);
  }

  &__title {
    margin: 0 0 24px;
    font-size: 22px;
    font-weight: 600;
    text-align: center;
    color: #111827;
  }

  &__button {
    width: 100%;
  }

  &__select {
    width: 100%;
  }
}
</style>
