<template>
  <div v-if="winners.length > 0" class="card overflow-hidden">
    <!-- Header with gradient background -->
    <div class="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white">Last Week's Winners</h3>
          <p class="text-xs text-white/80">Congratulations to our top performers! 🎉</p>
        </div>
      </div>
    </div>

    <!-- Winners List -->
    <div class="p-6 bg-gradient-to-br from-gray-50 to-white">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          v-for="(winner, index) in winners.slice(0, 3)" 
          :key="winner.userId"
          class="relative bg-white rounded-lg p-4 shadow-sm border-2 transition-all hover:shadow-md"
          :class="getMedalBorderClass(index)"
        >
          <!-- Medal Badge -->
          <div class="absolute -top-3 left-4">
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-md"
              :class="getMedalClass(index)"
            >
              {{ getMedalEmoji(index) }}
            </div>
          </div>

          <!-- Content -->
          <div class="mt-2 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {{ getPositionLabel(index) }}
              </span>
              <span class="text-xs text-gray-400">#{{ index + 1 }}</span>
            </div>
            
            <div class="font-mono text-sm text-gray-700 truncate" :title="winner.userId">
              {{ truncateAddress(winner.userId, 6, 6) }}
            </div>
            
            <div class="pt-2 border-t border-gray-100">
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-primary">{{ formatAmount(winner.prize) }}</span>
                <span class="text-sm text-gray-500 font-medium">USDL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { truncateAddress, formatAmount } from '@/utils/formatters'

interface Winner {
  userId: string
  prize: string
}

interface Props {
  winners: Winner[]
}

defineProps<Props>()

function getMedalEmoji(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  return medals[index] || '🏅'
}

function getMedalClass(index: number): string {
  const classes = [
    'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900',
    'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700',
    'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900'
  ]
  return classes[index] || 'bg-gray-200 text-gray-600'
}

function getMedalBorderClass(index: number): string {
  const classes = [
    'border-yellow-400 hover:border-yellow-500',
    'border-gray-300 hover:border-gray-400',
    'border-orange-400 hover:border-orange-500'
  ]
  return classes[index] || 'border-gray-200'
}

function getPositionLabel(index: number): string {
  const labels = ['Champion', 'Runner-up', 'Third Place']
  return labels[index] || `${index + 1}th Place`
}
</script>
