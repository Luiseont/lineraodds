<template>
  <div class="space-y-4 sm:space-y-6">
    <header class="card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-secondary">My Bets</h1>
        <p class="text-sm text-gray-500">Summary of your active bets</p>
      </div>
      <div class="text-left sm:text-right w-full sm:w-auto">
        <div class="flex items-center justify-between sm:block">
          <div>
            <div class="text-xs sm:text-sm text-gray-500">Total staked</div>
            <div class="text-lg sm:text-xl font-semibold text-secondary">{{ formatCurrency(totalStaked) }}</div>
          </div>
          <div class="sm:mt-2">
            <div class="text-xs sm:text-sm text-gray-500">Potential winnings</div>
            <div class="text-lg sm:text-xl font-semibold text-primary">{{ formatCurrency(potentialWinnings) }}</div>
          </div>
        </div>
      </div>
    </header>

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
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="card p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading bets...</p>
    </div>

    <!-- Bets List -->
    <template v-else>
      <div class="card overflow-hidden">
        <div v-if="userBets.length === 0" class="p-8 text-center text-gray-500">
          No bets placed yet.
        </div>

        <ul v-else class="divide-y">
          <li v-for="b in userBets" :key="b.eventId + b.placedAt" class="px-4 sm:px-6 py-4 flex flex-col gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="badge border-secondary text-secondary text-xs">{{ b.league }}</span>
                
                <span v-if="b.status === 'PLACED'" class="px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide bg-blue-500 text-white border border-blue-600">Placed</span>
                <span v-else-if="b.status === 'WON'" class="px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide bg-green-500 text-white border border-green-600">Won</span>
                <span v-else-if="b.status === 'LOST'" class="px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide bg-red-500 text-white border border-red-600">Lost</span>
                <span v-else-if="b.status === 'CANCELLED'" class="px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide bg-gray-500 text-white border border-gray-600">Cancelled</span>
                <span v-else class="px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide bg-gray-400 text-white border border-gray-500">{{ b.status }}</span>
                
                <span class="text-gray-500 text-xs sm:text-sm">{{ formatDate(b.startTime) }}</span>
              </div>
              <div class="mt-2 font-semibold text-secondary text-sm sm:text-base">{{ b.teams.home.name }} vs {{ b.teams.away.name }}</div>
              <div class="text-xs sm:text-sm text-gray-500">Selection: <span class="font-medium text-secondary">{{ b.selection }}</span> @ <span class="font-medium text-secondary">{{ formatOdds(b.odd) }}</span></div>
              
              <!-- Claim Button -->
              <button 
                v-if="isClaimable(b)"
                @click="handleClaim(b)"
                :disabled="loadingClaims[b.eventId]"
                class="mt-2 px-3 py-1.5 bg-green-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-600 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg v-if="loadingClaims[b.eventId]" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ loadingClaims[b.eventId] ? 'Claiming...' : 'Claim Reward' }}
              </button>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-4 pt-2 border-t sm:border-t-0">
              <div class="text-left sm:text-right">
                <div class="text-xs text-gray-500">Stake</div>
                <div class="font-semibold text-secondary text-sm sm:text-base">{{ formatCurrency(b.bid) }} USDL</div>
              </div>
              <div class="text-right">
                <div class="text-xs font-semibold" :class="b.status === 'WON' ? 'text-green-600' : 'text-gray-500'">
                  {{ b.status === 'WON' ? 'Winnings' : 'Potential' }}
                </div>
                <div class="font-semibold text-primary text-sm sm:text-base">{{ formatCurrency(calculatePotential(b.bid, b.odd)) }} USDL</div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="userBets.length > 0"
        :current-page="currentBetsPage"
        :has-more="userBets.length === 10"
        @next="nextBetsPage"
        @previous="previousBetsPage"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useApp } from '@/composables/useApp'
import { useBets } from '@/composables/useBets'
import { useEvents } from '@/composables/useEvents'
import Pagination from '@/components/Pagination.vue'

const { claimReward } = useApp()
const { 
  userBets, 
  currentBetsPage,
  nextBetsPage,
  previousBetsPage,
  setBetFilters,
  totalStaked,
  potentialWinnings,
  resetBets
} = useBets()
const { allEvents } = useEvents()
const loadingClaims = ref<Record<string, boolean>>({})
const isLoading = ref(false)

const statusFilters = ['PLACED', 'WON', 'LOST', 'CANCELLED']
const selectedStatus = ref('PLACED')

function formatCurrency(n: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(n))
}

function formatOdds(v: number | string) {
  return (Number(v) / 100).toFixed(2)
}

function formatDate(ts: number | string) {
  if (!ts) return ''
  const n = typeof ts === 'string' ? Number(ts) : ts
  const ms = n > 1e12 ? n : n * 1000
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(ms))
}

function calculatePotential(bid: number | string, odd: number | string) {
  return Number(bid) * (Number(odd) / 100)
}

function isClaimable(bet: any) {
  if (bet.status !== 'PLACED') return false
  const event = allEvents.value.find((e: any) => e.id === bet.eventId)
  return event && event.status === 'FINISHED'
}

async function handleClaim(bet: any) {
  if (loadingClaims.value[bet.eventId]) return

  loadingClaims.value[bet.eventId] = true
  try {
    await claimReward(bet.eventId)
  } catch (error) {
    console.error('Failed to claim reward:', error)
    alert('Failed to claim reward. Please try again.')
  } finally {
    loadingClaims.value[bet.eventId] = false
  }
}

async function handleStatusFilter(status: string) {
  selectedStatus.value = status
  isLoading.value = true
  await setBetFilters(status)
  isLoading.value = false
}

// Load initial bets
onMounted(async () => {
  isLoading.value = true
  // Force data refresh if backend is ready
  const { isBackendReady } = useApp()
  const { fetchAllBets } = useBets()
  
  if (isBackendReady.value) {
      await fetchAllBets()
  }
  
  await setBetFilters(selectedStatus.value)
  isLoading.value = false
})
</script>
