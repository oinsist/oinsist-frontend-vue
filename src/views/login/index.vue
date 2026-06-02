<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import type { LoginBody } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive<LoginBody>({
  username: '',
  password: '',
  tenantId: 1,
})

const rules: FormRules<LoginBody> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const getRedirect = () => {
  const redirect = route.query.redirect
  if (Array.isArray(redirect)) return redirect[0] ?? '/'
  return redirect ?? '/'
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
</script>

<template>
  <main class="login">
    <el-form ref="formRef" class="login__form" :model="form" :rules="rules" @submit.prevent>
      <h1 class="login__title">系统登录</h1>
      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="用户名" autocomplete="username" />
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
}
</style>
