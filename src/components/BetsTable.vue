<template>
  <div class="card overflow-x-auto">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-secondary">Próximas Apuestas</h3>
        <span class="badge border-info text-info bg-info-soft">En vivo: {{ liveCount }}</span>
      </div>
      <div class="flex gap-2">
        <select v-model="selectedLeague" class="border rounded px-2 py-1 text-sm">
          <option value="">Todas las ligas</option>
          <option v-for="lg in leagues" :key="lg" :value="lg">{{ lg }}</option>
        </select>
        <input v-model="search" type="text" placeholder="Buscar equipo" class="border rounded px-2 py-1 text-sm" />
      </div>
    </div>
    <table class="min-w-full text-sm">
      <thead class="bg-gray-50 text-gray-600">
        <tr>
          <th class="text-left font-medium px-4 py-2">Liga</th>
          <th class="text-left font-medium px-4 py-2">Partido</th>
          <th class="text-left font-medium px-4 py-2">Fecha</th>
          <th class="text-left font-medium px-4 py-2">1</th>
          <th class="text-left font-medium px-4 py-2">X</th>
          <th class="text-left font-medium px-4 py-2">2</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="fx in filtered" :key="fx.id" class="border-t">
          <td class="px-4 py-3">{{ fx.league }}</td>
          <td class="px-4 py-3">
            <span class="font-medium text-secondary">{{ fx.teams.home }}</span>
            <span class="text-gray-500"> vs </span>
            <span class="font-medium text-secondary">{{ fx.teams.away }}</span>
          </td>
          <td class="px-4 py-3">{{ fx.date }}</td>
          <td class="px-4 py-3"><button class="btn-odds btn-odds-primary">{{ fx.odds.home }}</button></td>
          <td class="px-4 py-3"><button class="btn-odds btn-odds-primary">{{ fx.odds.draw }}</button></td>
          <td class="px-4 py-3"><button class="btn-odds btn-odds-primary">{{ fx.odds.away }}</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const rows = ref([
  { id: 100, league: 'La Liga', teams: { home: 'Real Madrid', away: 'Barcelona' }, date: '2025-10-26 16:00', odds: { home: '1.85', draw: '3.40', away: '3.20' } },
  { id: 101, league: 'Premier League', teams: { home: 'Man City', away: 'Arsenal' }, date: '2025-10-25 16:30', odds: { home: '1.95', draw: '3.60', away: '3.50' } },
  { id: 102, league: 'Bundesliga', teams: { home: 'Bayern', away: 'Dortmund' }, date: '2025-10-25 18:30', odds: { home: '1.75', draw: '3.80', away: '3.90' } },
  { id: 103, league: 'Serie A', teams: { home: 'Juventus', away: 'Inter' }, date: '2025-10-26 20:45', odds: { home: '2.20', draw: '3.20', away: '2.90' } },
])

const leagues = computed(() => Array.from(new Set(rows.value.map(r => r.league))))
const liveCount = computed(() => Math.floor(Math.random() * 5))

const selectedLeague = ref('')
const search = ref('')

const filtered = computed(() => rows.value.filter(r => {
  const leagueOk = !selectedLeague.value || r.league === selectedLeague.value
  const match = `${r.teams.home} ${r.teams.away}`.toLowerCase()
  const term = search.value.trim().toLowerCase()
  const searchOk = !term || match.includes(term)
  return leagueOk && searchOk
}))
</script>
