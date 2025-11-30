<template>
  <div class="card p-4 sm:p-6">
    <ul>
      <li v-for="fixture in props.fixtures" :key="fixture.id" class="border-b last:border-b-0 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div class="flex-1">
          <p class="font-semibold flex items-center gap-2 flex-wrap">
            <span 
              class="px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wide"
              :class="getStatusClass(fixture.status)"
            >
              {{ fixture.status }}
            </span>
            <span class="text-sm sm:text-base">{{ fixture.teams.home }} vs {{ fixture.teams.away }}</span>
          </p>
          <p class="text-xs sm:text-sm text-gray-500 mt-1">
            {{ fixture.league }} - {{ formatDate(fixture.startTime) }}
          </p>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <template v-if="fixture.status.toLowerCase() === 'scheduled'">
            <button 
              class="btn-odds btn-odds-primary flex-1 sm:flex-none"
              @click="openBetModal(fixture, 'Home', fixture.odds.home)"
            >
              {{ formatOdds(fixture.odds.home) }}
            </button>
            <button 
              class="btn-odds btn-odds-primary flex-1 sm:flex-none"
              @click="openBetModal(fixture, 'Tie', fixture.odds.tie)"
            >
              {{ formatOdds(fixture.odds.tie) }}
            </button>
            <button 
              class="btn-odds btn-odds-primary flex-1 sm:flex-none"
              @click="openBetModal(fixture, 'Away', fixture.odds.away)"
            >
              {{ formatOdds(fixture.odds.away) }}
            </button>
          </template>
          <div 
            v-else-if="fixture.status.toLowerCase() === 'finished'"
            class="flex items-center justify-center w-full font-bold text-lg sm:text-xl text-secondary bg-gray-50 rounded-lg py-2"
          >
            {{ fixture.result.homeScore }} - {{ fixture.result.awayScore }}
          </div>
          <button 
            v-else-if="!['postponed', 'cancelled'].includes(fixture.status.toLowerCase())"
            class="px-3 sm:px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary-dark transition-colors w-full"
          >
            View Live Event
          </button>
        </div>
      </li>
    </ul>

    <BetModal
      ref="betModalRef"
      :is-open="isModalOpen"
      :event="selectedEvent"
      :selection="selectedSelection"
      :wallet-balance="walletBalance"
      @close="isModalOpen = false"
      @confirm-bet="handlePlaceBet"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { useApp } from '@/composables/useApp';
import BetModal from './BetModal.vue';

const props = withDefaults(defineProps<{
  fixtures: Array<{
    id: number;
    teams: { home: string; away: string };
    league: string;
    date?: string;
    startTime: number | string;
    odds: { home: string; tie: string; away: string },
    status: string;
    result: { winner: string; awayScore: number; homeScore: number };
  }>;
  showHeader?: boolean;
}>(), {
  showHeader: true
});

const { walletBalance, placeBet } = useApp();

const isModalOpen = ref(false);
const selectedEvent = ref<any>(null);
const selectedSelection = ref<{ type: string; odd: number | string }>({ type: '', odd: 0 });
const betModalRef = ref<InstanceType<typeof BetModal> | null>(null);

const openBetModal = (event: any, type: string, odd: number | string) => {
  selectedEvent.value = event;
  selectedSelection.value = { type, odd };
  isModalOpen.value = true;
};

const handlePlaceBet = async (amount: number) => {
  if (!selectedEvent.value) return;

  try {
    await placeBet(
      selectedEvent.value.id.toString(),
      selectedSelection.value.type,
      amount.toString(),
      selectedEvent.value
    );
    isModalOpen.value = false;
  } catch (error) {
    console.error('Failed to place bet:', error);
    alert('Failed to place bet. Please try again.');
    // Reset loading state in modal
    if (betModalRef.value) {
      (betModalRef.value as any).loading = false;
    }
  }
};

const getStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'live':
      return 'bg-red-500 text-white border border-red-600';
    case 'finished':
      return 'bg-green-500 text-white border border-green-600';
    case 'postponed':
      return 'bg-yellow-500 text-white border border-yellow-600';
    case 'cancelled':
      return 'bg-gray-500 text-white border border-gray-600';
    case 'scheduled':
    default:
      return 'bg-blue-500 text-white border border-blue-600';
  }
};

const formatDate = (ts?: number | string) => {
  if (ts == null) return '';
  const n = typeof ts === 'string' ? Number(ts) : ts;
  if (!Number.isFinite(n)) return String(ts);
  const ms = n > 1e12 ? n : n * 1000; // si viene en segundos, conviértelo a ms
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ms));
};

const formatOdds = (v: number | string) => {
  return (Number(v) / 100).toFixed(2);
}
</script>