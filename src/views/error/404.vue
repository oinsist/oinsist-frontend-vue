<script setup lang="ts"></script>

<template>
  <main class="not-found">
    <h1 class="not-found__title">404</h1>
    <p class="not-found__text">页面不存在</p>
  </main>
</template>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #1f2937;

  &__title {
    margin: 0;
    font-size: 48px;
    font-weight: 700;
  }

  &__text {
    margin: 12px 0 0;
    font-size: 16px;
  }
}
</style>
