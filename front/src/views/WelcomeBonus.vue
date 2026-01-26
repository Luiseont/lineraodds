<template>
  <!-- Wallet Guard -->
  <ConnectWalletPrompt v-if="!connected" />

  <div v-else class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-secondary mb-2">Welcome Bonus</h1>
      <p class="text-gray-600">Claim your free USDL tokens to start betting!</p>
    </div>

    <!-- Main Bonus Card -->
    <div class="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-orange-50 rounded-3xl shadow-2xl p-8 md:p-12 border border-primary/20">
      <!-- Decorative Elements -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div class="relative z-10">
        <!-- Bonus Amount Display -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center mb-4">
            <div class="relative">
              <div class="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <div class="relative bg-primary rounded-full p-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-white">
                  <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome Bonus Available!</h2>
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="h-px w-12 bg-gradient-to-r from-transparent to-primary"></div>
            <div class="flex items-baseline gap-2">
              <span class="text-6xl font-black text-primary">
                {{ BONUS_AMOUNT }}
              </span>
              <span class="text-2xl font-bold text-gray-600">USDL</span>
            </div>
            <div class="h-px w-12 bg-gradient-to-l from-transparent to-primary"></div>
          </div>
          <p class="text-gray-600 max-w-md mx-auto">
            Claim your one-time welcome bonus and start your betting journey on LineraOdds!
          </p>
        </div>

        <!-- Claim Button -->
        <div class="flex flex-col items-center gap-4">
          <button
            @click="handleClaim"
            :disabled="!canClaim"
            class="group relative px-12 py-5 bg-primary text-white text-xl font-bold rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none overflow-hidden"
          >
            <!-- Button Shine Effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <!-- Button Content -->
            <span v-if="claiming" class="flex items-center gap-3">
              <span class="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
              Claiming...
            </span>
            <span v-else-if="claimed" class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/>
              </svg>
              Bonus Claimed!
            </span>
            <span v-else class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z"/>
              </svg>
              Claim Bonus
            </span>
          </button>

          <!-- Already Claimed Message -->
          <div v-if="claimed" class="text-center">
            <p class="text-sm text-gray-500">You've already claimed your welcome bonus</p>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="successMessage" class="mt-6 p-4 bg-green-50 border-l-4 border-success rounded-r-xl animate-fade-in">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-success flex-shrink-0">
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/>
            </svg>
            <p class="text-success font-medium">{{ successMessage }}</p>
          </div>
        </div>
        
        <div v-if="errorMessage" class="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-fade-in">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-red-500 flex-shrink-0">
              <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/>
            </svg>
            <p class="text-red-800 font-medium">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="mt-8 grid md:grid-cols-2 gap-6">
      <!-- How it Works -->
      <div class="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-blue-600">
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 mb-2">How It Works</h3>
            <p class="text-sm text-gray-600 leading-relaxed">
              Click the "Claim Bonus" button to receive your one-time welcome bonus. The tokens will be instantly added to your balance and you can start betting right away!
            </p>
          </div>
        </div>
      </div>

      <!-- One-Time Offer -->
      <div class="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-md border border-orange-200">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-orange-600">
              <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 mb-2">One-Time Offer</h3>
            <p class="text-sm text-gray-600 leading-relaxed">
              This welcome bonus can only be claimed once per account. Make sure you're ready to start your betting journey before claiming!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApp } from '@/composables/useApp'
import { useWallet } from '@/composables/useWallet'
import ConnectWalletPrompt from '@/components/ConnectWalletPrompt.vue'

const { walletBalance, mintTokens, checkBonusClaimed, isBackendReady } = useApp()
const { connected } = useWallet()

const BONUS_AMOUNT = 100
const claiming = ref(false)
const claimed = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const canClaim = computed(() => {
  return !claiming.value && !claimed.value
})

async function handleClaim() {
  if (!canClaim.value) return

  claiming.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // Check if bonus was already claimed before attempting to mint
    const bonusClaimed = await checkBonusClaimed()
    
    if (bonusClaimed) {
      claimed.value = true
      errorMessage.value = 'You have already claimed your welcome bonus.'
      return
    }

    await mintTokens(BONUS_AMOUNT.toString())
    
    claimed.value = true
    successMessage.value = `🎉 Congratulations! You've successfully claimed ${BONUS_AMOUNT} USDL tokens!`
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to claim bonus. Please try again.'
  } finally {
    claiming.value = false
  }
}

// Check if bonus was already claimed on mount
onMounted(async () => {
  // Wait for backend to be ready
  const checkInterval = setInterval(async () => {
    if (isBackendReady.value) {
      clearInterval(checkInterval)
      try {
        const bonusClaimed = await checkBonusClaimed()
        claimed.value = bonusClaimed
        if (bonusClaimed) {
          console.log('User has already claimed the welcome bonus')
        }
      } catch (error) {
        console.error('Error checking bonus claimed status:', error)
      }
    }
  }, 100)
  
  // Cleanup after 10 seconds if backend never becomes ready
  setTimeout(() => clearInterval(checkInterval), 10000)
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
