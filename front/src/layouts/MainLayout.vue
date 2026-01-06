<template>
  <div class="min-h-screen" style="background: var(--color-muted, #faf7f6)">
    <NavBar />
    <main class="container mx-auto px-4 py-8">
      <ConnectWalletPrompt v-if="!connected" />
      <RouterView v-else />
    </main>
    <OnboardingModal />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '@/components/NavBarMobile.vue'
import ConnectWalletPrompt from '@/components/ConnectWalletPrompt.vue'
import OnboardingModal from '@/components/OnboardingModal.vue'
import { useWallet } from '@/composables/useWallet'

const { connected } = useWallet()
</script>
