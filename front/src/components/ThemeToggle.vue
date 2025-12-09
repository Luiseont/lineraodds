<template>
  <button
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
    @click="toggle"
  >
    <svg v-if="!isDark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
      <path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM12 18a6 6 0 100-12 6 6 0 000 12zm8.25-6a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H21a.75.75 0 01-.75-.75zM3 12a.75.75 0 01-.75.75H.75a.75.75 0 010-1.5H2.25A.75.75 0 013 12zm16.03 6.53a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM2.85 3.35a.75.75 0 011.06 0l1.06 1.06A.75.75 0 013.91 5.47L2.85 4.41a.75.75 0 010-1.06zM12 18.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" />
    </svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
      <path fill-rule="evenodd" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" clip-rule="evenodd" />
    </svg>
    <span>{{ isDark ? 'Oscuro' : 'Claro' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted } from 'vue'

const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})

watchEffect(() => {
  if (isDark.value) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
})

function toggle() {
  isDark.value = !isDark.value
}
</script>
