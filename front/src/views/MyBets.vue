<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- View Type Tabs (Bets / Predictions) -->
    <div class="card p-3 sm:p-4">
      <div class="flex gap-2 mb-3">
        <button
          @click="viewType = 'bets'"
          class="flex-1 px-4 py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all"
          :class="viewType === 'bets' 
            ? 'bg-primary text-white shadow-md' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          Bets
        </button>
        <button
          @click="viewType = 'predictions'"
          class="flex-1 px-4 py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all"
          :class="viewType === 'predictions' 
            ? 'bg-primary text-white shadow-md' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >
          Predictions
        </button>
      </div>

      <!-- Bets Statistics (only shown in Bets tab) -->
      <div v-if="viewType === 'bets'" class="grid grid-cols-2 gap-4 py-4 mb-4 border-b border-gray-100">
        <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-100">
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Staked</span>
            </div>
            <div class="text-2xl font-bold text-blue-900">{{ formatCurrency(totalStaked) }}</div>
          </div>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
        </div>
        
        <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-4 border border-emerald-100">
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span class="text-xs font-medium text-emerald-600 uppercase tracking-wide">Potential Win</span>
            </div>
            <div class="text-2xl font-bold text-emerald-900">{{ formatCurrency(potentialWinnings) }}</div>
          </div>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-200 rounded-full opacity-20"></div>
        </div>
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex gap-1.5 sm:gap-2 flex-wrap" v-if="viewType === 'bets'">
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

      <!-- Prediction Status Filters -->
      <div class="flex gap-1.5 sm:gap-2 flex-wrap" v-else>
        <button
          v-for="status in predictionStatusFilters"
          :key="status"
          @click="selectedPredictionStatus = status"
          class="px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-base font-medium transition-all relative"
          :class="selectedPredictionStatus === status 
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
      <p class="mt-4 text-gray-600">Loading {{ viewType }}...</p>
    </div>

    <!-- Bets List -->
    <template v-else-if="viewType === 'bets'">
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
                <div class="font-semibold text-secondary text-sm sm:text-base">{{ formatCurrency(b.bid) }}</div>
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

    <!-- Predictions List -->
    <template v-else-if="viewType === 'predictions'">
      <div v-if="filteredPredictions.length === 0" class="card p-8 text-center text-gray-500">
        No predictions found.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <div
          v-for="pred in filteredPredictions"
          :key="pred.id"
          class="card p-3 hover:shadow-lg transition-all relative overflow-hidden"
          :class="{
            'ring-2 ring-yellow-400 bg-yellow-50/40 shadow-xl animate-pulse-slow': pred.resolved && !pred.claimed,
            'opacity-90': pred.resolved && pred.claimed
          }"
        >
          <!-- Resolved Unclaimed Badge - ATTENTION GRABBER -->
          <div v-if="pred.resolved && !pred.claimed" class="absolute top-2 right-2 z-10">
            <div class="px-2 py-0.5 rounded-full text-xs font-bold shadow-lg bg-yellow-500 text-white animate-bounce">
              🎁 CLAIM NOW!
            </div>
          </div>

          <!-- Event Info Header -->
          <div class="mb-2 pb-2 border-b border-gray-100">
            <div class="flex items-center gap-1 mb-1">
              <span class="text-xs text-gray-400">{{ pred.eventInfo?.league || 'Unknown' }}</span>
            </div>
            
            <!-- Teams with Logos -->
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-1 flex-1 min-w-0">
                <img 
                  :src="`https://media.api-sports.io/football/teams/${pred.eventInfo?.teams?.home?.id}.png`" 
                  :alt="pred.eventInfo?.teams?.home?.name"
                  class="w-5 h-5 object-contain flex-shrink-0"
                  @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                />
                <span class="text-xs font-semibold text-gray-700 truncate">
                  {{ pred.eventInfo?.teams?.home?.name || 'Team 1' }}
                </span>
              </div>
              <span class="text-xs text-gray-400 flex-shrink-0">vs</span>
              <div class="flex items-center gap-1 flex-1 min-w-0 justify-end">
                <span class="text-xs font-semibold text-gray-700 truncate">
                  {{ pred.eventInfo?.teams?.away?.name || 'Team 2' }}
                </span>
                <img 
                  :src="`https://media.api-sports.io/football/teams/${pred.eventInfo?.teams?.away?.id}.png`" 
                  :alt="pred.eventInfo?.teams?.away?.name"
                  class="w-5 h-5 object-contain flex-shrink-0"
                  @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                />
              </div>
            </div>
            
            <div class="text-xs text-gray-400">
              <!--{{ new Date(pred.eventInfo?.startTime).toLocaleDateString() }}-->
            </div>
          </div>

          <!-- Prediction Question -->
          <div class="mb-2">
            <div class="text-xs text-gray-500 mb-1">Prediction</div>
            <div class="text-xs font-medium text-gray-800 line-clamp-2 min-h-[2rem]">
              {{ pred.question }}
            </div>
          </div>

          <!-- User Choice -->
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs text-gray-500">Your Choice</span>
            <span 
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="pred.choice ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ pred.choice ? 'YES' : 'NO' }}
            </span>
          </div>

          <!-- Wagered Amount -->
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs text-gray-500">Wagered</span>
            <span class="text-xs font-bold text-secondary">{{ formatCurrency(Number(pred.amount)) }}</span>
          </div>

          <!-- Potential/Actual Winnings -->
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-gray-500">{{ pred.claimed ? 'Result' : 'Potential' }}</span>
            <span 
              class="text-xs font-bold"
              :class="pred.claimed 
                ? (pred.isWinner ? 'text-green-600' : 'text-red-600') 
                : 'text-primary'"
            >
              {{ pred.claimed 
                ? (pred.isWinner ? '+' + formatCurrency(pred.potentialWinnings - (Number(pred.amount))) : formatCurrency(-(Number(pred.amount))))
                : formatCurrency(pred.potentialWinnings) 
              }}
            </span>
          </div>

          <!-- Status and Actions -->
          <div class="pt-2 border-t border-gray-100">
            <!-- Resolved - Not Claimed (Show only Claim Button) -->
            <div v-if="pred.resolved && !pred.claimed">
              <button
                @click="handleClaimPrediction(pred)"
                :disabled="loadingPredictionClaims[pred.id]"
                class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-1.5 rounded text-xs font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loadingPredictionClaims[pred.id] ? '⏳ Claiming...' : '🎁 Claim' }}
              </button>
            </div>

            <!-- Resolved - Already Claimed -->
            <div v-else-if="pred.resolved && pred.claimed">
              <!-- Winner Claimed -->
              <div v-if="pred.isWinner" class="p-2 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-400 rounded">
                <div class="flex items-center justify-center gap-1 mb-1">
                  <span class="text-sm">🎉</span>
                  <span class="text-xs font-bold text-green-800">YOU WON!</span>
                </div>
                <div class="text-center text-xs text-green-700 mb-1">
                  {{ pred.outcome ? 'YES' : 'NO' }}
                </div>
                <div class="text-center pb-1 border-b border-green-300">
                  <div class="text-xs font-bold text-green-700">
                    +{{ formatCurrency(pred.potentialWinnings - (Number(pred.amount))) }}
                  </div>
                </div>
                <div class="text-center text-xs text-green-600 mt-1">
                  ✓ Claimed
                </div>
              </div>
              <!-- Loser Claimed -->
              <div v-else class="p-2 bg-gradient-to-br from-red-100 to-rose-100 border border-red-400 rounded">
                <div class="flex items-center justify-center gap-1 mb-1">
                  <span class="text-sm">😔</span>
                  <span class="text-xs font-bold text-red-800">YOU LOST</span>
                </div>
                <div class="text-center text-xs text-red-700 mb-1">
                  {{ pred.outcome ? 'YES' : 'NO' }}
                </div>
                <div class="text-center pb-1 border-b border-red-300">
                  <div class="text-xs font-bold text-red-700">
                    {{ formatCurrency(-(Number(pred.amount))) }}
                  </div>
                </div>
                <div class="text-center text-xs text-red-600 mt-1">
                  ✓ Claimed
                </div>
              </div>
            </div>

            <!-- Active (Not Resolved) -->
            <div v-else class="p-2 bg-blue-50 border border-blue-200 rounded">
              <div class="flex items-center justify-center gap-1">
                <div class="animate-pulse w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span class="text-xs font-semibold text-blue-700">ACTIVE</span>
              </div>
              <div class="text-center text-xs text-blue-600 mt-0.5">
                Waiting...
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useApp } from '@/composables/useApp'
import { useBets } from '@/composables/useBets'
import { useEvents } from '@/composables/useEvents'
import Pagination from '@/components/Pagination.vue'

