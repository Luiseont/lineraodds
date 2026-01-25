export interface LeaderboardPeriod {
    startDate: string
    endDate: string
    weekNumber: number
}

export interface LeaderboardRanking {
    rank: number
    userId: string // ChainId
    totalWagered: string // Amount as string
    totalBets: number
    wonBets: number
    winRate: number // Percentage 0-100
    prize: string // Amount as string
    rankChange?: number // +5, -2, 0, etc. (optional for now)
}

export interface UserLeaderboardStats {
    rank: number
    totalWagered: string
    totalBets: number
    wonBets: number
    winRate: number
}

export interface LeaderboardData {
    period: LeaderboardPeriod
    prizePool: string
    rankings: LeaderboardRanking[]
    winners: any[] // Previous week winners
    userStats: UserLeaderboardStats | null
}

// Mock data generator for development (will be replaced with GraphQL)
export function generateMockLeaderboardData(): LeaderboardData {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const mockAddresses = [
        'e476a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef7f2c4a',
        'b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a9a1e5f',
        'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e3c4d5e',
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9xyz789',
        'd9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1ghi345',
        'k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1a2b3c4d5e6f7nop678',
        'q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9tuv901',
        'w4x5y6z7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1zab234',
        'c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3fgh567',
        'i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1a2b3c4lmn890'
    ]

    const rankings: LeaderboardRanking[] = mockAddresses.map((address, index) => {
        const baseWagered = 15420 - (index * 1200)
        const baseBets = 127 - (index * 5)
        const wonBets = Math.floor(baseBets * (0.65 - index * 0.03))

        return {
            rank: index + 1,
            userId: address,
            totalWagered: baseWagered.toString(),
            totalBets: baseBets,
            wonBets: wonBets,
            winRate: (wonBets / baseBets) * 100,
            prize: index < 3 ? (5000 - index * 1000).toString() : '0',
            rankChange: index === 0 ? 2 : index === 1 ? -1 : 0
        }
    })

    return {
        period: {
            startDate: startOfWeek.toISOString(),
            endDate: endOfWeek.toISOString(),
            weekNumber: Math.ceil(now.getDate() / 7)
        },
        prizePool: '10000',
        rankings,
        winners: [
            {
                userId: 'e476a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef7f2c4a',
                prize: '5000'
            },
            {
                userId: 'b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a9a1e5f',
                prize: '3000'
            },
            {
                userId: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e3c4d5e',
                prize: '2000'
            }
        ],
        userStats: {
            rank: 12,
            totalWagered: '2340',
            totalBets: 45,
            wonBets: 28,
            winRate: 62.22
        }
    }
}
