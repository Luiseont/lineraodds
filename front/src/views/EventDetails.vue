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
              <span class="text-lg font-bold">{{ displayMinute }}'</span>
              <span class="text-xs opacity-90">Match Time</span>
            </div>
            
            <div class="flex items-center justify-between gap-4 sm:gap-6 w-full flex-1">
              <!-- Home Team -->
              <div class="flex-1 flex flex-col items-center text-center">
                <img 
                  :src="getTeamLogoUrl(event.teams.home.name)"
                  :alt="event.teams.home.name"
                  class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain mb-3 drop-shadow-lg"
                />
                <h2 class="text-base sm:text-lg lg:text-xl font-bold">{{ event.teams.home.name }}</h2>
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
                  :src="getTeamLogoUrl(event.teams.away.name)"
                  :alt="event.teams.away.name"
                  class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain mb-3 drop-shadow-lg"
                />
                <h2 class="text-base sm:text-lg lg:text-xl font-bold">{{ event.teams.away.name }}</h2>
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
              @click="openCreateBetModal"
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
                v-for="bet in formattedPredictions" 
                :key="bet.id"
                class="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow"
              >
                <div class="mb-2">
                  <p class="font-semibold text-xs text-gray-900 leading-tight">{{ bet.prediction }}</p>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-xs text-gray-500">{{ bet.totalPool }} USDL</span>
                    <span class="text-xs text-gray-500">{{ bet.totalVotes }} votes</span>
                  </div>
                  
                  <!-- User Vote Display -->
                  <div v-if="bet.userVote" class="mt-1.5 mb-1.5 p-2 rounded-lg text-xs shadow-sm border" 
                       :class="bet.userVote.choice === 'Yes' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'">
                    <div class="flex justify-between items-center mb-1.5">
                        <span class="font-bold text-gray-700 text-[10px] uppercase tracking-wide">Your Position</span>
                        <span class="px-2 py-0.5 rounded-full font-bold text-[10px]" 
                              :class="bet.userVote.choice === 'Yes' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
                          {{ bet.userVote.choice }}
                        </span>
                    </div>
                    <div class="space-y-1">
                      <div class="flex justify-between items-center">
                          <span class="text-gray-600 font-medium text-[10px]">Wagered</span>
                          <span class="font-bold text-gray-900 text-[10px]">{{ bet.userVote.amount }} USDL</span>
                      </div>
                      <div class="flex justify-between items-center pt-0.5 border-t border-gray-200">
                          <span class="text-gray-600 font-medium text-[10px]">Potential Win</span>
                          <span class="font-bold text-green-600 flex items-center gap-0.5 text-[10px]">
                            <span class="text-[9px]">↗</span>
                            <span>+{{ bet.userVote.potentialWin }} USDL</span>
                          </span>
                      </div>
                    </div>
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

                <!-- Actions: Claim / Outcome / Vote -->
                 <div v-if="bet.resolved">
                    <!-- Claim Button if User Voted & Not Claimed -->
                    <div v-if="bet.userVote && !bet.userVote.claimed" class="mt-1.5">
                         <button 
                             @click="handleClaimReward(event.id, bet.id)" 
                             :disabled="claimingPredictions.get(bet.id)"
                             class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-1.5 rounded-lg text-[10px] font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-sm hover:shadow-md transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                         >
                             {{ claimingPredictions.get(bet.id) ? '⏳ Claiming...' : '🎁 Claim Reward' }}
                         </button>
                    </div>
                    <!-- Outcome Display if Claimed or Didn't Vote -->
                    <div v-else class="mt-1.5">
                        <!-- User participated and claimed -->
                        <div v-if="bet.userVote && bet.userVote.claimed">
                            <!-- Check if user won or lost -->
                            <div v-if="(bet.outcome && bet.userVote.choice === 'Yes') || (!bet.outcome && bet.userVote.choice === 'No')" 
                                 class="p-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                                <div class="flex items-center justify-center gap-1.5 mb-0.5">
                                    <span class="text-lg">🎉</span>
                                    <span class="text-[11px] font-bold text-green-700">YOU WON!</span>
                                    <span class="text-lg">🎉</span>
                                </div>
                                <div class="text-center text-[10px] text-green-600 font-semibold">
                                    Outcome: {{ bet.outcome ? 'YES' : 'NO' }}
                                </div>
                                <div class="text-center text-[9px] text-green-500 mt-0.5">
                                    Reward claimed ✓
                                </div>
                            </div>
                            <!-- User lost -->
                            <div v-else class="p-2 bg-gradient-to-br from-red-50 to-rose-50 border border-red-300 rounded-lg">
                                <div class="flex items-center justify-center gap-1.5 mb-0.5">
                                    <span class="text-lg">😔</span>
                                    <span class="text-[11px] font-bold text-red-700">YOU LOST</span>
                                </div>
                                <div class="text-center text-[10px] text-red-600 font-semibold">
                                    Outcome: {{ bet.outcome ? 'YES' : 'NO' }}
                                </div>
                                <div class="text-center text-[9px] text-red-500 mt-0.5">
                                    Better luck next time!
                                </div>
                            </div>
                        </div>
                        <!-- User didn't participate -->
                        <div v-else class="p-2 bg-gray-100 border border-gray-300 rounded-lg">
                            <div class="text-center text-[10px] font-bold text-gray-700">
                                 Outcome: {{ bet.outcome ? 'YES' : 'NO' }}
                            </div>
                        </div>
                    </div>
                 </div>

                 <!-- Vote Buttons (only visible during live events if not voted) -->
                 <div v-else-if="event.status.toLowerCase() === 'live' && !bet.userVote" class="flex gap-1">
                   <button 
                     @click="placeBetVote(bet.id, true, bet.predictionType)"
                     class="flex-1 bg-green-500 text-white py-1 rounded text-xs font-semibold hover:bg-green-600 transition-colors"
                   >
                     Yes
                   </button>
                   <button 
                     @click="placeBetVote(bet.id, false, bet.predictionType)"
                     class="flex-1 bg-red-500 text-white py-1 rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                   >
                     No
                   </button>
                 </div>
               </div>
 
               <!-- Empty State -->
               <div v-if="formattedPredictions.length === 0" class="text-center py-6 text-gray-400">
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
                          <div class="font-semibold text-sm text-gray-900">{{ matchEvent.player || event.teams.home.name }}</div>
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
                          <div class="font-semibold text-sm text-gray-900">{{ matchEvent.player || event.teams.away.name }}</div>
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

     <div 
       v-if="showBetModal" 
       class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
       @click.self="showBetModal = false"
     >
       <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
         <div class="flex items-center justify-between mb-6">
           <h3 class="text-2xl font-bold text-gray-900">New Prediction</h3>
           <button 
             @click="showBetModal = false"
             class="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
           >
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
         </div>

         <div class="space-y-5">
           <!-- Prediction Select -->
           <div>
             <label class="block text-sm font-semibold text-gray-700 mb-2">What is your prediction?</label>
             <div class="relative">
                <select 
                   v-model="newBet.prediction" 
                   class="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                >
                   <option value="" disabled>Select a prediction...</option>
                   <optgroup label="Next Goal" v-if="availablePredictionOptions.nextGoal.length > 0">
                     <option v-for="opt in availablePredictionOptions.nextGoal" :key="opt" :value="opt">{{ opt }}</option>
                   </optgroup>
                   <optgroup label="Total Goals Over" v-if="availablePredictionOptions.over.length > 0">
                     <option v-for="opt in availablePredictionOptions.over" :key="opt" :value="opt">{{ opt }}</option>
                   </optgroup>
                   <optgroup label="Total Goals Under" v-if="availablePredictionOptions.under.length > 0">
                     <option v-for="opt in availablePredictionOptions.under" :key="opt" :value="opt">{{ opt }}</option>
                   </optgroup>
                   <!-- <optgroup label="Other">
                     <option value="Both Teams To Score">Both Teams To Score (BTTS)</option>
                     <option value="Red card in match">Red card in match</option>
                     <option value="Goal in next 10 mins">Goal in next 10 mins</option>
                   </optgroup> -->
                </select>
                <!-- Custom arrow icon absolute positioned -->
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
             </div>
           </div>

           <!-- Amount Input -->
           <div>
             <div class="flex justify-between mb-2">
                <label class="block text-sm font-semibold text-gray-700">Wager Amount</label>
                <span class="text-xs text-gray-500 font-medium">Balance: {{ walletBalance }} USDL</span>
             </div>
             <div class="relative">
                <input 
                  v-model.number="newBet.amount" 
                  type="number" 
                  min="1" 
                  placeholder="0"
                  class="w-full pl-4 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-200': newBet.amount > walletBalance }"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold tracking-wider pointer-events-none">USDL</span>
             </div>
             <p v-if="newBet.amount > walletBalance" class="text-xs text-red-500 mt-1 font-medium">
               Insufficient balance
             </p>
           </div>

           <!-- Initial Vote Segmented Control -->
           <div>
             <label class="block text-sm font-semibold text-gray-700 mb-3">Your Position</label>
             <div class="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
               <button 
                 @click="newBet.initialVote = true"
                 :class="[
                   'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                   newBet.initialVote ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                 ]"
               >
                 <span class="text-lg leading-none">👍</span> Yes
               </button>
               <button 
                 @click="newBet.initialVote = false"
                 :class="[
                   'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                   !newBet.initialVote ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                 ]"
               >
                 <span class="text-lg leading-none">👎</span> No
               </button>
             </div>
           </div>

           <!-- Actions -->
           <div class="flex gap-3 pt-2">
             <button 
               @click="showBetModal = false"
               class="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
             >
               Cancel
             </button>
              <button 
                @click="createBet"
                :disabled="!newBet.prediction || !newBet.amount || newBet.amount > walletBalance || isCreatingPrediction"
                class="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed"
              >
                {{ isCreatingPrediction ? 'Creating...' : 'Create Prediction' }}
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
              :disabled="!voteData.amount || voteData.amount <= 0 || isConfirmingVote"
              :class="[
                'flex-1 px-4 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-white',
                voteData.isYes ? 'bg-green-500 hover:opacity-90' : 'bg-red-500 hover:opacity-90'
              ]"
            >
              {{ isConfirmingVote ? 'Confirming...' : 'Confirm Vote' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <WalletSelectorModal 
      :is-open="showWalletSelector" 
      @close="showWalletSelector = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useEvents } from '@/composables/useEvents';
import { useWallet } from '@/composables/useWallet';
import { useApp } from '@/composables/useApp';
import { appStore } from '@/stores/app';
import { getTeamLogoUrl } from '@/utils/teamLogos';
import { getLeagueLogoUrlByName } from '@/utils/leagueLogos';
import WalletSelectorModal from '@/components/WalletSelectorModal.vue';

const route = useRoute();
const { allEvents, getEvents } = useEvents();
const { walletBalance } = storeToRefs(appStore());
const { connected, chainId } = useWallet();
const WsUrl = import.meta.env.VITE_APP_SERVICE == '' ? 'http://localhost:8081' : import.meta.env.VITE_APP_SERVICE;

const isLoading = ref(true);
const claimingPredictions = ref<Map<number, boolean>>(new Map());
const showBetModal = ref(false);
const isCreatingPrediction = ref(false);
const isConfirmingVote = ref(false);
const showVoteModal = ref(false);
const showWalletSelector = ref(false);
const voteData = ref<{ betId: number; isYes: boolean; amount: number; predictionType: any }>({ betId: 0, isYes: true, amount: 0, predictionType: null });
let minuteInterval: any = null;

// Peer betting state
const newBet = ref({
  prediction: '',
  amount: 0,
  initialVote: true
});

const eventId = computed(() => route.params.id);

const event = computed(() => {
  return allEvents.value.find((e: any) => e.id.toString() === eventId.value);
});

const formattedPredictions = computed(() => {
    if (!event.value || !event.value.predictions) return [];

    return event.value.predictions.map((prediction: any) => {
        // Ensure values are treated as strings and remove decimals if any
        const safePoolYes = String(prediction.poolYes || 0).split('.')[0] ?? '0';
        const safePoolNo = String(prediction.poolNo || 0).split('.')[0] ?? '0';
       
        const poolYes = BigInt(safePoolYes);
        const poolNo = BigInt(safePoolNo);
        const totalPool = poolYes + poolNo;

        const totalVotes = prediction.votes.length;
        
        // Count votes for Yes and No
        const yesVotes = prediction.votes.filter((v: any) => v.choice === true).length;
        const noVotes = prediction.votes.filter((v: any) => v.choice === false).length;
        
        let yesPercentage = 0;
        let noPercentage = 0;

        if (totalVotes > 0) {
            // Calculate percentages based on number of votes, not amounts
            yesPercentage = Math.round((yesVotes / totalVotes) * 100);
            noPercentage = Math.round((noVotes / totalVotes) * 100);
        }

        // Check for user's vote
        let userVote = null;
        
        if (connected.value && chainId.value && prediction.votes) {
            // Use ChainID since that's what the contract stores in Vote.user
            const userChainId = chainId.value.toLowerCase();
            const vote = prediction.votes.find((v: any) => v.user.toLowerCase() === userChainId);
            
            if (vote) {
                // Safeguard against decimals/scientific notation
                const safeVoteAmount = String(vote.amount || 0).split('.')[0] ?? '0';
                const voteAmount = BigInt(safeVoteAmount);
                let potentialWin = 0n;
                
                // Potential Win Calculation:
                if (vote.choice) { // Yes
                     if (poolYes > 0n) {
                         potentialWin = (voteAmount * totalPool) / poolYes;
                     }
                } else { // No
                     if (poolNo > 0n) {
                         potentialWin = (voteAmount * totalPool) / poolNo;
                     }
                }
                
                userVote = {
                    choice: vote.choice ? 'Yes' : 'No',
                    amount: vote.amount,
                    potentialWin: potentialWin.toString(),
                    claimed: vote.claimed
                };
            }
        }

        return {
            id: prediction.id,
            prediction: prediction.question,
            totalPool: totalPool.toString(),
            totalVotes: totalVotes,
            yesVotes: prediction.votes.filter((v: any) => v.choice).length,
            noVotes: prediction.votes.filter((v: any) => !v.choice).length,
            yesPercentage: yesPercentage,
            noPercentage: noPercentage,
            userVote: userVote,
            poolYes: prediction.poolYes,
            poolNo: prediction.poolNo,
            resolved: prediction.resolved,
            outcome: prediction.outcome,
            predictionType: prediction.predictionType
        };
    });
});

const sortedMatchEvents = computed(() => {
  if (!event.value?.matchEvents) return [];
  return [...event.value.matchEvents].sort((a: any, b: any) => {
    const timeA = parseInt(a.time) || 0;
    const timeB = parseInt(b.time) || 0;
    return timeB - timeA;
  });
});

// Display minute from backend
const currentTime = ref(Date.now());
const displayMinute = computed(() => {
  if (!event.value) return 0;
  return event.value.currentMinute || 0;
});

// Filter available predictions based on current match state and existing predictions
const availablePredictionOptions = computed(() => {
  if (!event.value) return {
    nextGoal: [],
    over: [],
    under: []
  };

  const predictions = event.value.predictions || [];
  const homeTeam = event.value.teams?.home?.name || 'Home Team';
  const awayTeam = event.value.teams?.away?.name || 'Away Team';

  // Next Goal options (can always repeat)
  const nextGoalOptions = [
    `Next goal by ${homeTeam}`,
    `Next goal by ${awayTeam}`
  ];

  // Over options
  const overOptions = [
    'Total goals over 0.5 (1+)',
    'Total goals over 1.5 (2+)',
    'Total goals over 2.5 (3+)',
    'Total goals over 3.5 (4+)'
  ].filter(opt => {
    return !isPredictionAlreadyTrue(opt, event.value) && 
           !isPredictionTypeExists(opt, predictions);
  });

  // Under options
  const underOptions = [
    'Total goals under 1.5 (0-1)',
    'Total goals under 2.5 (0-2)',
    'Total goals under 3.5 (0-3)',
    'Total goals under 4.5 (0-4)'
  ].filter(opt => {
    return !isPredictionAlreadyTrue(opt, event.value) && 
           !isPredictionTypeExists(opt, predictions);
  });

  return {
    nextGoal: nextGoalOptions,
    over: overOptions,
    under: underOptions
  };
});


const startMinuteCounter = () => {
  if (event.value?.status.toLowerCase() === 'live') {
    minuteInterval = setInterval(() => {
      currentTime.value = Date.now();
    }, 1000);
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

// Helper function to check if a prediction is already true based on current match state
const isPredictionAlreadyTrue = (predictionText: string, currentEvent: any): boolean => {
  if (!currentEvent || !currentEvent.liveScore) return false;
  
  const homeGoals = formatScore(currentEvent.liveScore.home);
  const awayGoals = formatScore(currentEvent.liveScore.away);
  const totalGoals = homeGoals + awayGoals;
  
  // Check "Over" predictions
  if (predictionText.includes('Over') || predictionText.includes('over')) {
    const match = predictionText.match(/(\d+\.?\d*)/);
    if (match) {
      const threshold = parseFloat(match[0]);
      return totalGoals > threshold;
    }
  }
  
  // Check "Under" predictions
  if (predictionText.includes('Under') || predictionText.includes('under')) {
    const match = predictionText.match(/(\d+\.?\d*)/);
    if (match) {
      const threshold = parseFloat(match[0]);
      return totalGoals >= threshold;
    }
  }
  
  // Check "Both Teams To Score"
  if (predictionText === 'Both Teams To Score') {
    return homeGoals > 0 && awayGoals > 0;
  }
  
  // Check "Red card"
  if (predictionText === 'Red card in match') {
    return currentEvent.match_events?.some((e: any) => e.event_type === 'RedCard') || false;
  }
  
  return false;
};

// Helper function to get prediction type key for uniqueness check
const getPredictionTypeKey = (predictionText: string): string => {
  // NextGoal predictions can repeat, so return unique key each time
  if (predictionText.startsWith('Next goal by')) {
    return `NextGoal_${Date.now()}_${Math.random()}`;
  }
  
  // For other predictions, normalize to a comparable key
  if (predictionText.includes('Over')) {
    const match = predictionText.match(/(\d+\.?\d*)/);
    return match ? `TotalGoalsOver_${match[0]}` : predictionText;
  }
  
  if (predictionText.includes('Under')) {
    const match = predictionText.match(/(\d+\.?\d*)/);
    return match ? `TotalGoalsUnder_${match[0]}` : predictionText;
  }
  
  return predictionText;
};

// Check if prediction type already exists
const isPredictionTypeExists = (predictionText: string, predictions: any[]): boolean => {
  if (!predictions || predictions.length === 0) return false;
  
  const typeKey = getPredictionTypeKey(predictionText);
  
  // NextGoal always returns unique key, so will never exist
  if (typeKey.startsWith('NextGoal_')) return false;
  
  return predictions.some(pred => {
    const existingKey = getPredictionTypeKey(pred.description || '');
    return existingKey === typeKey;
  });
};



// Format amount from 1e18 to human readable
const formatAmount = (amount: any) => {
  if (!amount) return '0';
  const val = BigInt(amount);
  return (Number(val) / 1000000000000000000).toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const createBet = async () => {
   if (!newBet.value.prediction || !newBet.value.amount || isCreatingPrediction.value) return;
   
   // Validate prediction is not already true and doesn't already exist
   if (isPredictionAlreadyTrue(newBet.value.prediction, event.value)) {
       alert('This prediction is already resolved based on the current match state.');
       return;
   }
   
   if (isPredictionTypeExists(newBet.value.prediction, event.value.predictions || [])) {
       alert('A prediction of this type already exists for this event.');
       return;
   }
   
   isCreatingPrediction.value = true;
   
   let predictionType: any = null;
   const pred = newBet.value.prediction;

    if (pred.startsWith("Next goal by")) {
      const teamName = pred.replace("Next goal by ", "");
      const selection = teamName === event.value.teams.home.name ? "Home" : "Away";
      predictionType = { "NextGoal": selection };
    } else if (pred.startsWith("Total goals over")) {
      if (pred.includes("0.5")) predictionType = { "TotalGoalsOver": 0 };
      else if (pred.includes("1.5")) predictionType = { "TotalGoalsOver": 1 };
      else if (pred.includes("2.5")) predictionType = { "TotalGoalsOver": 2 };
      else if (pred.includes("3.5")) predictionType = { "TotalGoalsOver": 3 };
    } else if (pred.startsWith("Total goals under")) {
      if (pred.includes("1.5")) predictionType = { "TotalGoalsUnder": 2 };
      else if (pred.includes("2.5")) predictionType = { "TotalGoalsUnder": 3 };
      else if (pred.includes("3.5")) predictionType = { "TotalGoalsUnder": 4 };
      else if (pred.includes("4.5")) predictionType = { "TotalGoalsUnder": 5 };
    } else if (pred === "Both Teams To Score") {
      predictionType = "BTTS";
    } else if (pred === "Red card in match") {
      predictionType = "RedCard";
    } else if (pred === "Goal in next 10 mins") {
      predictionType = { "GoalInNext10Mins": displayMinute.value };
    } else {
        return; // unsupported
    }
 
   try {
       // Convert amount to attos (tokens * 10^18)
       const amountInTokens = BigInt(Math.floor(newBet.value.amount));
       const amountInAttos = amountInTokens * 1_000_000_000_000_000_000n;


       await appStore().createPrediction(
           Date.now(),
           event.value.id,
           predictionType,
           newBet.value.prediction,
           newBet.value.initialVote,
           newBet.value.amount.toString()
       );
       
        console.log("Prediction created");
        newBet.value = { prediction: '', amount: 0, initialVote: true };
        showBetModal.value = false;

       
       // Wait for cross-chain propagation
       setTimeout(() => {
           getEvents(); 
       }, 2000);
   } catch (e) {
       console.error(e);
   } finally {
       isCreatingPrediction.value = false;
   }
 };

 const handleClaimReward = async (evtId: string, predictionId: number) => {
    if (claimingPredictions.value.get(predictionId)) return; // Already claiming
    
    claimingPredictions.value.set(predictionId, true);
    try {
        await appStore().claimPredictionReward(evtId, predictionId);
        getEvents(); // Refresh data
    } catch (e) {
        console.error("Failed to claim reward:", e);
    } finally {
        claimingPredictions.value.set(predictionId, false);
    }
 };

// ...

// Open modal or prompt wallet connection
const openCreateBetModal = () => {
  if (!connected.value) {
    showWalletSelector.value = true
    return
  }
  showBetModal.value = true
}

const placeBetVote = (betId: number, isYes: boolean, predictionType: any) => {
  if (!connected.value) {
    showWalletSelector.value = true
    return
  }
  // Open modal to enter bet amount
  voteData.value = { betId, isYes, amount: 0, predictionType: predictionType };
  showVoteModal.value = true;
};

const confirmVote = async () => {
  const { betId, isYes, amount, predictionType } = voteData.value;
  
  if (!amount || amount <= 0 || isConfirmingVote.value) return;
  
  isConfirmingVote.value = true;
  try {
      // Convert amount to attos (tokens * 10^18)
      const amountInTokens = BigInt(Math.floor(amount));
      const amountInAttos = amountInTokens * 1_000_000_000_000_000_000n;

      await appStore().placeVote(
          event.value.id,
          betId,
          isYes,
          amount.toString(),
          predictionType
      );

      console.log("Vote placed");
      showVoteModal.value = false;
      getEvents();
  } catch(e) {
      console.error(e);
  } finally {
      isConfirmingVote.value = false;
  }
};

onMounted(async () => {
  isLoading.value = true;
  
  if (allEvents.value.length === 0) {
    await getEvents();
  }
  
  isLoading.value = false;
  startMinuteCounter();
});


// Reset forms when modals close
watch(showBetModal, (newVal) => {
  if (!newVal) {
    newBet.value = {
      prediction: '',
      amount: 0,
      initialVote: true
    };
  }
});

watch(showVoteModal, (newVal) => {
  if (!newVal) {
    voteData.value = {
      betId: 0,
      isYes: true,
      amount: 0,
      predictionType: null
    };
  }
});

onUnmounted(() => {
  if (minuteInterval) {
    clearInterval(minuteInterval);
  }
});
</script>
