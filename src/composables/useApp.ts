import { storeToRefs } from 'pinia'
import { appStore } from '@/stores/app'

export function useApp() {
    const store = appStore()
    const { backend, backendReady, isBackendReady, walletBalance, events, userBets } = storeToRefs(store)

    return {
        // Estado (refs reactivos)
        backend,
        backendReady,
        isBackendReady,
        walletBalance,
        events,
        userBets,

        // Funciones
        userBalance: store.getUserBalance,
        subscribeBackend: store.subscribeBackend,
        mintTokens: store.mintTokens,
        placeBet: store.placeBet,
        claimReward: store.claimReward
    }
}