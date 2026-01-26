<template>
  <div class="min-h-screen" style="background: var(--color-muted, #faf7f6)">
    <NavBar />
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>
    <OnboardingModal />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '@/components/NavBarMobile.vue'
import OnboardingModal from '@/components/OnboardingModal.vue'
// MainLayout logic
</script>
