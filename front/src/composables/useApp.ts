import { storeToRefs } from 'pinia'
import { appStore } from '@/stores/app'

export function useApp() {
    const store = appStore()
    const { backend, backendReady, isBackendReady, walletBalance, events, userBets, AppID, ChainID } = storeToRefs(store)

    return {
        // Estado (refs reactivos)
        backend,
        backendReady,
        isBackendReady,
        walletBalance,
        events,
        userBets,
        AppID,
        ChainID,

        // Funciones
        userBalance: store.getUserBalance,
        mintTokens: store.mintTokens,
        placeBet: store.placeBet,
        claimReward: store.claimReward
    }
}