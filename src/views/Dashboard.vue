<template>
  <FixturesList :fixtures="fixtures"/>
</template>

<script setup lang="ts">
import { watch, computed, onMounted, ref } from 'vue'
import FixturesList from '@/components/FixturesList.vue'
import { useApp } from '@/composables/useApp'
const { events, isBackendReady} = useApp();
const fixtures = ref([]);

async function loadFixtures() {
  try {
    console.log('🔍 Cargando eventos...')
  
    if (!isBackendReady.value) {
      console.warn('⚠️ Backend no está listo')
      return
    }

    
    const response = events()
    fixtures.value = response.data?.events || [];
  } catch (error) {
    console.error('❌ Error al cargar fixtures:', error)
    fixtures.value = []
  }
}

console.log("isBackendReady", isBackendReady.value);  
watch(isBackendReady, (newVal) => {
  if (newVal) {
    loadFixtures();
  }
}, { immediate: true });
</script>