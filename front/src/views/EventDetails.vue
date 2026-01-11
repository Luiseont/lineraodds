<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="card p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading event details...</p>
    </div>

    <!-- Event Not Found -->
    <div v-else-if="!event" class="card p-12 text-center">
      <div class="text-gray-400 text-lg mb-4">Event not found</div>
      <button 
        @click="$router.push('/')"
        class="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        Back to Events
      </button>
    </div>

    <!-- Event Details -->
    <template v-else>
      <!-- Back Button -->
      <div class="flex justify-end mb-3">
        <button 
          @click="$router.push('/')"
          class="text-gray-600 hover:text-primary transition-colors flex items-center gap-2 text-base font-semibold cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      <!-- Header and Score Container -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <!-- Header Card -->
        <div class="card p-4 sm:p-6 lg:col-span-1">
          <div class="flex flex-col gap-3 items-center justify-center h-full">
            <div class="flex flex-col items-center gap-3">
              <img 
                :src="getLeagueLogoUrlByName(event.league)"
                :alt="event.league"
                class="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
              <div class="text-center">
                <h1 class="text-lg sm:text-xl font-bold text-secondary">{{ event.league }}</h1>
                <p class="text-xs sm:text-sm text-gray-500">{{ formatDate(event.startTime) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Score Display -->
        <div class="card overflow-hidden lg:col-span-2">
          <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8 lg:p-10 text-white h-full flex flex-col">
            <!-- Match Time (only for live matches) -->
            <div v-if="event.status.toLowerCase() === 'live'" class="flex items-center justify-center gap-2 mb-4">
              <div class="animate-pulse">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8"/>
                </svg>
              </div>
              <span class="text-lg font-bold">{{ currentMinute }}'</span>
              <span class="text-xs opacity-90">Match Time</span>
            </div>
            
            <div class="flex items-center justify-between gap-4 sm:gap-6 w-full flex-1">
              <!-- Home Team -->
              <div class="flex-1 flex flex-col items-center text-center">
                <img 
                  :src="getTeamLogoUrl(event.teams.home)"
                  :alt="event.teams.home"
                  class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain mb-3 drop-shadow-lg"
                />
                <h2 class="text-base sm:text-lg lg:text-xl font-bold">{{ event.teams.home }}</h2>
              </div>

              <!-- Score -->
              <div class="flex flex-col items-center justify-center px-4 sm:px-6">
                <template v-if="event.status.toLowerCase() === 'finished' || event.status.toLowerCase() === 'live'">
                  <div class="flex items-center gap-3 sm:gap-5">
                    <span class="text-4xl sm:text-5xl lg:text-6xl font-bold">
                      {{ formatScore(event.liveScore?.home) }}
                    </span>
                    <span class="text-2xl sm:text-3xl lg:text-4xl text-gray-400">-</span>
                    <span class="text-4xl sm:text-5xl lg:text-6xl font-bold">
                      {{ formatScore(event.liveScore?.away) }}
                    </span>
                  </div>
                  <div class="mt-3 px-4 py-1.5 bg-white/10 rounded-full">
                    <span class="text-xs sm:text-sm font-medium text-green-400">
                      {{ event.status.toLowerCase() === 'finished' ? 'FINISHED' : 'LIVE' }}
                    </span>
                  </div>
                </template>
                <template v-else>
                  <div class="text-center">
                    <div class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-300 mb-2">VS</div>
                    <div class="text-xs sm:text-sm text-gray-400">
                      {{ formatDate(event.startTime) }}
                    </div>
                  </div>
                </template>
              </div>

              <!-- Away Team -->
              <div class="flex-1 flex flex-col items-center text-center">
                <img 
                  :src="getTeamLogoUrl(event.teams.away)"
                  :alt="event.teams.away"
                  class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain mb-3 drop-shadow-lg"
                />
                <h2 class="text-base sm:text-lg lg:text-xl font-bold">{{ event.teams.away }}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Two Column Layout: Peer Betting (Left, Smaller) + Match Events (Right, Wider) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <!-- Peer-to-Peer Betting (Left Column - 1/3 width) -->
        <div class="lg:col-span-1">
          <div class="card p-4 sm:p-6">
            
            <!-- Create New Bet Button (only visible during live events) -->
            <button
              v-if="event.status.toLowerCase() === 'live'"
              @click="showBetModal = true"
              class="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:bg-opacity-90 transition-all shadow-md mb-4 flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span class="text-white font-bold">New Prediction</span>
            </button>

            <!-- Active Bets List -->
            <div class="space-y-2">
              <h4 class="font-semibold text-xs text-gray-700 mb-2">Active Bets</h4>
              
              <div 
                v-for="bet in peerBets" 
                :key="bet.id"
                class="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow"
              >
                <div class="mb-2">
                  <p class="font-semibold text-xs text-gray-900 leading-tight">{{ bet.prediction }}</p>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-xs text-gray-500">{{ bet.totalPool }} USDL</span>
                    <span class="text-xs text-gray-500">{{ bet.totalVotes }} votes</span>
                  </div>
                </div>

                <!-- Percentage Bar -->
                <div class="mb-2">
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-green-600 font-medium">{{ bet.yesPercentage }}%</span>
                    <span class="text-red-600 font-medium">{{ bet.noPercentage }}%</span>
                  </div>
                  <div class="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    <div 
                      class="bg-green-500 transition-all duration-300"
                      :style="{ width: `${bet.yesPercentage}%` }"
                    ></div>
                    <div 
                      class="bg-red-500 transition-all duration-300"
                      :style="{ width: `${bet.noPercentage}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Vote Buttons (only visible during live events) -->
                <div v-if="event.status.toLowerCase() === 'live'" class="flex gap-1">
                  <button 
                    @click="placeBetVote(bet.id, true)"
                    class="flex-1 bg-green-500 text-white py-1 rounded text-xs font-semibold hover:bg-green-600 transition-colors"
                  >
                    Yes
                  </button>
                  <button 
                    @click="placeBetVote(bet.id, false)"
                    class="flex-1 bg-red-500 text-white py-1 rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="peerBets.length === 0" class="text-center py-6 text-gray-400">
                <p class="text-xs">No active bets</p>
                <p class="text-xs mt-1">Create one!</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Match Events Timeline (Right Column - 2/3 width) -->
        <div class="lg:col-span-2">
          <div v-if="event.matchEvents && event.matchEvents.length > 0" class="card p-4 sm:p-6">
            <h3 class="text-xl font-bold mb-6 text-center">Match Events</h3>
            
            <div class="space-y-4">
              <div 
                v-for="(matchEvent, index) in sortedMatchEvents" 
                :key="index"
                class="relative"
              >
                <!-- Timeline connector -->
                <div 
                  v-if="index < sortedMatchEvents.length - 1"
                  class="absolute left-1/2 top-12 w-0.5 h-full bg-gray-200 -translate-x-1/2 z-0"
                ></div>

                <!-- Event row -->
                <div class="relative flex items-center gap-4">
                  <!-- Home team event (left side) -->
                  <div 
                    class="flex-1 text-right"
                    :class="matchEvent.team.toLowerCase().includes('home') ? 'opacity-100' : 'opacity-0'"
                  >
                    <div 
                      v-if="matchEvent.team.toLowerCase().includes('home')"
                      class="inline-block bg-blue-50 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div class="flex items-center gap-3 justify-end">
                        <div class="text-right">
                          <div class="font-semibold text-sm text-gray-900">{{ matchEvent.player || event.teams.home }}</div>
                          <div class="text-xs text-gray-600">{{ matchEvent.detail }}</div>
                        </div>
                        <div :class="getEventIconClass(matchEvent.eventType)">
                          {{ getEventIcon(matchEvent.eventType) }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Center timeline marker with minute -->
                  <div class="flex flex-col items-center z-10">
                    <div class="w-12 h-12 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-lg">
                      <span class="text-sm font-bold text-primary">{{ matchEvent.time }}'</span>
                    </div>
                  </div>

                  <!-- Away team event (right side) -->
                  <div 
                    class="flex-1 text-left"
                    :class="matchEvent.team.toLowerCase().includes('away') ? 'opacity-100' : 'opacity-0'"
                  >
                    <div 
                      v-if="matchEvent.team.toLowerCase().includes('away')"
                      class="inline-block bg-red-50 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div class="flex items-center gap-3">
                        <div :class="getEventIconClass(matchEvent.eventType)">
                          {{ getEventIcon(matchEvent.eventType) }}
                        </div>
                        <div class="text-left">
                          <div class="font-semibold text-sm text-gray-900">{{ matchEvent.player || event.teams.away }}</div>
                          <div class="text-xs text-gray-600">{{ matchEvent.detail }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No events message -->
          <div v-else-if="event.status.toLowerCase() === 'live'" class="card p-8 text-center">
            <div class="text-gray-400 text-lg">No match events yet</div>
            <div class="text-sm text-gray-500 mt-2">Events will appear here as the match progresses</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Bet Modal -->
    <div 
      v-if="showBetModal" 
      class="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="showBetModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">New Prediction</h3>
          <button 
            @click="showBetModal = false"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Prediction</label>
            <select 
              v-model="newBet.prediction" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select a prediction...</option>
              <option :value="`Next goal by ${event.teams.home}`">Next goal by {{ event.teams.home }}</option>
              <option :value="`Next goal by ${event.teams.away}`">Next goal by {{ event.teams.away }}</option>
              <option value="Total goals over 2.5">Total goals over 2.5</option>
              <option value="Total corners over 10">Total corners over 10</option>
              <option value="Red card in match">Red card in match</option>
              <option value="Penalty awarded">Penalty awarded</option>
              <option :value="`${event.teams.home} wins`">{{ event.teams.home }} wins</option>
              <option :value="`${event.teams.away} wins`">{{ event.teams.away }} wins</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount (USDL)</label>
            <input 
              v-model.number="newBet.amount" 
              type="number" 
              min="1" 
              step="1"
              placeholder="Enter amount to bet"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              @click="showBetModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="createBet"
              :disabled="!newBet.prediction || !newBet.amount"
              class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Bet
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vote Amount Modal -->
    <div 
      v-if="showVoteModal" 
      class="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="showVoteModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">
            Vote {{ voteData.isYes ? 'Yes' : 'No' }}
          </h3>
          <button 
            @click="showVoteModal = false"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Available Balance -->
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-xs text-gray-600">Available Balance</p>
            <p class="text-lg font-bold text-gray-900">{{ walletBalance }} USDL</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Bet Amount (USDL)</label>
            <input 
              v-model.number="voteData.amount" 
              type="number" 
              min="1" 
              :max="walletBalance"
              step="1"
              placeholder="Enter amount to bet"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              autofocus
            />
            <p v-if="voteData.amount > walletBalance" class="text-xs text-red-500 mt-1">
              Insufficient balance. Maximum: {{ walletBalance }} USDL
            </p>
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              @click="showVoteModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="confirmVote"
              :disabled="!voteData.amount || voteData.amount <= 0"
              :class="[
                'flex-1 px-4 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-white',
                voteData.isYes ? 'bg-green-500 hover:opacity-90' : 'bg-red-500 hover:opacity-90'
              ]"
            >
              Confirm Vote
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEvents } from '@/composables/useEvents';
import { appStore } from '@/stores/app';
import { getTeamLogoUrl } from '@/utils/teamLogos';
import { getLeagueLogoUrlByName } from '@/utils/leagueLogos';

const route = useRoute();
const { allEvents, getEvents } = useEvents();
const { walletBalance } = appStore();

const isLoading = ref(true);
const currentMinute = ref(0);
const showBetModal = ref(false);
const showVoteModal = ref(false);
const voteData = ref<{ betId: number; isYes: boolean; amount: number }>({ betId: 0, isYes: true, amount: 0 });
let minuteInterval: any = null;

// Peer betting state
const newBet = ref({
  prediction: '',
  amount: 0
});

const peerBets = ref([
  {
    id: 1,
    prediction: 'Next goal by Manchester City',
    totalPool: 150,
    totalVotes: 12,
    yesVotes: 8,
    noVotes: 4,
    yesPercentage: 67,
    noPercentage: 33
  },
  {
    id: 2,
    prediction: 'Total goals over 2.5',
    totalPool: 200,
    totalVotes: 15,
    yesVotes: 10,
    noVotes: 5,
    yesPercentage: 67,
    noPercentage: 33
  },
  {
    id: 3,
    prediction: 'Total corners over 10',
    totalPool: 80,
    totalVotes: 8,
    yesVotes: 3,
    noVotes: 5,
    yesPercentage: 38,
    noPercentage: 62
  },
  {
    id: 4,
    prediction: 'Red card in match',
    totalPool: 50,
    totalVotes: 6,
    yesVotes: 2,
    noVotes: 4,
    yesPercentage: 33,
    noPercentage: 67
  }
]);

const eventId = computed(() => route.params.id);

const event = computed(() => {
  return allEvents.value.find((e: any) => e.id.toString() === eventId.value);
});

const sortedMatchEvents = computed(() => {
  if (!event.value?.matchEvents) return [];
  return [...event.value.matchEvents].sort((a: any, b: any) => {
    const timeA = parseInt(a.time) || 0;
    const timeB = parseInt(b.time) || 0;
    return timeB - timeA;
  });
});

const calculateCurrentMinute = () => {
  if (!event.value || event.value.status.toLowerCase() !== 'live') {
    return 0;
  }
  
  if (event.value.matchEvents && event.value.matchEvents.length > 0) {
    const latestEvent = [...event.value.matchEvents].sort((a: any, b: any) => {
      const timeA = parseInt(a.time) || 0;
      const timeB = parseInt(b.time) || 0;
      return timeB - timeA;
    })[0];
    return parseInt(latestEvent.time) || 0;
  }
  
  const startTime = event.value.startTime;
  if (!startTime) return 0;
  
  const start = typeof startTime === 'string' ? Number(startTime) : startTime;
  const now = Date.now();
  const elapsed = Math.floor((now - start) / 60000);
  
  return Math.max(0, Math.min(elapsed, 90));
};

const startMinuteCounter = () => {
  currentMinute.value = calculateCurrentMinute();
  
  if (event.value?.status.toLowerCase() === 'live') {
    minuteInterval = setInterval(() => {
      currentMinute.value = calculateCurrentMinute();
    }, 30000);
  }
};

const getEventIcon = (eventType: string) => {
  switch (eventType.toLowerCase()) {
    case 'goal':
      return '⚽';
    case 'yellowcard':
      return '🟨';
    case 'redcard':
      return '🟥';
    case 'substitution':
      return '🔄';
    case 'corner':
      return '🚩';
    case 'penalty':
      return '⚠️';
    default:
      return '📋';
  }
};

const getEventIconClass = (eventType: string) => {
  const baseClass = 'text-2xl flex items-center justify-center w-10 h-10 rounded-full';
  
  switch (eventType.toLowerCase()) {
    case 'goal':
      return `${baseClass} bg-green-100`;
    case 'yellowcard':
      return `${baseClass} bg-yellow-100`;
    case 'redcard':
      return `${baseClass} bg-red-100`;
    case 'substitution':
      return `${baseClass} bg-blue-100`;
    case 'corner':
      return `${baseClass} bg-purple-100`;
    case 'penalty':
      return `${baseClass} bg-orange-100`;
    default:
      return `${baseClass} bg-gray-100`;
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

const formatScore = (score: any) => {
  if (score === '' || score == null) return 0;
  const numScore = typeof score === 'string' ? Number(score) : score;
  return Number.isFinite(numScore) ? numScore : 0;
};

const createBet = () => {
  if (!newBet.value.prediction || !newBet.value.amount) return;
  
  const newBetData = {
    id: peerBets.value.length + 1,
    prediction: newBet.value.prediction,
    totalPool: newBet.value.amount,
    totalVotes: 1,
    yesVotes: 1,
    noVotes: 0,
    yesPercentage: 100,
    noPercentage: 0
  };
  
  peerBets.value.unshift(newBetData);
  
  // Reset form
  newBet.value = {
    prediction: '',
    amount: 0
  };
  
  // Show success message (you can add a toast notification here)
  console.log('Bet created successfully!');
};

const placeBetVote = (betId: number, isYes: boolean) => {
  // Open modal to enter bet amount
  voteData.value = { betId, isYes, amount: 0 };
  showVoteModal.value = true;
};

const confirmVote = () => {
  const { betId, isYes, amount } = voteData.value;
  
  if (!amount || amount <= 0) {
    console.error('Invalid bet amount');
    return;
  }
  
  // Validate balance
  if (amount > walletBalance) {
    console.error(`Insufficient balance. Available: ${walletBalance}, Required: ${amount}`);
    return;
  }
  
  const bet = peerBets.value.find(b => b.id === betId);
  if (!bet) return;
  
  // Update vote counts
  if (isYes) {
    bet.yesVotes++;
  } else {
    bet.noVotes++;
  }
  bet.totalVotes++;
  
  // Recalculate percentages
  bet.yesPercentage = Math.round((bet.yesVotes / bet.totalVotes) * 100);
  bet.noPercentage = Math.round((bet.noVotes / bet.totalVotes) * 100);
  
  // Add to pool
  bet.totalPool += amount;
  
  // Close modal and reset
  showVoteModal.value = false;
  voteData.value = { betId: 0, isYes: true, amount: 0 };
  
  console.log(`Voted ${isYes ? 'Yes' : 'No'} with ${amount} USDL on bet: ${bet.prediction}`);
};

onMounted(async () => {
  isLoading.value = true;
  
  if (allEvents.value.length === 0) {
    await getEvents();
  }
  
  isLoading.value = false;
  startMinuteCounter();
});

onUnmounted(() => {
  if (minuteInterval) {
    clearInterval(minuteInterval);
  }
});
</script>
