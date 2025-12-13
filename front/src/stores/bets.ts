import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useWallet } from '@/composables/useWallet'
import { useApp } from '@/composables/useApp'

export const betsStore = defineStore('bets', () => {
    // Composables
    const { connected } = useWallet()
    const { backend } = useApp()

    // State
    const userBets = ref<Array<any>>([])
    const allUserBets = ref<Array<any>>([]) // All bets without filters for checking

    // Pagination state
    const currentBetsPage = ref(1)
    const betsPageSize = ref(10) // Fixed at 10 items per page
    const selectedBetStatus = ref<string | undefined>(undefined)

    // Summary state
    const totalStaked = ref('0')
    const potentialWinnings = ref('0')

    // Computed para construir la URL reactivamente

    // Functions
    async function getBetsSummary() {
        try {
            const query = JSON.stringify({
                query: 'query { betsSummary { totalStaked, potentialWinnings } }'
            })

            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("Bets summary:", response.data?.betsSummary)

            if (response.data?.betsSummary) {
                // Convert from attos to tokens (divide by 10^18)
                const staked = BigInt(response.data.betsSummary.totalStaked)
                const winnings = BigInt(response.data.betsSummary.potentialWinnings)

                totalStaked.value = (Number(staked) / 1e18).toString()
                potentialWinnings.value = (Number(winnings) / 1e18).toString()
            }
        } catch (error) {
            console.error('Error al obtener resumen de apuestas:', error)
            totalStaked.value = '0'
            potentialWinnings.value = '0'
        }
    }

    async function getUserBets(status?: string, page: number = 1) {
        try {
            const offset = (page - 1) * betsPageSize.value
            const limit = betsPageSize.value

            // Build simple query with values embedded directly
            let queryStr = 'query { myOdds('
            const params: string[] = []

            if (status) {
                params.push(`status: "${status}"`)
            }
            params.push(`offset: ${offset}`)
            params.push(`limit: ${limit}`)

            queryStr += params.join(', ')
            queryStr += ') { eventId, odd, league, teams{ home, away }, status, startTime, selection, bid, placedAt } }'

            const query = JSON.stringify({ query: queryStr })

            console.log('Fetching bets with query:', query)

            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("Apuestas del usuario:", response.data?.myOdds)
            userBets.value = response.data?.myOdds || []

            // Also fetch summary
            await getBetsSummary()
        } catch (error) {
            console.error('Error al obtener apuestas del usuario:', error)
            userBets.value = []
        }
    }

    // Pagination functions
    function nextBetsPage() {
        currentBetsPage.value++
        getUserBets(selectedBetStatus.value, currentBetsPage.value)
    }

    function previousBetsPage() {
        if (currentBetsPage.value > 1) {
            currentBetsPage.value--
            getUserBets(selectedBetStatus.value, currentBetsPage.value)
        }
    }

    function setBetFilters(status?: string) {
        selectedBetStatus.value = status
        currentBetsPage.value = 1 // Reset to first page
        getUserBets(status, 1)
    }

    async function getAllUserBets() {
        try {
            // Fetch ALL bets without any filters
            const query = JSON.stringify({
                query: 'query { myOdds { eventId, odd, league, teams{ home, away }, status, startTime, selection, bid, placedAt } }'
            })

            console.log('Fetching all user bets (no filters)')

            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("All user bets:", response.data?.myOdds)
            allUserBets.value = response.data?.myOdds || []
        } catch (error) {
            console.error('Error al obtener todas las apuestas del usuario:', error)
            allUserBets.value = []
        }
    }

    function resetBets() {
        userBets.value = []
        allUserBets.value = []
        currentBetsPage.value = 1
        selectedBetStatus.value = undefined
        totalStaked.value = '0'
        potentialWinnings.value = '0'
    }

    watch(() => connected.value, () => {
        if (connected.value) {
            getUserBets()
            getBetsSummary()
            getAllUserBets()
        }
    })

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
        getUserBets,
        getAllUserBets,
        getBetsSummary,
        nextBetsPage,
        previousBetsPage,
        setBetFilters,
        resetBets
    }
})
