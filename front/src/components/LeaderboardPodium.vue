<template>
  <!-- Desktop: Vertical Cards -->
  <div class="hidden md:grid md:grid-cols-3 gap-4 mb-6">
    <div
      v-for="(ranking, index) in topThree"
      :key="ranking.rank"
      class="relative overflow-hidden rounded-xl shadow-lg transition-transform hover:scale-[1.02] duration-300"
      :class="getPodiumClass(index)"
    >
      <div class="relative p-5 text-center">
        <!-- Medal with Ribbon on Top -->
        <div class="relative inline-block mb-3">
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-7 h-10 bg-gradient-to-b from-red-500 via-blue-500 to-red-500 rounded-b-sm"></div>
          <div 
            class="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
            :class="getMedalClass(index)"
          >
            {{ index + 1 }}
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!ranking.userId" class="py-6">
          <svg class="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p class="text-sm opacity-40 font-medium">No player yet</p>
        </div>

        <!-- User Data -->
        <template v-else>
          <!-- Address -->
          <p class="font-mono text-sm mb-3 opacity-90 font-semibold">
            {{ truncateAddress(ranking.userId, 5, 5) }}
          </p>

          <!-- Total Wagered -->
          <div class="mb-3">
            <p class="text-xs opacity-60 mb-1">Total Wagered:</p>
            <p class="text-2xl font-bold leading-tight">{{ formatAmount(ranking.totalWagered) }}</p>
            <p class="text-xs opacity-70">USDL</p>
          </div>

          <!-- Bets and Win Rate - Horizontal Layout -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs opacity-60 mb-1">Bets:</p>
              <p class="font-bold">{{ ranking.totalBets }}</p>
            </div>
            <div>
              <p class="text-xs opacity-60 mb-1">Win Rate</p>
              <p class="font-bold">{{ formatPercentage(ranking.winRate) }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Mobile: Horizontal Compact Cards with Medals on Top -->
  <div v-if="topThree.length > 0" class="md:hidden mb-6">
    <!-- Podium Display -->
    <div class="flex items-end justify-center gap-2 mb-4">
      <!-- 2nd Place (Left) -->
      <div
        v-if="topThree[1]"
        class="flex-1 max-w-[110px] rounded-lg shadow-md overflow-hidden"
        :class="getPodiumClass(1)"
      >
        <div class="p-3 text-center">
          <!-- Medal with Ribbon -->
          <div class="relative inline-block mb-2">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-8 bg-gradient-to-b from-red-500 via-blue-500 to-red-500 rounded-b-sm"></div>
            <div class="relative w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-md" :class="getMedalClass(1)">
              2
            </div>
          </div>
          
          <template v-if="topThree[1].userId">
            <p class="font-mono text-xs mb-2 opacity-90 font-semibold truncate">{{ truncateAddress(topThree[1].userId, 4, 4) }}</p>
            <p class="text-lg font-bold leading-tight">{{ formatAmount(topThree[1]?.totalWagered || '0') }}</p>
            <p class="text-xs opacity-70 mb-1">USDL</p>
            <p class="text-xs opacity-60">📊 {{ topThree[1]?.totalBets || 0 }} bets</p>
          </template>
          <div v-else class="py-2">
            <svg class="w-8 h-8 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p class="text-xs opacity-30 mt-1">Empty</p>
          </div>
        </div>
      </div>

      <!-- 1st Place (Center - Taller) -->
      <div
        v-if="topThree[0]"
        class="flex-1 max-w-[120px] rounded-lg shadow-lg overflow-hidden"
        :class="getPodiumClass(0)"
      >
        <div class="p-4 text-center">
          <!-- Crown Icon -->
          <div class="text-3xl mb-1">👑</div>
          <!-- Medal with Ribbon -->
          <div class="relative inline-block mb-2">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-9 bg-gradient-to-b from-red-500 via-blue-500 to-red-500 rounded-b-sm"></div>
            <div class="relative w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" :class="getMedalClass(0)">
              1
            </div>
          </div>
          
          <template v-if="topThree[0].userId">
            <p class="font-mono text-xs mb-2 opacity-90 font-semibold truncate">{{ truncateAddress(topThree[0].userId, 4, 4) }}</p>
            <p class="text-xl font-bold leading-tight">{{ formatAmount(topThree[0]?.totalWagered || '0') }}</p>
            <p class="text-xs opacity-70 mb-1">USDL</p>
            <p class="text-xs opacity-60">📊 {{ topThree[0]?.totalBets || 0 }} bets</p>
          </template>
          <div v-else class="py-2">
            <svg class="w-10 h-10 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p class="text-xs opacity-30 mt-1">Empty</p>
          </div>
        </div>
      </div>

      <!-- 3rd Place (Right) -->
      <div
        v-if="topThree[2]"
        class="flex-1 max-w-[110px] rounded-lg shadow-md overflow-hidden"
        :class="getPodiumClass(2)"
      >
        <div class="p-3 text-center">
          <!-- Medal with Ribbon -->
          <div class="relative inline-block mb-2">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-8 bg-gradient-to-b from-red-500 via-blue-500 to-red-500 rounded-b-sm"></div>
            <div class="relative w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-md" :class="getMedalClass(2)">
              3
            </div>
          </div>
          
          <template v-if="topThree[2].userId">
            <p class="font-mono text-xs mb-2 opacity-90 font-semibold truncate">{{ truncateAddress(topThree[2].userId, 4, 4) }}</p>
            <p class="text-lg font-bold leading-tight">{{ formatAmount(topThree[2]?.totalWagered || '0') }}</p>
            <p class="text-xs opacity-70 mb-1">USDL</p>
            <p class="text-xs opacity-60">📊 {{ topThree[2]?.totalBets || 0 }} bets</p>
          </template>
          <div v-else class="py-2">
            <svg class="w-8 h-8 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p class="text-xs opacity-30 mt-1">Empty</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LeaderboardRanking } from '@/types/leaderboard'
import { truncateAddress, formatAmount, formatPercentage } from '@/utils/formatters'

interface Props {
  topThree: LeaderboardRanking[]
}

defineProps<Props>()

function getPodiumClass(index: number): string {
  const classes = [
    'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900',
    'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-gray-800',
    'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 text-orange-900'
  ]
  return classes[index] || 'bg-gray-200 text-gray-700'
}

function getMedalClass(index: number): string {
  const classes = [
    'bg-gradient-to-br from-yellow-200 to-yellow-400 text-yellow-900 border-4 border-yellow-500',
    'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 border-4 border-gray-500',
    'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-900 border-4 border-orange-500'
  ]
  return classes[index] || 'bg-gray-300 text-gray-700 border-4 border-gray-400'
}

function getBorderClass(index: number): string {
  const classes = [
    'border-yellow-400',
    'border-gray-400',
    'border-orange-400'
  ]
  return classes[index] || 'border-gray-300'
}
</script>
