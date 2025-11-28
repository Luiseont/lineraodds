<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
    <div class="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
      <!-- Icon -->
      <div class="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-white">
          <path d="M12 1a4 4 0 00-4 4v2H6a3 3 0 00-3 3v7a3 3 0 003 3h12a3 3 0 003-3v-7a3 3 0 00-3-3h-2V5a4 4 0 00-4-4zm-2 6V5a2 2 0 114 0v2h-4z"/>
        </svg>
      </div>
      
      <!-- Title -->
      <h2 class="text-2xl font-bold text-secondary mb-3">
        Connect Your Wallet
      </h2>
      
      <!-- Description -->
      <p class="text-[15px] text-gray-600 mb-8 leading-relaxed">
        Connect your MetaMask wallet to start betting on sports events
      </p>
      
      <!-- Connect Button -->
      <button 
        @click="handleConnect" 
        :disabled="connecting"
        class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-base font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        <svg v-if="!connecting" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path d="M12 1a4 4 0 00-4 4v2H6a3 3 0 00-3 3v7a3 3 0 003 3h12a3 3 0 003-3v-7a3 3 0 00-3-3h-2V5a4 4 0 00-4-4zm-2 6V5a2 2 0 114 0v2h-4z"/>
        </svg>
        <span v-if="connecting" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {{ connecting ? 'Connecting...' : 'Connect Wallet' }}
      </button>
      
      <!-- Error Message -->
      <p v-if="error" class="mt-4 text-red-500 text-sm">
        {{ error }}
      </p>
      
      <!-- Helper Text -->
      <p class="mt-6 text-gray-400 text-[13px]">
        Make sure you have MetaMask installed in your browser
      </p>
    </div>
  </div>
  
  <WalletSelectorModal :is-open="showWalletModal" @close="showWalletModal = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWallet } from '@/composables/useWallet'
import WalletSelectorModal from './WalletSelectorModal.vue'

const { connecting, error } = useWallet()
const showWalletModal = ref(false)

function handleConnect() {
  showWalletModal.value = true
}
</script>
