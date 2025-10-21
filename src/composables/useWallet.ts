import { ref } from 'vue'
import * as linera from '@linera/client'
import * as signerLinera from '@linera/signer';

const connected = ref(false)
const connecting = ref(false)
const address = ref<string | null>(null)
const chainId = ref<string | null>(null)
const error = ref<string | null>(null)

// Keep SDK objects and keys only in-memory (ephemeral)
const faucetClient = ref<any | null>(null)
const walletRef = ref<any | null>(null)
const clientRef = ref<any | null>(null)

const faucetUrl = (import.meta as any).env?.VITE_LINERA_FAUCET_URL ?? 'https://faucet.testnet-conway.linera.net'

async function createFaucetClient() {
  if (!faucetClient.value) {
    faucetClient.value = await new linera.Faucet(faucetUrl)
  }
}

export async function connect() {
  if (connected.value || connecting.value) return
  error.value = null
  connecting.value = true
  try {
    await createFaucetClient()
    const signer = await new signerLinera.MetaMask()
    const wallet = await faucetClient.value.createWallet()
    const owner = await signer.address();
    const claim = await faucetClient.value.claimChain(wallet, owner)
    clientRef.value = await new linera.Client(wallet, signer, true);
    address.value =
      (typeof owner === 'string' && owner) ||
      (typeof wallet?.address === 'string' && wallet.address) ||
      null

    connected.value = true
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    connected.value = false
    walletRef.value = null
    clientRef.value = null
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
  walletRef.value = null
  clientRef.value = null
}

export async function LineraDefault() {
    console.log('setting linera default');
    await linera.default();
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
    LineraDefault,
    wallet: walletRef,
    client: clientRef
  }
}