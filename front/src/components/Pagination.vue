<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-lg sm:px-6">
    <!-- Mobile -->
    <div class="flex-1 flex justify-between sm:hidden">
      <button
        @click="$emit('previous')"
        :disabled="currentPage === 1"
        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md"
        :class="currentPage > 1 ? 'text-gray-700 bg-white hover:bg-gray-50' : 'text-gray-400 bg-gray-100 cursor-not-allowed'"
      >
        Previous
      </button>
      <span class="text-sm text-gray-700 self-center">
        Page {{ currentPage }}
      </span>
      <button
        @click="$emit('next')"
        :disabled="!hasMore"
        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md"
        :class="hasMore ? 'text-gray-700 bg-white hover:bg-gray-50' : 'text-gray-400 bg-gray-100 cursor-not-allowed'"
      >
        Next
      </button>
    </div>

    <!-- Desktop -->
    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-end">
      <!-- Navigation buttons -->
      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
        <button
          @click="$emit('previous')"
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium"
          :class="currentPage > 1 ? 'text-gray-500 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'"
        >
          ← Prev
        </button>

        <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
          {{ currentPage }}
        </span>

        <button
          @click="$emit('next')"
          :disabled="!hasMore"
          class="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium"
          :class="hasMore ? 'text-gray-500 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'"
        >
          Next →
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPage: number
  hasMore: boolean
}>()

defineEmits<{
  next: []
  previous: []
}>()
</script>
