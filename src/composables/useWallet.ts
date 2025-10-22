import { ref } from 'vue'
import { LineraAdapter } from '@/plugins/linera-adapter'
import { ensureDynamicClient, connectDefaultEvmWallet, getPrimaryWalletAccount } from '@/plugins/dynamic-sdk'


const connected = ref(false)
const connecting = ref(false)
const address = ref<string | null>(null)
const chainId = ref<string | null>(null)
const error = ref<string | null>(null)

// Keep SDK objects and keys only in-memory (ephemeral)
const providerRef = ref<any | null>(null)

const faucetUrl = (import.meta as any).env?.VITE_LINERA_FAUCET_URL ?? 'https://faucet.testnet-conway.linera.net'



export async function connect() {
  if (connected.value || connecting.value) return
  error.value = null
  connecting.value = true
  try {
    await ensureDynamicClient()
    await connectDefaultEvmWallet()
    const walletAccount = getPrimaryWalletAccount()
    if (!walletAccount) throw new Error('No wallet account available after connection')
    await LineraAdapter.getInstance().connect(walletAccount, faucetUrl)

    // Store provider objects for app-wide use
    address.value = LineraAdapter.getInstance().getProvider().address
    chainId.value = LineraAdapter.getInstance().getProvider().chainId
    providerRef.value = LineraAdapter.getInstance() 
    connected.value = true
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    connected.value = false
    chainId.value = null
    console.log('Error connecting to Linera:', e)
  } finally {
    connecting.value = false
  }
}

export function disconnect() {
  connected.value = false
  connecting.value = false
  address.value = null
  chainId.value = null
  error.value = null
  providerRef.value = null
  LineraAdapter.getInstance().reset()
}



export function useWallet() {
  return {
    connected,
    connecting,
    address,
    chainId,
    error,
    connect,
    disconnect,
    provider: providerRef
  }
}