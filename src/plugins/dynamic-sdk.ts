// Dynamic JavaScript SDK integration for Vue (no React)
// Provides helpers to create/initialize the client, list providers, connect wallets and access wallet accounts

import {
  createDynamicClient,
  initializeClient,
  getAvailableWalletProvidersData,
  connectWithWalletProvider,
  getWalletAccounts,
  onEvent,
  type WalletAccount,
} from '@dynamic-labs-sdk/client'
import { addEvmExtension } from '@dynamic-labs-sdk/evm'

// Small singleton to avoid multiple initializations
let created = false

function getEnvId(): string {
  // Prefer new env id variable; fallback to old app id if present
  const env = (import.meta as any).env?.VITE_DYNAMIC_ENV_ID || (import.meta as any).env?.VITE_DYNAMIC_APP_ID || "deda20bb-1f3c-4921-8db7-8f522de6f38b";
  if (!env) throw new Error('VITE_DYNAMIC_ENV_ID (or VITE_DYNAMIC_APP_ID) is not set')
  return String(env)
}

export async function ensureDynamicClient() {
  if (created) return
  const client = createDynamicClient({
    environmentId: getEnvId(),
    autoInitialize: true,
    metadata: {
      name: 'LineraOdds',
      url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    },
  })
  // Enable EVM wallets (MetaMask, Coinbase, etc.) and Dynamic embedded EVM
  addEvmExtension(client)
  created = true
}

export async function initDynamicClientManually() {
  await ensureDynamicClient()
  await initializeClient()
}

export async function listWalletProviders() {
  await ensureDynamicClient()
  return getAvailableWalletProvidersData()
}

export async function connectDefaultEvmWallet(): Promise<WalletAccount> {
  await ensureDynamicClient()
  const providers = getAvailableWalletProvidersData()
  // pick first EVM provider
  const evm = providers.find((p) => p.chain === 'EVM')
  if (!evm) throw new Error('No EVM wallet providers available')
  const account = await connectWithWalletProvider({ walletProviderKey: evm.key })
  return account as unknown as WalletAccount
}

export function getPrimaryWalletAccount(): WalletAccount | null {
  const accounts = getWalletAccounts()
  // Prefer first verified EVM account if multiple
  const evmVerified = accounts.find((a) => a.chain === 'EVM' && a.verifiedCredentialId)
  if (evmVerified) return evmVerified
  const evm = accounts.find((a) => a.chain === 'EVM')
  return evm ?? accounts[0] ?? null
}

export async function connectWalletProvider(key: any) {
  await ensureDynamicClient()
  return await connectWithWalletProvider({ walletProviderKey: key })
}

export type { WalletAccount }
