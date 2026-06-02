<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import Sidebar from './components/Sidebar/index.vue'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  await userStore.logoutAction()
  await router.push('/login')
}
</script>

<template>
  <div class="layout">
    <aside class="layout__aside">
      <Sidebar />
    </aside>
    <section class="layout__main">
      <header class="layout__header">
        <div class="layout__title">OInsist Admin</div>
        <el-button type="danger" plain @click="handleLogout">退出</el-button>
      </header>
      <main class="layout__content">
        <router-view />
      </main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.layout {
  min-height: 100vh;
  display: flex;
  background: #f5f7fb;

  &__aside {
    width: 220px;
    flex-shrink: 0;
    background: #1f2937;
  }

  &__main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__header {
    height: 56px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  &__content {
    flex: 1;
    padding: 20px;
  }
}
</style>
