<template>
  <div class="space-y-6">
    <header class="card p-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-secondary">My Bets</h1>
        <p class="text-gray-500">Summary of your active bets</p>
      </div>
      <div class="text-right">
        <div class="text-sm text-gray-500">Total staked</div>
        <div class="text-xl font-semibold text-secondary">{{ formatCurrency(totalStake) }}</div>
        <div class="text-sm text-gray-500 mt-2">Potential winnings</div>
        <div class="text-xl font-semibold text-primary">{{ formatCurrency(totalPotential) }}</div>
      </div>
    </header>

    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
        <div class="flex items-center gap-2">
          <span class="badge border-primary text-primary bg-primary-soft">Active</span>
          <span class="badge border-info text-info bg-info-soft">Live: {{ liveCount }}</span>
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600">Sort by</label>
          <select v-model="sortBy" class="border rounded px-2 py-1 text-sm">
            <option value="date">Date</option>
            <option value="league">League</option>
            <option value="stake">Stake</option>
            <option value="potential">Potential</option>
          </select>
          <button @click="toggleDir" class="text-sm px-2 py-1 border rounded">{{ sortDir.toUpperCase() }}</button>
          <div class="text-sm text-gray-500">{{ bets.length }} bets</div>
        </div>
      </div>
      <ul class="divide-y">
        <li v-for="b in sorted" :key="b.id" class="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="badge border-secondary text-secondary">{{ b.league }}</span>
              <span v-if="b.live" class="badge border-info text-info bg-info-soft">Live {{ b.minute }}'</span>
              <span v-else-if="b.status==='activa'" class="badge border-primary text-primary bg-primary-soft">Active</span>
              <span v-else-if="b.status==='liquidada'" class="badge border-success text-success bg-success-soft">Settled</span>
              <span v-else class="badge border-warning text-warning bg-warning-soft">Closed</span>
              <span class="text-gray-500 text-sm">{{ b.date }}</span>
            </div>
            <div class="mt-1 font-semibold text-secondary truncate">{{ b.match }}</div>
            <div class="text-sm text-gray-500">Selection: <span class="font-medium text-secondary">{{ b.selection }}</span> @ <span class="font-medium text-secondary">{{ b.odds.toFixed(2) }}</span></div>
          </div>
          <div class="flex items-end sm:items-center gap-4">
            <div class="text-right">
              <div class="text-xs text-gray-500">Stake</div>
              <div class="font-semibold text-secondary">{{ formatCurrency(b.stake) }}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">Potential</div>
              <div class="font-semibold text-primary">{{ formatCurrency(b.stake * b.odds) }}</div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useBetsStore } from '@/stores/bets'

const betsStore = useBetsStore()
const { bets, totalStake, totalPotential, liveCount } = storeToRefs(betsStore)

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
}

type SortKey = 'date' | 'league' | 'stake' | 'potential'
const sortBy = ref<SortKey>('date')
const sortDir = ref<'asc'|'desc'>('asc')
const sorted = computed(() => {
  const data = [...bets.value]
  data.sort((a, b) => {
    let va: number|string = ''
    let vb: number|string = ''
    if (sortBy.value === 'date') { va = a.date; vb = b.date }
    else if (sortBy.value === 'league') { va = a.league; vb = b.league }
    else if (sortBy.value === 'stake') { va = a.stake; vb = b.stake }
    else { va = a.stake * a.odds; vb = b.stake * b.odds }
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    } else {
      return sortDir.value === 'asc' ? (Number(va) - Number(vb)) : (Number(vb) - Number(va))
    }
  })
  return data
})

function toggleDir(){ sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc' }

let timer: number | undefined
onMounted(() => {
  // Primera actualización inmediata
  betsStore.updateLiveStatus()
  // Actualización periódica cada 20s
  timer = window.setInterval(() => betsStore.updateLiveStatus(), 20000)
})
onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })
</script>
