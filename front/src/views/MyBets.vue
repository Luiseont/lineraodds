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
            <div class="text-lg sm:text-xl font-semibold text-secondary">{{ formatCurrency(totalStake) }}</div>
          </div>
          <div class="sm:mt-2">
            <div class="text-xs sm:text-sm text-gray-500">Potential winnings</div>
            <div class="text-lg sm:text-xl font-semibold text-primary">{{ formatCurrency(totalPotential) }}</div>
          </div>
        </div>
      </div>
    </header>

    <div class="card overflow-hidden">
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div class="flex items-center gap-2">
          <span class="badge border-primary text-primary bg-primary-soft text-xs sm:text-sm">Active Bets: {{ activeBetsCount }}</span>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
          <label class="text-xs sm:text-sm text-gray-600">Sort by</label>
          <select v-model="sortBy" class="border rounded px-2 py-1 text-xs sm:text-sm">
            <option value="date">Date</option>
            <option value="league">League</option>
            <option value="stake">Stake</option>
            <option value="potential">Potential</option>
          </select>
          <button @click="toggleDir" class="text-xs sm:text-sm px-2 py-1 border rounded">{{ sortDir.toUpperCase() }}</button>
          <div class="text-xs sm:text-sm text-gray-500">{{ userBets.length }} bets</div>
        </div>
      </div>
      
      <div v-if="userBets.length === 0" class="p-8 text-center text-gray-500">
        No bets placed yet.
      </div>

      <ul v-else class="divide-y">
        <li v-for="b in sorted" :key="b.eventId + b.placedAt" class="px-4 sm:px-6 py-4 flex flex-col gap-3">
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
            <div class="mt-2 font-semibold text-secondary text-sm sm:text-base">{{ b.teams.home }} vs {{ b.teams.away }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApp } from '@/composables/useApp'
import { useEvents } from '@/composables/useEvents'

const { userBets, claimReward } = useApp()
const { events } = useEvents()
const loadingClaims = ref<Record<string, boolean>>({})

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
  
  // Find corresponding event
  const event = events.value.find((e: any) => e.id === bet.eventId)
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

const totalStake = computed(() => {
  return userBets.value.reduce((sum: number, b: any) => {
    if (b.status === 'PLACED') {
      return sum + Number(b.bid)
    }
    return sum
  }, 0)
})

const totalPotential = computed(() => {
  return userBets.value.reduce((sum: number, b: any) => {
    if (b.status === 'PLACED') {
      return sum + calculatePotential(b.bid, b.odd)
    }
    return sum
  }, 0)
})

const activeBetsCount = computed(() => {
  return userBets.value.filter((b: any) => b.status === 'PLACED').length
})

type SortKey = 'date' | 'league' | 'stake' | 'potential'
const sortBy = ref<SortKey>('date')
const sortDir = ref<'asc'|'desc'>('desc')

const sorted = computed(() => {
  const data = [...userBets.value]
  data.sort((a: any, b: any) => {
    let va: number|string = ''
    let vb: number|string = ''
    
    if (sortBy.value === 'date') { va = a.startTime; vb = b.startTime }
    else if (sortBy.value === 'league') { va = a.league; vb = b.league }
    else if (sortBy.value === 'stake') { va = Number(a.bid); vb = Number(b.bid) }
    else { va = calculatePotential(a.bid, a.odd); vb = calculatePotential(b.bid, b.odd) }
    
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    } else {
      return sortDir.value === 'asc' ? (Number(va) - Number(vb)) : (Number(vb) - Number(va))
    }
  })
  return data
})

function toggleDir(){ sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc' }
</script>
