import gql from 'graphql-tag'
import { useWebSubscriptionStore } from '@/stores/webSubscription'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { LeaderboardData, LeaderboardRanking } from '@/types/leaderboard'
import { useApp } from '@/composables/useApp'

// GraphQL Query
const LEADERBOARD_QUERY = gql`
    query Leaderboard {
        leaderboard {
            week
            year
            prizePool
            winners
            userStats
        }
    }
`

export function useLeaderboard() {
    const { AppID, ChainID } = useApp()
    const WsUrl = import.meta.env.VITE_APP_SERVICE == '' ? 'http://localhost:8081' : import.meta.env.VITE_APP_SERVICE

    const leaderboardData = ref<LeaderboardData | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Computed para construir la URL
    const AppChainUrl = computed(() =>
        `${WsUrl}/chains/${ChainID.value}/applications/${AppID.value}`
    )

    // Helper: Calculate current week period
    function getCurrentWeekPeriod() {
        const now = new Date()

        // Start of week (Sunday 00:00:00)
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)

        // End of week (Saturday 23:59:59.999)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        return {
            startDate: startOfWeek.toISOString(),
            endDate: endOfWeek.toISOString(),
            weekNumber: Math.ceil(now.getDate() / 7)
        }
    }

    // Transform backend data to frontend format
    function transformLeaderboardData(backendData: any): LeaderboardData {
        const { week, year, prizePool, userStats, winners } = backendData

        // Create a map of winners for quick lookup
        const winnersMap = new Map<string, string>()
        let latestWinners: any[] = []

        // Handle winners data (HashMap from backend, Object in JS)
        if (winners && typeof winners === 'object' && !Array.isArray(winners)) {
            const keys = Object.keys(winners);
            if (keys.length > 0) {
                // Sort keys to find latest: "2026-4" > "2026-3"
                keys.sort((a, b) => {
                    const partsA = a.split('-').map(Number);
                    const partsB = b.split('-').map(Number);

                    if (partsA.length < 2 || partsB.length < 2) return 0;

                    const yearA = partsA[0];
                    const weekA = partsA[1];
                    const yearB = partsB[0];
                    const weekB = partsB[1];

                    if (yearA !== yearB) return yearB - yearA;
                    return weekB - weekA;
                });
                const latestKey = keys[0];
                if (latestKey) {
                    latestWinners = winners[latestKey] || [];
                }
            }
        } else if (Array.isArray(winners)) {
            latestWinners = winners;
        }

        // Process winners for the banner and map
        const processedWinners = latestWinners.map((winner: any) => ({
            userId: winner.user || winner.userId,
            prize: winner.prize || '0',
            rank: winner.rank || 0
        }));

        processedWinners.forEach((winner: any) => {
            winnersMap.set(winner.userId, winner.prize)
        })

        // Convert userStats HashMap to sorted rankings array
        const rankings: LeaderboardRanking[] = Object.entries(userStats || {})
            .map(([userId, stats]: [string, any]) => ({
                rank: 0, // Will be set after sorting
                userId,
                totalWagered: stats.total_staked || '0',
                totalBets: stats.total_bets || 0,
                wonBets: stats.total_wins || 0,
                winRate: stats.win_rate || 0,
                prize: winnersMap.get(userId) || '0' // Only set prize if user is in winners
            }))
            .sort((a, b) => Number(b.totalWagered) - Number(a.totalWagered))
            .map((item, index) => ({ ...item, rank: index + 1 }))

        return {
            period: getCurrentWeekPeriod(),
            prizePool: prizePool || '0',
            rankings,
            winners: processedWinners || [],
            userStats: null // TODO: Get current user stats if needed
        }
    }

    // Fetch leaderboard data
    async function fetchLeaderboard(silent = false) {
        if (!silent) {
            isLoading.value = true
        }
        error.value = null

        try {
            const response = await fetch(AppChainUrl.value, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: LEADERBOARD_QUERY.loc?.source.body || '',
                    variables: {}
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            // console.log('Leaderboard response:', data)

            if (data.errors) {
                console.error('GraphQL errors:', data.errors)
                throw new Error(data.errors[0]?.message || 'GraphQL error')
            }

            const backendData = data.data?.leaderboard
            if (backendData) {
                leaderboardData.value = transformLeaderboardData(backendData)
            } else {
                leaderboardData.value = null
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch leaderboard'
            console.error('Error fetching leaderboard:', err)
        } finally {
            if (!silent) {
                isLoading.value = false
            }
        }
    }

    // Computed properties
    const topThree = computed(() => {
        if (!leaderboardData.value) return []
        const rankings = leaderboardData.value.rankings

        // Always return 3 positions, padding with placeholders if needed
        const result: LeaderboardRanking[] = []
        for (let i = 0; i < 3; i++) {
            const ranking = rankings[i]
            if (ranking) {
                result.push(ranking)
            } else {
                // Placeholder for empty position
                result.push({
                    rank: i + 1,
                    userId: '',
                    totalWagered: '0',
                    totalBets: 0,
                    wonBets: 0,
                    winRate: 0,
                    prize: '0'
                })
            }
        }
        return result
    })

    const restOfRankings = computed(() => {
        if (!leaderboardData.value) return []
        const rankings = leaderboardData.value.rankings

        // Always return positions 4-10, padding with placeholders if needed
        const result: LeaderboardRanking[] = []
        for (let i = 3; i < 10; i++) {
            const ranking = rankings[i]
            if (ranking) {
                result.push(ranking)
            } else {
                // Placeholder for empty position
                result.push({
                    rank: i + 1,
                    userId: '',
                    totalWagered: '0',
                    totalBets: 0,
                    wonBets: 0,
                    winRate: 0,
                    prize: '0'
                })
            }
        }
        return result
    })

    const userStats = computed(() => {
        return leaderboardData.value?.userStats || null
    })

    const period = computed(() => {
        return leaderboardData.value?.period || null
    })

    const prizePool = computed(() => {
        return leaderboardData.value?.prizePool || '0'
    })

    // Timer for reactive countdown
    const now = ref(new Date())
    let timer: ReturnType<typeof setInterval> | null = null

    // Start timer when composable is used (mounted)
    onMounted(() => {
        now.value = new Date() // Sync immediately
        timer = setInterval(() => {
            now.value = new Date()
        }, 1000)
    })

    onUnmounted(() => {
        if (timer) {
            clearInterval(timer)
            timer = null
        }
    })

    // Calculate time remaining until end of week
    const timeRemaining = computed(() => {
        if (!period.value) return 0
        const endDate = new Date(period.value.endDate)
        // Use reactive 'now'
        const remaining = endDate.getTime() - now.value.getTime()
        return Math.max(0, remaining)
    })

    const winners = computed(() => {
        return leaderboardData.value?.winners || []
    })

    function getUserRanking(userAddress: string) {
        if (!leaderboardData.value) return null
        return leaderboardData.value.rankings.find(r => r.userId === userAddress) || null
    }

    const webSubscription = useWebSubscriptionStore()

    // Register listener for real-time updates
    webSubscription.registerListener(() => {
        console.log('Leaderboard: Notification received, refreshing data...')
        fetchLeaderboard(true)
    })

    return {
        leaderboardData,
        isLoading,
        error,
        topThree,
        restOfRankings,
        userStats,
        period,
        prizePool,
        timeRemaining,
        winners,
        getUserRanking,
        fetchLeaderboard
    }
}
