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
      <li v-for="fixture in props.fixtures" :key="fixture.id" class="border-b last:border-b-0 py-4 flex justify-between items-center">
        <div>
          <p class="font-semibold">{{ fixture.teams.home }} vs {{ fixture.teams.away }}</p>
          <p class="text-sm text-gray-500">{{ fixture.league }} - {{ formatDate(fixture.startTime) }}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-odds btn-odds-primary">
            {{ formatOdds(fixture.odds.home) }}
          </button>
          <!--<button class="btn-odds btn-odds-primary">
            {{ fixture.odds.draw  }}
          </button>-->
          <button class="btn-odds btn-odds-primary">
            {{ formatOdds(fixture.odds.away) }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  fixtures: Array<{
    id: number;
    teams: { home: string; away: string };
    league: string;
    date?: string;
    startTime: number | string;
    odds: { home: string; draw: string; away: string };
  }>;
}>();

const formatDate = (ts?: number | string) => {
  if (ts == null) return '';
  const n = typeof ts === 'string' ? Number(ts) : ts;
  if (!Number.isFinite(n)) return String(ts);
  const ms = n > 1e12 ? n : n * 1000; // si viene en segundos, conviértelo a ms
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ms));
};

const formatOdds = (v: number | string) => {
  /*const n = typeof v === 'string' ? Number(v) : v
  if (!Number.isFinite(n)) return String(v)
  const sign = n > 100 ? '+' : n < 100 ? '-' : ''
  return `${sign} ${n}`*/
  return (Number(v) / 100).toFixed(2);
}
</script>