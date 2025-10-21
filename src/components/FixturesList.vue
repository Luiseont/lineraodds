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
import { defineProps } from 'vue';

const props = defineProps<{
  fixtures: Array<{
    id: number;
    teams: { home: string; away: string };
    league: string;
    date: string;
    odds: { home: string; draw: string; away: string };
  }>;
}>();
</script>