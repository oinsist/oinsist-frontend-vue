<script setup lang="ts">
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const permissionStore = usePermissionStore()
</script>

<template>
  <el-menu
    class="sidebar-menu"
    :default-active="route.path"
    router
    unique-opened
    background-color="#1f2937"
    text-color="#d1d5db"
    active-text-color="#ffffff"
  >
    <SidebarItem
      v-for="item in permissionStore.menuTree"
      :key="item.name"
      :item="item"
      base-path=""
    />
  </el-menu>
</template>

<style scoped lang="scss">
.sidebar-menu {
  width: 100%;
  min-height: 100vh;
  border-right: 0;
}
</style>
