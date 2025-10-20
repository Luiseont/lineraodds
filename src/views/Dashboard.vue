<template>
  <FixturesList />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useApp } from '@/composables/useApp'
import { useWallet } from '@/composables/useWallet'
import FixturesList from '@/components/FixturesList.vue'

const { getCounter } = useApp()
const { connected } = useWallet()

watch(connected, (newVal) => {
  if (newVal) {
    getCounter()
  }
})
</script>