<template>
  <div class="space-y-4">
    <!-- Events Header with Type Filters -->
    <div class="card p-4 sm:p-6">
      <div class="flex flex-col gap-3">
        <h2 class="text-xl sm:text-2xl font-bold text-secondary">
          <span class="inline-block w-1.5 h-6 bg-primary align-middle mr-2 rounded-sm"></span>
          Events
        </h2>
        
        <!-- Event Type Filters -->
        <div class="flex gap-2 flex-wrap">
          <button
            @click="handleTypeFilter(null)"
            class="px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium transition-all border-2"
            :class="selectedEventType === null 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white text-gray-600 border-gray-300 hover:border-primary'"
          >
            All Sports
          </button>
          <button
            v-for="type in eventTypes"
            :key="type"
            @click="handleTypeFilter(type)"
            class="px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium transition-all border-2"
            :class="selectedEventType === type 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white text-primary border-primary hover:bg-primary-soft'"
          >
            {{ type }}
          </button>
        </div>
      </div>
    </div>

    <!-- Status Filter Tabs -->
    <div class="card p-3 sm:p-4">
      <div class="flex gap-1.5 sm:gap-2 flex-wrap">
        <button
          v-for="status in statusFilters"
          :key="status"
          @click="handleStatusFilter(status)"
          class="px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-base font-medium transition-all relative"
          :class="selectedStatus === status 
            ? 'bg-primary text-white shadow-md' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          {{ status }}
          <!-- Pulsing red dot for LIVE -->
          <span 
            v-if="status === 'LIVE'" 
            class="absolute -top-1 -right-1 flex h-3 w-3"
          >
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="card p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading events...</p>
    </div>

    <!-- Events List -->
    <template v-else>
      <FixturesList 
        v-if="events.length > 0" 
        :fixtures="events" 
        :show-header="false"
      />
      <div v-else class="card p-12 text-center">
        <div class="text-gray-400 text-lg">
          {{ emptyStateMessage }}
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="events.length > 0"
        :current-page="currentPage"
        :has-more="events.length === 10"
        @next="nextPage"
        @previous="previousPage"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FixturesList from '@/components/FixturesList.vue'
import Pagination from '@/components/Pagination.vue'
import { useEvents } from '@/composables/useEvents'

const { 
  events,
  currentPage,
  nextPage,
  previousPage,
  setFilters,
  cleanup
} = useEvents()

const isLoading = ref(false)
const statusFilters = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']
const selectedStatus = ref('SCHEDULED')
const selectedEventType = ref<string | null>(null)

// Extract unique event types from events
const eventTypes = computed(() => {
  const types = new Set<string>()
  events.value.forEach((event: any) => {
    if (event.typeEvent) {
      types.add(event.typeEvent)
    }
  })
  return Array.from(types).sort()
})

const emptyStateMessage = computed(() => {
  if (selectedStatus.value === 'SCHEDULED') {
    return 'Waiting for new opportunities...'
  }
  return 'No events available'
})

async function handleStatusFilter(status: string) {
  selectedStatus.value = status
  isLoading.value = true
  await setFilters(status, selectedEventType.value || undefined)
  isLoading.value = false
}

async function handleTypeFilter(type: string | null) {
  selectedEventType.value = type
  isLoading.value = true
  await setFilters(selectedStatus.value, type || undefined)
  isLoading.value = false
}

// Load initial events
onMounted(async () => {
  isLoading.value = true
  await setFilters(selectedStatus.value, undefined)
  isLoading.value = false
})

// Cleanup when component unmounts
onUnmounted(() => {
  cleanup()
})
</script>