const { claimReward, claimPredictionReward } = useApp()
const { 
  userBets, 
  allUserPredictions,
  currentBetsPage,
  nextBetsPage,
  previousBetsPage,
  setBetFilters,
  totalStaked,
  potentialWinnings,
  resetBets,
  fetchAllBets,
  fetchUserPredictions
} = useBets()
const { allEvents } = useEvents()
const loadingClaims = ref<Record<string, boolean>>({})
const loadingPredictionClaims = ref<Record<number, boolean>>({})
const isLoading = ref(false)

// View type state
const viewType = ref<'bets' | 'predictions'>('bets')

// Bets filters
const statusFilters = ['PLACED', 'WON', 'LOST', 'CANCELLED']
const selectedStatus = ref('PLACED')

// Predictions filters
const predictionStatusFilters = ['ALL', 'ACTIVE', 'RESOLVED', 'CLAIMABLE']
const selectedPredictionStatus = ref('ALL')



function formatCurrency(n: number | string) {
  const val = Number(n);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val)
}

function formatRawAmount(n: number | string) {
    // Handle string values that may have decimals
    let strValue = String(n);
    // Remove decimal point and everything after it
    const dotIndex = strValue.indexOf('.');
    if (dotIndex !== -1) {
        strValue = strValue.substring(0, dotIndex);
    }
    // Convert to BigInt (now guaranteed to be integer string)
    const val = BigInt(strValue || '0');
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(val) / 1e18)
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
  const bidValue = Number(bid);
  const oddMult = Number(odd) / 100;
  return bidValue * oddMult;
}

