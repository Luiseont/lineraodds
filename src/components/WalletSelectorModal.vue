<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs" @click.self="close">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Select Wallet</h2>
        <div class="space-y-3">
          <button
            v-for="provider in providers"
            :key="provider.key"
            @click="connect(provider.key)"
            :disabled="connecting"
            class="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <div class="flex items-center space-x-3">
              <img v-if="provider.metadata?.icon" :src="provider.metadata.icon" :alt="provider.metadata.displayName" class="w-8 h-8 rounded-full" />
              <p class="text-gray-900 font-medium">{{ provider.metadata?.displayName || provider.name }}</p>
            </div>
            <svg v-if="connecting && selectedProvider === provider.key" class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </div>
        <button @click="close" class="mt-4 w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500">
          Cancel
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listWalletProviders, connectWalletProvider } from '@/plugins/dynamic-sdk'
import { useWallet } from '@/composables/useWallet'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const providers = ref<any[]>([])
const connecting = ref(false)
const selectedProvider = ref<string | null>(null)
const { connect: walletConnect } = useWallet()

onMounted(async () => {
  try {
    providers.value = await listWalletProviders()
    console.log('Available wallet providers:', providers.value)
  } catch (error) {
    console.error('Failed to load wallet providers:', error)
  }
})

const connect = async (key: string) => {
  connecting.value = true
  selectedProvider.value = key
  try {
    await connectWalletProvider(key)
    // After connection, trigger the main wallet connect flow
    await walletConnect()
    close()
  } catch (error) {
    console.error('Failed to connect wallet:', error)
  } finally {
    connecting.value = false
    selectedProvider.value = null
  }
}

const close = () => {
  emit('close')
}
</script>