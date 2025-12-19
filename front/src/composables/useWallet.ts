import { ref } from 'vue'
import { LineraAdapter } from '@/plugins/linera-adapter'
import { getPrimaryWalletAccount } from '@/plugins/dynamic-sdk'
import {
  signMessage,
  type WalletProviderMethodUnavailableError
} from '@dynamic-labs-sdk/client';


const connected = ref(false)
const connecting = ref(false)
const address = ref<string | null>(null)
const chainId = ref<string | null>(null)
const error = ref<string | null>(null)

const providerRef = ref<any | null>(null)
const faucetUrl = (import.meta as any).env?.VITE_FAUCET_URL == "" ? 'https://faucet.testnet-conway.linera.net' : (import.meta as any).env?.VITE_FAUCET_URL

export async function connect(key?: string) {
  if (connected.value || connecting.value) return
  error.value = null
  connecting.value = true

  console.log('🔄 Iniciando conexión a Linera...')
  console.log('📍 Faucet URL:', faucetUrl)

  try {
    const walletAccount = getPrimaryWalletAccount()
    if (!walletAccount) throw new Error('No wallet account available after connection')
    // Intentar conectar con timeout
    const connectPromise = LineraAdapter.getInstance().connect(walletAccount, faucetUrl)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout after 60s')), 60000)
    )

    await Promise.race([connectPromise, timeoutPromise])

    address.value = LineraAdapter.getInstance().getProvider().address
    chainId.value = LineraAdapter.getInstance().getProvider().chainId
    console.log("✅ Conectado! Chain ID:", chainId.value)
    console.log("✅ Address:", address.value)

    providerRef.value = LineraAdapter.getInstance().getProvider()
    connected.value = true
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    connected.value = false
    chainId.value = null
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
    faucetUrl,
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