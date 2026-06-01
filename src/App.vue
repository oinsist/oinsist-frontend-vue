<script setup lang="ts">
console.log('[env]', import.meta.env.VITE_APP_BASE_API)
</script>

<template>
  <main class="app">
    <h1>Hello</h1>
  </main>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}
</style>
