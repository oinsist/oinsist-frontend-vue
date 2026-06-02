<script setup lang="ts">
import { computed } from 'vue'
import type { RouterVo } from '@/types/router'
import { resolveMenuIcon } from '@/utils/menuIcon'

const props = defineProps<{
  item: RouterVo
  basePath: string
}>()

const joinPath = (basePath: string, path: string) => {
  if (path.startsWith('/')) return path
  const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
  const child = path.startsWith('/') ? path.slice(1) : path
  return base ? `${base}/${child}` : `/${child}`
}

const fullPath = computed(() => joinPath(props.basePath, props.item.path))
const visibleChildren = computed(() => (props.item.children ?? []).filter((child) => !child.hidden))
const hasChildren = computed(() => visibleChildren.value.length > 0)
</script>

<template>
  <el-sub-menu v-if="!item.hidden && hasChildren" :index="fullPath">
    <template #title>
      <el-icon>
        <component :is="resolveMenuIcon(item.meta.icon)" />
      </el-icon>
      <span>{{ item.meta.title }}</span>
    </template>

    <SidebarItem
      v-for="child in visibleChildren"
      :key="child.name"
      :item="child"
      :base-path="fullPath"
    />
  </el-sub-menu>

  <el-menu-item v-else-if="!item.hidden" :index="fullPath">
    <el-icon>
      <component :is="resolveMenuIcon(item.meta.icon)" />
    </el-icon>
    <span>{{ item.meta.title }}</span>
  </el-menu-item>
</template>

<style scoped lang="scss"></style>
