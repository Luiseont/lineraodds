<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="handleSkip"
      >
        <div
          class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Close Button -->
          <button
            @click="handleSkip"
            class="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Slides Container with Fixed Height -->
          <div class="relative overflow-hidden h-[500px]">
            <TransitionGroup name="slide">
              <!-- Slide 1: Welcome -->
              <div v-if="currentSlide === 0" key="slide-0" class="slide-content absolute inset-0 overflow-hidden flex items-start">
                <div class="w-full text-center py-12 px-8">
                  <div class="mb-6 flex justify-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-primary to-red-700 rounded-full flex items-center justify-center">
                      <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h2 class="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to LineraOdds!
                  </h2>
                  <p class="text-lg text-gray-600 mb-6">
                    The decentralized real-time sports betting platform built on Linera blockchain.
                  </p>
                  <div class="bg-blue-50 border-l-4 border-primary p-4 rounded-r-lg">
                    <p class="text-sm text-gray-700">
                      We'll guide you through the basic steps to start betting on sports events.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Slide 2: Connect Wallet -->
              <div v-else-if="currentSlide === 1" key="slide-1" class="slide-content absolute inset-0 overflow-hidden flex items-start">
                <div class="w-full py-12 px-8">
                  <div class="mb-6 flex justify-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
                    Step 1: Connect Your Wallet
                  </h2>
                  <p class="text-gray-600 mb-6 text-center">
                    To get started, you need to connect your Linera wallet.
                  </p>
                  <div class="space-y-4">
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Click "Connect Wallet"</h3>
                        <p class="text-sm text-gray-600">You'll find the button in the top right corner.</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Select your wallet</h3>
                        <p class="text-sm text-gray-600">Choose between Linera Wallet or MetaMask compatible.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Slide 3: Mint USDL -->
              <div v-else-if="currentSlide === 2" key="slide-2" class="slide-content absolute inset-0 overflow-hidden flex items-start">
                <div class="w-full py-12 px-8">
                  <div class="mb-6 flex justify-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                      <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
                    Step 2: Get USDL Tokens
                  </h2>
                  <p class="text-gray-600 mb-6 text-center">
                    USDL tokens are the currency you'll use for betting.
                  </p>
                  <div class="space-y-4">
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Go to the "Welcome Bonus" section</h3>
                        <p class="text-sm text-gray-600">Use the navigation menu to access it.</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Claim your welcome bonus</h3>
                        <p class="text-sm text-gray-600">Click the claim button to receive your free tokens.</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Start betting!</h3>
                        <p class="text-sm text-gray-600">The tokens will appear in your balance instantly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Slide 4: Browse Events -->
              <div v-else-if="currentSlide === 3" key="slide-3" class="slide-content absolute inset-0 overflow-hidden flex items-start">
                <div class="w-full py-12 px-8">
                  <div class="mb-6 flex justify-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
                    Step 3: Browse Events
                  </h2>
                  <p class="text-gray-600 mb-6 text-center">
                    Find the sports events that interest you.
                  </p>
                  <div class="space-y-4">
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0">
                        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Filter by status</h3>
                        <p class="text-sm text-gray-600">SCHEDULED, LIVE, FINISHED, or POSTPONED.</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0">
                        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Filter by sport</h3>
                        <p class="text-sm text-gray-600">Football, Esports, Baseball, and more.</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0">
                        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Check the odds</h3>
                        <p class="text-sm text-gray-600">Odds update in real-time based on betting activity.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Slide 5: Place Bets -->
              <div v-else-if="currentSlide === 4" key="slide-4" class="slide-content absolute inset-0 overflow-hidden flex items-start">
                <div class="w-full py-12 px-8">
                  <div class="mb-6 flex justify-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                      <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
                    Step 4: Place Your Bet
                  </h2>
                  <p class="text-gray-600 mb-6 text-center">
                    Choose your prediction and the amount to bet.
                  </p>
                  <div class="space-y-4">
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Select an outcome</h3>
                        <p class="text-sm text-gray-600">Home, Away, or Tie.</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Enter the amount</h3>
                        <p class="text-sm text-gray-600">Specify how many USDL you want to bet.</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Confirm your bet</h3>
                        <p class="text-sm text-gray-600">You'll see your potential winnings before confirming.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Slide 6: Track & Claim -->
              <div v-else-if="currentSlide === 5" key="slide-5" class="slide-content absolute inset-0 overflow-y-auto flex items-start">
                <div class="w-full py-8 px-8">
                  <div class="mb-6 flex justify-center">
                    <div class="w-20 h-20 bg-gradient-to-br from-primary to-red-700 rounded-full flex items-center justify-center">
                      <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
                    Step 5: Track & Claim Rewards
                  </h2>
                  <p class="text-gray-600 mb-6 text-center">
                    Monitor your bets and claim your winnings.
                  </p>
                  <div class="space-y-4">
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0">
                        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Check "My Bets"</h3>
                        <p class="text-sm text-gray-600">View all your active bets and their status.</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0">
                        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 mb-1">Claim your rewards</h3>
                        <p class="text-sm text-gray-600">If you won, click "Claim" to receive your tokens.</p>
                      </div>
                    </div>
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-success p-4 rounded-r-lg">
                      <p class="font-semibold text-gray-900 mb-1">🎉 You're ready to start!</p>
                      <p class="text-sm text-gray-700">Enjoy decentralized betting on LineraOdds.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Progress Indicators -->
          <div class="flex justify-center gap-2 py-4 bg-gray-50">
            <button
              v-for="i in totalSlides"
              :key="i"
              @click="currentSlide = i - 1"
              class="transition-all rounded-full"
              :class="currentSlide === i - 1 
                ? 'w-8 h-2 bg-primary' 
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'"
              :aria-label="`Go to slide ${i}`"
            />
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between items-center px-8 py-6 bg-gray-50 border-t border-gray-200">
            <button
              v-if="currentSlide > 0"
              @click="previousSlide"
              class="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Previous
            </button>
            <button
              v-else
              @click="handleSkip"
              class="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Skip
            </button>

            <button
              v-if="currentSlide < totalSlides - 1"
              @click="nextSlide"
              class="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-medium transition-all shadow-md hover:shadow-lg"
            >
              Next →
            </button>
            <button
              v-else
              @click="handleComplete"
              class="px-8 py-3 bg-primary text-white rounded-lg hover:opacity-90 font-semibold transition-all shadow-lg hover:shadow-xl text-base"
            >
              Get Started 🚀
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'lineraodds_onboarded'

