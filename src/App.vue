<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
html, body, #app {
  height: 100%;
}
body {
  background: var(--color-background);
}
</style>

<template>
  <router-view></router-view>
</template>