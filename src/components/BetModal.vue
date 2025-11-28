<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="close"></div>

      <!-- Modal Panel -->
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        <!-- Header -->
        <div class="bg-primary px-6 py-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/>
            </svg>
            {{ existingBet ? 'Your Bet' : 'Place Bet' }}
          </h3>
          <button @click="close" class="text-white/80 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Event Info -->
          <div class="mb-6 text-center">
            <p class="text-sm text-gray-500 mb-1">{{ event.league }}</p>
            <h4 class="text-xl font-bold text-secondary mb-2">{{ event.teams.home }} vs {{ event.teams.away }}</h4>
            <p class="text-sm text-gray-400">{{ formatDate(event.startTime) }}</p>
          </div>

          <!-- Existing Bet Display -->
          <div v-if="existingBet" class="space-y-4">
            <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide bg-blue-500 text-white border border-blue-600">
                  {{ existingBet.status }}
                </span>
                <span class="text-sm text-gray-600">You already have a bet on this event</span>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <div class="text-xs text-gray-500">Selection</div>
                  <div class="font-semibold text-secondary">{{ existingBet.selection }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Odds</div>
                  <div class="font-semibold text-secondary">{{ formatOdds(existingBet.odd) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Stake</div>
                  <div class="font-semibold text-secondary">{{ formatCurrency(existingBet.bid) }} USDL</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Potential Win</div>
                  <div class="font-semibold text-primary">{{ formatCurrency(calculatePotential(existingBet.bid, existingBet.odd)) }} USDL</div>
                </div>
              </div>
            </div>

            <button 
              @click="close" 
              class="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>

          <!-- New Bet Form -->
          <div v-else class="space-y-4">
            <!-- Selection Card -->
            <div class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-500">Selection</span>
                <span class="text-sm font-bold text-primary uppercase">{{ selection.type }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-500">Odd</span>
                <span class="text-2xl font-bold text-secondary">{{ formatOdds(selection.odd) }}</span>
              </div>
            </div>

            <!-- Amount Input -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Bet Amount</label>
              <div class="relative">
                <input
                  v-model.number="amount"
                  type="number"
                  min="1"
                  :max="walletBalance"
                  class="w-full px-4 py-3 pr-16 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                  :class="{'border-red-300 focus:ring-red-200': error, 'border-gray-300': !error}"
                  placeholder="0.00"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">USDL</span>
              </div>
              
              <!-- Balance & Error -->
              <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-gray-500">
                  Balance: <span class="font-medium text-gray-700">{{ walletBalance }} USDL</span>
                </span>
                <span v-if="error" class="text-xs text-red-500 font-medium">{{ error }}</span>
              </div>
            </div>

            <!-- Potential Win -->
            <div class="flex justify-between items-center py-3 border-t border-gray-100 mb-6">
              <span class="text-sm font-medium text-gray-500">Potential Return</span>
              <span class="text-lg font-bold text-green-600">{{ potentialWin }} USDL</span>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button
                @click="close"
                class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleSetBet"
                :disabled="!isValid || loading"
                class="flex-1 px-4 py-3 text-white bg-primary rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
              >
                <span v-if="loading">Processing...</span>
                <span v-else>Place Bet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useApp } from '@/composables/useApp'

const props = defineProps<{
  isOpen: boolean
  event: any
  selection: {
    type: string // 'HOME', 'AWAY', 'TIE'
    odd: number | string
  }
  walletBalance: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm-bet', amount: number): void
}>()

const { userBets } = useApp()

const amount = ref<number | null>(null)
const loading = ref(false)

// Check if user already has a bet on this event
const existingBet = computed(() => {
  if (!props.event) return null
  return userBets.value.find((bet: any) => 
    bet.eventId === props.event.id.toString() && 
    (bet.status === 'PLACED' || bet.status === 'WON')
  )
})

// Reset amount when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    amount.value = null
    loading.value = false
  }
})

const isValid = computed(() => {
  return amount.value && amount.value > 0 && amount.value <= props.walletBalance
})

const error = computed(() => {
  if (amount.value && amount.value > props.walletBalance) {
    return 'Insufficient balance'
  }
  return ''
})

const potentialWin = computed(() => {
  if (!amount.value) return '0.00'
  const oddValue = Number(props.selection.odd) / 100 
  return (amount.value * oddValue).toFixed(2)
})

function calculatePotential(bid: number | string, odd: number | string) {
  return Number(bid) * (Number(odd) / 100)
}

function formatCurrency(n: number | string) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 2 
  }).format(Number(n))
}

function formatOdds(val: number | string) {
  return (Number(val) / 100).toFixed(2)
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

function close() {
  emit('close')
}

function handleSetBet() {
  if (!isValid.value || !amount.value) return
  
  if (confirm(`Are you sure you want to place a bet of ${amount.value} USDL on ${props.selection.type}?`)) {
    emit('confirm-bet', amount.value)
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
