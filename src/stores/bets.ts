import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type BetStatus = 'activa' | 'cerrada' | 'liquidada'

export interface BetItem {
  id: number
  league: string
  match: string // e.g., "Real Madrid vs Barcelona"
  selection: '1' | 'X' | '2'
  odds: number // decimal odds
  stake: number // amount staked
  status: BetStatus
  date: string
  live?: boolean
  minute?: number
}

export const useBetsStore = defineStore('bets', () => {
  const bets = ref<BetItem[]>([
    { id: 1, league: 'La Liga', match: 'Real Madrid vs Barcelona', selection: '1', odds: 1.85, stake: 25, status: 'activa', date: '2025-10-26 16:00', live: false, minute: 0 },
    { id: 2, league: 'Premier League', match: 'Man City vs Arsenal', selection: 'X', odds: 3.60, stake: 15, status: 'activa', date: '2025-10-25 16:30', live: false, minute: 0 },
    { id: 3, league: 'Serie A', match: 'Juventus vs Inter', selection: '2', odds: 2.90, stake: 10, status: 'activa', date: '2025-10-26 20:45', live: false, minute: 0 },
  ])

  const totalStake = computed(() => bets.value.reduce((acc, b) => acc + b.stake, 0))
  const totalPotential = computed(() => bets.value.reduce((acc, b) => acc + (b.stake * b.odds), 0))
  const liveCount = computed(() => bets.value.filter(b => b.live).length)

  function updateLiveStatus(nowTs?: number) {
    const now = nowTs ?? Date.now()
    for (const b of bets.value) {
      const start = new Date(b.date).getTime()
      if (Number.isNaN(start)) continue
      const durationMs = 110 * 60 * 1000 // 110 minutos con descuentos
      const end = start + durationMs
      if (now >= start && now < end) {
        b.live = true
        const min = Math.max(0, Math.floor((now - start) / 60000))
        b.minute = Math.min(min, 110)
        // Ajuste leve de cuotas en vivo (simulado)
        const jitter = (Math.random() - 0.5) * 0.08 // +-0.04 aprox
        b.odds = Number(Math.max(1.2, b.odds * (1 + jitter)).toFixed(2))
      } else {
        b.live = false
        b.minute = now >= end ? 110 : 0
        // Si ya terminó y seguía activa, márcala cerrada (simulado)
        if (now >= end && b.status === 'activa') b.status = 'cerrada'
      }
    }
  }

  function addBet(bet: BetItem) {
    bets.value.unshift(bet)
  }

  return { bets, totalStake, totalPotential, liveCount, updateLiveStatus, addBet }
})
