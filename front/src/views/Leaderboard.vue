<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="card p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <!-- Trophy Icon -->
          <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-secondary">
              Leaderboard
            </h1>
            <p class="text-sm text-gray-600">Weekly Top Bettors - Compete for Rewards!</p>
          </div>
        </div>
        
        <div class="flex flex-col sm:items-end gap-1">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Week of</span>
            <span class="font-semibold text-secondary">{{ weekPeriod }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Total Prize Pool:</span>
            <span class="text-xl font-bold text-primary">{{ formattedPrizePool }} USDL</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Previous Week Winners -->
    <PreviousWinnersBanner :winners="winners" />

    <!-- Main Content -->
    <div v-if="isLoading" class="card p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading leaderboard...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card p-12 text-center">
      <div class="text-red-500 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-gray-600">{{ error }}</p>
      <button 
        @click="fetchLeaderboard()"
        class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Leaderboard Section (Left - 2 columns) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Top 3 Podium -->
          <div>
            <h2 class="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
              <span class="inline-block w-1 h-5 bg-primary rounded-sm"></span>
              Top 3 Champions
            </h2>
            <LeaderboardPodium :top-three="topThree" />
          </div>

          <!-- Rest of Rankings -->
          <div v-if="restOfRankings.length > 0">
            <h2 class="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
              <span class="inline-block w-1 h-5 bg-primary rounded-sm"></span>
              Rankings 4-10
            </h2>
            <LeaderboardTable :rankings="restOfRankings" />
          </div>
        </div>

        <!-- User Stats Sidebar (Right - 1 column) -->
        <div class="lg:col-span-1">
          <div class="sticky top-4">
            <UserStatsCard
              v-if="userRanking && chainId"
              :stats="userRanking"
              :user-address="chainId"
              :time-remaining="timeRemaining"
              :rank-change="0"
            />
            
            <!-- Not Connected State -->
            <div v-else-if="!chainId" class="card p-6 text-center">
              <div class="text-gray-400 mb-4">
                <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p class="text-gray-600 mb-4">Connect your wallet to see your stats</p>
              <WalletGuard />
            </div>

            <!-- Connected but Unranked State -->
            <div v-else class="card p-6 text-center">
              <div class="text-gray-400 mb-4">
                <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <span class="text-2xl">👋</span>
                </div>
              </div>
              <h3 class="font-bold text-secondary mb-1">Welcome!</h3>
              <p class="font-mono text-xs text-secondary/60 mb-4 bg-gray-100 rounded-full px-3 py-1 inline-block">
                {{ truncateAddress(chainId, 6, 6) }}
              </p>
              
              <div class="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p class="text-sm font-semibold text-primary mb-1">No stats yet</p>
                <p class="text-xs text-gray-600">Place your first bet to join the leaderboard!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="card p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-secondary mb-1">How it works</p>
            <p class="text-xs text-gray-600">
              The leaderboard resets every week. Top 10 bettors with the highest wagered amounts win prizes. 
              Prizes are distributed automatically at the end of each week. Keep betting to climb the ranks!
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLeaderboard } from '@/composables/useLeaderboard'
import { useWallet } from '@/composables/useWallet'
import { formatAmount, truncateAddress } from '@/utils/formatters'
import LeaderboardPodium from '@/components/LeaderboardPodium.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import UserStatsCard from '@/components/UserStatsCard.vue'
import WalletGuard from '@/components/WalletGuard.vue'
import PreviousWinnersBanner from '@/components/PreviousWinnersBanner.vue'

const {
  isLoading,
  error,
  topThree,
  restOfRankings,
  userStats,
  period,
  prizePool,
  timeRemaining,
  winners,
  getUserRanking,
  fetchLeaderboard
} = useLeaderboard()

const { address, chainId } = useWallet()

const weekPeriod = computed(() => {
  if (!period.value) return 'Loading...'
  const start = new Date(period.value.startDate)
  const end = new Date(period.value.endDate)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return `${formatDate(start)} - ${formatDate(end)}, ${start.getFullYear()}`
})

const formattedPrizePool = computed(() => formatAmount(prizePool.value))

const userRanking = computed(() => {
  if (!chainId.value) return null
  return getUserRanking(chainId.value)
})

onMounted(() => {
  fetchLeaderboard()
})
</script>
