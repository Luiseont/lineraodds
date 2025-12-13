import { storeToRefs } from 'pinia'
import { betsStore } from '@/stores/bets'

export function useBets() {
    const store = betsStore()

    const {
        userBets,
        allUserBets,
        filteredBets,
        currentBetsPage,
        betsPageSize,
        selectedBetStatus,
        totalStaked,
        potentialWinnings,
        totalBetsPages,
        hasNextBetsPage,
        hasPreviousBetsPage
    } = storeToRefs(store)

    return {
        // State
        userBets,
        allUserBets,
        filteredBets,
        currentBetsPage,
        betsPageSize,
        selectedBetStatus,
        totalStaked,
        potentialWinnings,
        totalBetsPages,
        hasNextBetsPage,
        hasPreviousBetsPage,

        // Functions
        fetchAllBets: store.fetchAllBets,
        getBetsSummary: store.getBetsSummary,
        nextBetsPage: store.nextBetsPage,
        previousBetsPage: store.previousBetsPage,
        setBetFilters: store.setBetFilters,
        resetBets: store.resetBets
    }
}
