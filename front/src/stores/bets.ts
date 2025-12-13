import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useApp } from '@/composables/useApp'

export const betsStore = defineStore('bets', () => {
    // Composables
    const { backend } = useApp()

    // State
    const allUserBets = ref<Array<any>>([]) // All bets without filters for checking

    // Pagination state
    const currentBetsPage = ref(1)
    const betsPageSize = ref(10) // Fixed at 10 items per page
    const selectedBetStatus = ref<string | undefined>(undefined)

    // Summary state
    const totalStaked = ref('0')
    const potentialWinnings = ref('0')

    // Computed: Apply status filter to all bets
    const filteredBets = computed(() => {
        let filtered = allUserBets.value

        // Apply status filter
        if (selectedBetStatus.value) {
            filtered = filtered.filter(bet =>
                bet.status.toLowerCase() === selectedBetStatus.value!.toLowerCase()
            )
        }

        return filtered
    })

    // Computed: Apply pagination to filtered bets
    const userBets = computed(() => {
        const start = (currentBetsPage.value - 1) * betsPageSize.value
        const end = start + betsPageSize.value
        return filteredBets.value.slice(start, end)
    })

    // Computed: Total pages based on filtered bets
    const totalBetsPages = computed(() => {
        return Math.ceil(filteredBets.value.length / betsPageSize.value)
    })

    // Computed: Check if there's a next page
    const hasNextBetsPage = computed(() => {
        return currentBetsPage.value < totalBetsPages.value
    })

    // Computed: Check if there's a previous page
    const hasPreviousBetsPage = computed(() => {
        return currentBetsPage.value > 1
    })

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

    async function fetchAllBets() {
        try {
            // Fetch ALL bets without any filters
            const query = JSON.stringify({
                query: 'query { myOdds { eventId, odd, league, teams{ home, away }, status, startTime, selection, bid, placedAt } }'
            })

            console.log('Fetching all user bets (no filters)')

            const result = await backend.value.query(query)
            console.log("Result:", result)
            const response = JSON.parse(result)
            console.log("All user bets:", response.data?.myOdds)
            allUserBets.value = response.data?.myOdds || []

            // Also fetch summary
            await getBetsSummary()
        } catch (error) {
            console.error('Error al obtener apuestas del usuario:', error)
            allUserBets.value = []
        }
    }

    // Pagination functions - now only update state
    function nextBetsPage() {
        if (hasNextBetsPage.value) {
            currentBetsPage.value++
        }
    }

    function previousBetsPage() {
        if (hasPreviousBetsPage.value) {
            currentBetsPage.value--
        }
    }

    function setBetFilters(status?: string) {
        selectedBetStatus.value = status
        currentBetsPage.value = 1 // Reset to first page when filters change
    }

    function resetBets() {
        allUserBets.value = []
        currentBetsPage.value = 1
        selectedBetStatus.value = undefined
        totalStaked.value = '0'
        potentialWinnings.value = '0'
    }

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
        fetchAllBets,
        getBetsSummary,
        nextBetsPage,
        previousBetsPage,
        setBetFilters,
        resetBets
    }
})
