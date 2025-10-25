<template>
  <nav class="bg-primary shadow-md">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center py-3">
        <div class="text-white font-bold text-xl tracking-wide">
          <a href="/">LineraOdds</a>
        </div>
        <button class="sm:hidden inline-flex items-center justify-center p-2 text-white/90 hover:text-white" @click="open = !open" aria-label="Toggle navigation">
          <svg v-if="!open" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
  <div class="hidden sm:flex items-center gap-2">
           <router-link to="/" class="text-white/90 hover:text-white px-3">Sports</router-link>
          <button @click="showWalletModal = !connected" :disabled="connecting" class="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-brand border border-white/20 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
              <path d="M12 1a4 4 0 00-4 4v2H6a3 3 0 00-3 3v7a3 3 0 003 3h12a3 3 0 003-3v-7a3 3 0 00-3-3h-2V5a4 4 0 00-4-4zm-2 6V5a2 2 0 114 0v2h-4z"/>
            </svg>
            <span v-if="connecting" class="animate-pulse">Connecting...</span>
            <span v-else>{{ connected ? shortAddress : 'Connect' }}</span>
          </button>

          <!-- Chevron + dropdown only when connected -->
          <div v-if="connected" class="relative" ref="walletDesktopMenuRef">
            <button @click="toggleWalletDropdown" class="inline-flex items-center justify-center px-2 py-1.5 rounded-brand border border-white/20 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30" aria-haspopup="menu" :aria-expanded="walletOpen ? 'true' : 'false'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clip-rule="evenodd"/>
              </svg>
            </button>
            <div v-show="walletOpen" class="absolute right-0 mt-2 w-48 bg-white text-secondary rounded-lg shadow-card overflow-hidden z-20">
              <router-link @click="walletOpen=false" to="/my-bets" class="block px-4 py-2 hover:bg-gray-50">My Bets</router-link>
              <button @click="doDisconnect" class="w-full text-left block px-4 py-2 hover:bg-gray-50">Disconnect</button>
            </div>
          </div>
        </div>
      </div>
      <div v-show="open" class="sm:hidden pb-3 space-y-1">
        <router-link to="/" class="block text-white/90 hover:text-white py-1.5">Sports</router-link>
        <div class="pt-2">
          <div class="flex items-center gap-2">
            <button @click="showWalletModal = !connected" :disabled="connecting" class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-brand border border-white/20 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M12 1a4 4 0 00-4 4v2H6a3 3 0 00-3 3v7a3 3 0 003 3h12a3 3 0 003-3v-7a3 3 0 00-3-3h-2V5a4 4 0 00-4-4zm-2 6V5a2 2 0 114 0v2h-4z"/>
              </svg>
              <span v-if="connecting" class="animate-pulse">Connecting...</span>
              <span v-else>{{ connected ? shortAddress : 'Connect' }}</span>
            </button>
            <div v-if="connected" class="relative" ref="walletMobileMenuRef">
              <button @click="toggleWalletDropdown" class="inline-flex items-center justify-center px-3 py-2 rounded-brand border border-white/20 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30" aria-haspopup="menu" :aria-expanded="walletOpen ? 'true' : 'false'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clip-rule="evenodd"/>
                </svg>
              </button>
              <div v-show="walletOpen" class="absolute right-0 mt-2 w-full bg-white text-secondary rounded-lg shadow-card overflow-hidden z-20">
                <router-link @click="walletOpen=false" to="/my-bets" class="block px-4 py-2 hover:bg-gray-50">My Bets</router-link>
                <button @click="doDisconnect" class="w-full text-left block px-4 py-2 hover:bg-gray-50">Disconnect</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
  <WalletSelectorModal :is-open="showWalletModal" @close="showWalletModal = false" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useWallet, connect as walletConnect, disconnect as walletDisconnect } from '../composables/useWallet'
import WalletSelectorModal from './WalletSelectorModal.vue'

const open = ref(false)
const walletOpen = ref(false)
const showWalletModal = ref(false)
// dropdown containers to detect outside clicks
const walletDesktopMenuRef = ref<HTMLElement | null>(null)
const walletMobileMenuRef = ref<HTMLElement | null>(null)

// wallet state via composable
const { connected, connecting, address, provider } = useWallet()
const shortAddress = computed(() => address.value ? `${address.value.slice(0,6)}...${address.value.slice(-4)}` : '')

// Connect button: connects only; does not open dropdown
async function onConnectClick(){
  if (!connected.value && !connecting.value) {
    await walletConnect()
  }
}

// Chevron button: toggles dropdown (only if connected)
function toggleWalletDropdown(){
  if (!connected.value) return
  walletOpen.value = !walletOpen.value
}

function closeWallet(){ walletOpen.value = false }

function doDisconnect(){
  walletDisconnect()
  walletOpen.value = false
}

function onClickOutside(e: MouseEvent){
  const target = e.target as HTMLElement
  const inDesktop = walletDesktopMenuRef.value?.contains(target) ?? false
  const inMobile = walletMobileMenuRef.value?.contains(target) ?? false
  if (walletOpen.value && !inDesktop && !inMobile) walletOpen.value = false
}

onMounted(async () => {
  document.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
 
</script>
