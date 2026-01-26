<template>
  <div class="space-y-4">
    <div v-if="fixtures.length > 0" class="grid gap-3">
      <div 
        v-for="fixture in props.fixtures" 
        :key="fixture.id" 
        class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all duration-300 relative group"
      >
        <!-- Status Indicator Strip -->
        <div 
          class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-colors"
          :class="getStatusColorClass(fixture.status)"
        ></div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-2 pl-3">
          <!-- Match Info & Teams -->
          <div class="flex-1">
            <!-- League & Date Header -->
            <div class="flex items-center gap-2 mb-1.5 text-xs text-gray-500">
              <img 
                :src="getLeagueLogoUrlByName(fixture.league)"
                :alt="fixture.league"
                class="w-3.5 h-3.5 object-contain opacity-80"
              />
              <span class="font-medium text-gray-400 uppercase tracking-wide text-[10px] sm:text-xs">{{ fixture.league }}</span>
              <span class="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
              <span class="text-[10px] sm:text-xs">{{ formatDate(fixture.startTime) }}</span>
            </div>

            <!-- Teams Row -->
            <div class="flex items-center gap-4">
              <!-- Home -->
              <div class="flex items-center gap-2 flex-1 justify-end">
                <span class="font-bold text-gray-900 text-right text-sm sm:text-base leading-tight">{{ fixture.teams.home.name }}</span>
                <img 
                  :src="getTeamLogoUrl(fixture.teams.home.name)"
                  :alt="fixture.teams.home.name"
                  class="w-6 h-6 sm:w-8 sm:h-8 object-contain drop-shadow-sm"
                />
              </div>

              <!-- VS / Score -->
              <div class="w-12 text-center flex-shrink-0">
                <div v-if="['live', 'finished'].includes(fixture.status.toLowerCase())" class="font-black text-lg sm:text-xl text-secondary tracking-tight">
                  {{ formatScore(fixture.liveScore?.home || fixture.result.homeScore) }}
                  <span class="text-gray-300 mx-px">-</span>
                  {{ formatScore(fixture.liveScore?.away || fixture.result.awayScore) }}
                </div>
                <div v-else class="text-[10px] font-bold text-gray-300 bg-gray-50 py-0.5 px-1.5 rounded inline-block">
                  VS
                </div>
                <div v-if="fixture.status.toLowerCase() === 'live'" class="mt-0.5 text-[9px] font-bold text-green-600 animate-pulse">
                  {{ fixture.currentMinute }}'
                </div>
              </div>

              <!-- Away -->
              <div class="flex items-center gap-2 flex-1 justify-start">
                <img 
                  :src="getTeamLogoUrl(fixture.teams.away.name)"
                  :alt="fixture.teams.away.name"
                  class="w-6 h-6 sm:w-8 sm:h-8 object-contain drop-shadow-sm"
                />
                <span class="font-bold text-gray-900 text-left text-sm sm:text-base leading-tight">{{ fixture.teams.away.name }}</span>
              </div>
            </div>
          </div>

          <!-- Actions Column -->
          <div class="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-l sm:pl-3">
            <template v-if="fixture.status.toLowerCase() === 'scheduled'">
              <div class="grid grid-cols-3 sm:flex gap-1.5 w-full">
                <button 
                  class="btn-odds flex flex-col items-center justify-center py-1.5 px-2 min-w-[60px]"
                  @click="openBetModal(fixture, 'Home', fixture.odds.home)"
                >
                  <span class="text-[9px] text-gray-400 font-medium mb-px">1</span>
                  <span class="text-primary font-bold text-sm">{{ formatOdds(fixture.odds.home) }}</span>
                </button>
                <button 
                  class="btn-odds flex flex-col items-center justify-center py-1.5 px-2 min-w-[60px]"
                  @click="openBetModal(fixture, 'Tie', fixture.odds.tie)"
                >
                  <span class="text-[9px] text-gray-400 font-medium mb-px">X</span>
                  <span class="text-primary font-bold text-sm">{{ formatOdds(fixture.odds.tie) }}</span>
                </button>
                <button 
                  class="btn-odds flex flex-col items-center justify-center py-1.5 px-2 min-w-[60px]"
                  @click="openBetModal(fixture, 'Away', fixture.odds.away)"
                >
                  <span class="text-[9px] text-gray-400 font-medium mb-px">2</span>
                  <span class="text-primary font-bold text-sm">{{ formatOdds(fixture.odds.away) }}</span>
                </button>
              </div>
            </template>
            
            <button 
              v-else
              class="w-full sm:w-auto px-3 py-1.5 bg-gray-50 hover-bg-primary text-gray-600 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 group/btn"
              @click="$router.push(`/event/${fixture.id}`)"
            >
              <span>Details</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <BetModal
      ref="betModalRef"
      :is-open="isModalOpen"
      :event="selectedEvent"
      :selection="selectedSelection"
      :wallet-balance="walletBalance"
      @close="isModalOpen = false"
      @confirm-bet="handlePlaceBet"
    />
    
    <WalletSelectorModal 
      :is-open="showWalletModal" 
      @close="showWalletModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
// ... imports
import { ref } from 'vue';
import { useApp } from '@/composables/useApp';
import { useWallet } from '@/composables/useWallet';
import BetModal from './BetModal.vue';
import WalletSelectorModal from './WalletSelectorModal.vue';
import { getTeamLogoUrl } from '@/utils/teamLogos';
import { getLeagueLogoUrlByName } from '@/utils/leagueLogos';

const props = withDefaults(defineProps<{
  fixtures: Array<{
    id: number;
    teams: { home: { id: string; name: string }; away: { id: string; name: string } };
    league: string;
    date?: string;
    startTime: number | string;
    odds: { home: string; tie: string; away: string },
    status: string;
    result: { winner: string; awayScore: number; homeScore: number };
    liveScore?: { home: string; away: string; updatedAt: string };
    currentMinute?: number;
  }>;
  showHeader?: boolean;
}>(), {
  showHeader: true
});

const { walletBalance, placeBet } = useApp();
const { connected } = useWallet();

const isModalOpen = ref(false);
const showWalletModal = ref(false);
const selectedEvent = ref<any>(null);
const selectedSelection = ref<{ type: string; odd: number | string }>({ type: '', odd: 0 });
const betModalRef = ref<InstanceType<typeof BetModal> | null>(null);

const openBetModal = (event: any, type: string, odd: number | string) => {
  if (!connected.value) {
    showWalletModal.value = true;
    return;
  }
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
  const ms = n > 1e12 ? n : n * 1000;
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ms));
};

const formatOdds = (v: number | string) => {
  return (Number(v) / 100).toFixed(2);
}

const formatScore = (score: any) => {
  if (score === '' || score == null) return 0;
  const numScore = typeof score === 'string' ? Number(score) : score;
  return Number.isFinite(numScore) ? numScore : 0;
};

const getStatusColorClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'live':
      return 'bg-green-500 shadow-[2px_0_8px_rgba(34,197,94,0.3)]'
    case 'finished':
      return 'bg-gray-300'
    case 'postponed':
      return 'bg-yellow-400'
    case 'cancelled':
      return 'bg-red-400'
    case 'scheduled':
    default:
      return 'bg-primary'
  }
}
</script>