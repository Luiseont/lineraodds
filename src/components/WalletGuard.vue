<template>
  <slot :showPrompt="!connected" />
</template>

<script setup lang="ts">
import { useWallet } from '@/composables/useWallet'

const { connected } = useWallet()
</script>
