<template>
  <div class="bg-white rounded-brand shadow-card overflow-hidden">
    <!-- Table Header -->
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div class="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <div class="col-span-1 whitespace-nowrap">#</div>
        <div class="col-span-5 sm:col-span-4 whitespace-nowrap">Address</div>
        <div class="col-span-3 sm:col-span-3 text-right whitespace-nowrap">Wagered</div>
        <div class="col-span-2 hidden sm:block text-center whitespace-nowrap">Bets</div>
        <div class="col-span-3 sm:col-span-2 text-right whitespace-nowrap">Win Rate</div>
      </div>
    </div>

    <!-- Table Body -->
    <div class="divide-y divide-gray-100">
      <div
        v-for="ranking in rankings"
        :key="ranking.rank"
        class="px-4 py-4 transition-colors duration-150"
        :class="ranking.userId ? 'hover:bg-gray-50' : 'bg-gray-50/50'"
      >
        <div class="grid grid-cols-12 gap-2 items-center">
          <!-- Rank -->
          <div class="col-span-1">
            <span class="text-lg font-bold text-secondary">{{ ranking.rank }}</span>
          </div>

          <!-- Empty State -->
          <template v-if="!ranking.userId">
            <div class="col-span-11 flex items-center gap-3 opacity-40">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm italic">No player yet</span>
            </div>
          </template>

          <!-- User Data -->
          <template v-else>
            <!-- Address -->
            <div class="col-span-5 sm:col-span-4">
              <p class="font-mono text-sm text-secondary break-all">
                {{ truncateAddress(ranking.userId, 5, 5) }}
              </p>
            </div>

            <!-- Total Wagered -->
            <div class="col-span-3 sm:col-span-3 text-right">
              <p class="font-bold text-secondary">{{ formatAmount(ranking.totalWagered) }}</p>
              <p class="text-xs text-gray-500">USDL</p>
            </div>

            <!-- Bets (hidden on mobile) -->
            <div class="col-span-2 hidden sm:block text-center">
              <p class="font-semibold text-secondary">{{ ranking.totalBets }}</p>
              <p class="text-xs text-gray-500">bets</p>
            </div>

            <!-- Win Rate -->
            <div class="col-span-3 sm:col-span-2 text-right">
              <div class="inline-flex items-center gap-1 px-2 py-1 bg-success/10 rounded-full">
                <svg class="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm font-bold text-success">{{ formatPercentage(ranking.winRate) }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="rankings.length === 0" class="px-4 py-12 text-center text-gray-500">
      <p>No rankings available yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LeaderboardRanking } from '@/types/leaderboard'
import { truncateAddress, formatAmount, formatPercentage } from '@/utils/formatters'

interface Props {
  rankings: LeaderboardRanking[]
}

defineProps<Props>()
</script>