const isVisible = ref(false)
const currentSlide = ref(0)
const totalSlides = 6

// Check if user has completed onboarding
const hasCompletedOnboarding = () => {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

// Mark onboarding as completed
const markAsCompleted = () => {
  localStorage.setItem(STORAGE_KEY, 'true')
}

// Navigation functions
const nextSlide = () => {
  if (currentSlide.value < totalSlides - 1) {
    currentSlide.value++
  }
}

const previousSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

const handleSkip = () => {
  markAsCompleted()
  isVisible.value = false
}

const handleComplete = () => {
  markAsCompleted()
  isVisible.value = false
}

// Show modal on first visit
onMounted(() => {
  if (!hasCompletedOnboarding()) {
    // Small delay to ensure smooth transition
    setTimeout(() => {
      isVisible.value = true
    }, 500)
  }
})

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!isVisible.value) return
  
  if (e.key === 'ArrowRight') {
    nextSlide()
  } else if (e.key === 'ArrowLeft') {
    previousSlide()
  } else if (e.key === 'Escape') {
    handleSkip()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .slide-content,
.modal-leave-active .slide-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .slide-content {
  transform: scale(0.9);
}

.modal-leave-to .slide-content {
  transform: scale(0.9);
}

/* Slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: flex-start;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-content {
  position: relative;
  top: 0;
  height: 100%;
  display: flex;
  align-items: flex-start;
}

/* Custom scrollbar for content */
.slide-content::-webkit-scrollbar {
  width: 6px;
}

.slide-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.slide-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.slide-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
