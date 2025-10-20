<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-secondary">
        <span class="inline-block w-1.5 h-6 bg-primary align-middle mr-2 rounded-sm"></span>
        Football Matches
      </h2>
      <span class="badge border-primary text-primary bg-primary-soft">Football</span>
    </div>
    <ul>
      <li v-for="fixture in fixtures" :key="fixture.id" class="border-b last:border-b-0 py-4 flex justify-between items-center">
        <div>
          <p class="font-semibold">{{ fixture.teams.home }} vs {{ fixture.teams.away }}</p>
          <p class="text-sm text-gray-500">{{ fixture.league }} - {{ fixture.date }}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-odds btn-odds-primary">
            1: {{ fixture.odds.home }}
          </button>
          <button class="btn-odds btn-odds-primary">
            X: {{ fixture.odds.draw }}
          </button>
          <button class="btn-odds btn-odds-primary">
            2: {{ fixture.odds.away }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const fixtures = ref([
  {
    id: 1,
    teams: { home: 'Real Madrid', away: 'Barcelona' },
    league: 'La Liga',
    date: '2025-10-26 16:00',
    odds: { home: (Math.random() * 2 + 1.5).toFixed(2), draw: (Math.random() * 1.5 + 3).toFixed(2), away: (Math.random() * 2.5 + 2).toFixed(2) }
  },
  {
    id: 2,
    teams: { home: 'Manchester United', away: 'Liverpool' },
    league: 'Premier League',
    date: '2025-10-25 15:00',
    odds: { home: (Math.random() * 2 + 1.5).toFixed(2), draw: (Math.random() * 1.5 + 3).toFixed(2), away: (Math.random() * 2.5 + 2).toFixed(2) }
  },
  {
    id: 3,
    teams: { home: 'Bayern Munich', away: 'Borussia Dortmund' },
    league: 'Bundesliga',
    date: '2025-10-25 18:30',
    odds: { home: (Math.random() * 2 + 1.5).toFixed(2), draw: (Math.random() * 1.5 + 3).toFixed(2), away: (Math.random() * 2.5 + 2).toFixed(2) }
  },
  {
    id: 4,
    teams: { home: 'Juventus', away: 'Inter Milan' },
    league: 'Serie A',
    date: '2025-10-26 20:45',
    odds: { home: (Math.random() * 2 + 1.5).toFixed(2), draw: (Math.random() * 1.5 + 3).toFixed(2), away: (Math.random() * 2.5 + 2).toFixed(2) }
  }
]);
</script>