// Computed property for filtered predictions
const filteredPredictions = computed(() => {
  console.log("Raw allUserPredictions:", allUserPredictions.value)
  console.log("All events:", allEvents.value)
  
  if (!allUserPredictions.value || allUserPredictions.value.length === 0) return []

  // Enrich predictions with event data
  const enrichedPredictions = allUserPredictions.value.map((pred: any) => {
    const event = allEvents.value.find((e: any) => e.id === pred.eventId)
    const prediction = event?.predictions?.find((p: any) => p.id === pred.id)

    console.log(`Prediction ${pred.id}:`, { pred, event, prediction })

    // Determine if user won
    let isWinner = false
    if (prediction && prediction.resolved && prediction.outcome !== null) {
      isWinner = (pred.choice && prediction.outcome) || (!pred.choice && !prediction.outcome)
    }

    // Calculate potential winnings
    let potentialWinnings = 0
    if (prediction) {
      const userAmount = Number(pred.amount) 
      const yesPool = Number(prediction.yesPool || 0) 
      const noPool = Number(prediction.noPool || 0)
      const totalPool = yesPool + noPool

      if (totalPool > 0) {
        if (pred.choice) {
          // User bet YES - potential winnings is their share of total pool
          potentialWinnings = yesPool > 0 ? (userAmount / yesPool) * totalPool : userAmount
        } else {
          // User bet NO - potential winnings is their share of total pool
          potentialWinnings = noPool > 0 ? (userAmount / noPool) * totalPool : userAmount
        }
      } else {
        potentialWinnings = userAmount
      }
    }

    return {
      ...pred,
      eventInfo: event,
      question: prediction?.question || 'Unknown prediction',
      resolved: prediction?.resolved || false,
      outcome: prediction?.outcome,
      potentialWinnings,
      isWinner
    }
  })

  console.log("Enriched predictions:", enrichedPredictions)

  // Apply filters
  if (selectedPredictionStatus.value === 'ACTIVE') {
    return enrichedPredictions.filter((p: any) => !p.resolved)
  } else if (selectedPredictionStatus.value === 'RESOLVED') {
    return enrichedPredictions.filter((p: any) => p.resolved)
  } else if (selectedPredictionStatus.value === 'CLAIMABLE') {
    return enrichedPredictions.filter((p: any) => p.resolved && !p.claimed && p.isWinner)
  }

  return enrichedPredictions
})

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

async function handleClaimPrediction(pred: any) {
  if (loadingPredictionClaims.value[pred.id]) return

  loadingPredictionClaims.value[pred.id] = true
  try {
    await claimPredictionReward(pred.eventId, pred.id)
    // Refresh predictions after claim
    await fetchUserPredictions()
  } catch (error) {
    console.error('Failed to claim prediction reward:', error)
    alert('Failed to claim prediction reward. Please try again.')
  } finally {
    loadingPredictionClaims.value[pred.id] = false
  }
}

async function handleStatusFilter(status: string) {
  selectedStatus.value = status
  isLoading.value = true
  await setBetFilters(status)
  isLoading.value = false
}

// Load initial data
onMounted(async () => {
  isLoading.value = true
  // Force data refresh if backend is ready
  const { isBackendReady } = useApp()
  
  if (isBackendReady.value) {
      await fetchAllBets()
      await fetchUserPredictions()
  }
  
  await setBetFilters(selectedStatus.value)
  isLoading.value = false
})
</script>
