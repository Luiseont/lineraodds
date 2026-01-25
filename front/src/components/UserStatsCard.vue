<template>
  <div class="bg-white rounded-brand shadow-card p-4 sm:p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="text-center sm:text-left">
        <h3 class="text-lg font-bold text-secondary mb-1">Your Stats</h3>
        <p class="text-sm text-gray-500">Current week performance</p>
      </div>

      <!-- Rank -->
      <div class="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
        <div>
          <p class="text-sm text-gray-600 mb-1">Your Rank</p>
          <div class="flex items-center gap-2">
            <span class="text-3xl font-bold text-primary">#{{ stats.rank }}</span>
            <span 
              v-if="rankChange !== 0"
              class="flex items-center text-sm font-medium"
              :class="rankChange > 0 ? 'text-success' : 'text-red-500'"
            >
              <svg 
                class="w-4 h-4" 
                :class="rankChange > 0 ? 'rotate-0' : 'rotate-180'"
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
              {{ Math.abs(rankChange) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Address -->
      <div class="p-3 bg-gray-50 rounded-lg">
        <p class="text-xs text-gray-500 mb-1">Your Chain</p>
        <p class="font-mono text-sm text-secondary break-all">{{ truncatedAddress }}</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Total Wagered -->
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-500 mb-1">Total Wagered</p>
          <p class="text-lg font-bold text-secondary">{{ formattedWagered }}</p>
          <p class="text-xs text-gray-400">USDL</p>
        </div>

        <!-- Total Bets -->
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-500 mb-1">Your Bets</p>
          <p class="text-lg font-bold text-secondary">{{ stats.totalBets }}</p>
          <p class="text-xs text-gray-400">placed</p>
        </div>

        <!-- Win Rate -->
        <div class="p-3 bg-gray-50 rounded-lg col-span-2">
          <p class="text-xs text-gray-500 mb-1">Win Rate</p>
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                class="bg-success rounded-full h-2 transition-all duration-500"
                :style="{ width: `${stats.winRate}%` }"
              ></div>
            </div>
            <span class="text-sm font-bold text-success">{{ formattedWinRate }}</span>
          </div>
        </div>
      </div>

      <!-- Time Remaining -->
      <div class="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-100 text-center shadow-sm">
        <p class="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Time Remaining
        </p>
        <p class="text-3xl font-black text-secondary tracking-tight mb-1">{{ timeRemainingText }}</p>
        <p class="text-xs text-gray-500 font-medium">Until week ends</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserLeaderboardStats } from '@/types/leaderboard'
import { truncateAddress, formatAmount, formatPercentage, formatTimeRemaining } from '@/utils/formatters'

interface Props {
  stats: UserLeaderboardStats
  userAddress: string
  timeRemaining: number
  rankChange?: number
}

const props = withDefaults(defineProps<Props>(), {
  rankChange: 0
})

const truncatedAddress = computed(() => truncateAddress(props.userAddress))
const formattedWagered = computed(() => formatAmount(props.stats.totalWagered))
const formattedWinRate = computed(() => formatPercentage(props.stats.winRate))
const timeRemainingText = computed(() => formatTimeRemaining(props.timeRemaining))
</script>
