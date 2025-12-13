import { storeToRefs } from 'pinia'
import { betsStore } from '@/stores/bets'

export function useBets() {
    const store = betsStore()

    const {
        userBets,
        allUserBets,
        currentBetsPage,
        betsPageSize,
        selectedBetStatus,
        totalStaked,
        potentialWinnings
    } = storeToRefs(store)

    return {
        // State
        userBets,
        allUserBets,
        currentBetsPage,
        betsPageSize,
        selectedBetStatus,
        totalStaked,
        potentialWinnings,

        // Functions
        getUserBets: store.getUserBets,
        getAllUserBets: store.getAllUserBets,
        getBetsSummary: store.getBetsSummary,
        nextBetsPage: store.nextBetsPage,
        previousBetsPage: store.previousBetsPage,
        setBetFilters: store.setBetFilters,
        resetBets: store.resetBets
    }
}
