<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-secondary mb-2">Mint USDL Tokens</h1>
      <p class="text-gray-600">Request tokens to start betting on sports events</p>
    </div>

    <!-- Mint Card -->
    <div class="bg-white rounded-2xl shadow-lg p-8">
      <!-- Current Balance -->
      <div class="mb-6 p-4 bg-gray-50 rounded-xl">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">Your Balance</span>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-yellow-500">
              <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z"/>
              <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clip-rule="evenodd"/>
            </svg>
            <span class="text-2xl font-bold text-secondary">{{ formattedWalletBalance }}</span>
            <span class="text-sm text-gray-600">USDL</span>
          </div>
        </div>
      </div>

      <!-- Amount Input -->
      <div class="mb-6">
        <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
          Amount to Mint
        </label>
        <div class="relative">
          <input
            id="amount"
            v-model.number="amount"
            type="number"
            min="1"
            step="1"
            placeholder="Enter amount"
            class="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            :disabled="minting"
          />
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            USDL
          </span>
        </div>
        <p class="mt-2 text-sm text-gray-500">Minimum: 1 USDL</p>
      </div>

      <!-- Quick Amount Buttons -->
      <div class="mb-6">
        <p class="text-sm font-medium text-gray-700 mb-3">Quick Select</p>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="quickAmount in [100, 500, 1000, 5000]"
            :key="quickAmount"
            @click="amount = quickAmount"
            :disabled="minting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ quickAmount }}
          </button>
        </div>
      </div>

      <!-- Mint Button -->
      <button
        @click="handleMint"
        :disabled="!canMint"
        class="w-full py-4 bg-primary text-white text-lg font-semibold rounded-xl transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        <span v-if="minting" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {{ minting ? 'Minting...' : 'Mint Tokens' }}
      </button>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
        <p class="text-green-800 text-sm">{{ successMessage }}</p>
      </div>
      <div v-if="errorMessage" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <p class="text-red-800 text-sm">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Info Card -->
    <div class="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
      <div class="flex gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-blue-600 flex-shrink-0">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/>
        </svg>
        <div>
          <h3 class="font-semibold text-blue-900 mb-1">About USDL Tokens</h3>
          <p class="text-sm text-blue-800">
            USDL tokens are used to place bets on sports events. Mint tokens to get started. This is a testnet, so tokens have no real value.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useApp } from '@/composables/useApp'

const { formattedWalletBalance, mintTokens } = useApp()

const amount = ref<number>(100)
const minting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const canMint = computed(() => {
  return amount.value >= 1 && !minting.value
})

async function handleMint() {
  if (!canMint.value) return

  minting.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {

    await mintTokens(amount.value.toString())
    
    successMessage.value = `Successfully minted ${amount.value} USDL tokens!`
    amount.value = 100
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to mint tokens. Please try again.'
  } finally {
    minting.value = false
  }
}
</script>
