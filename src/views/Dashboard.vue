<template>
  <FixturesList :fixtures="mock"/>
</template>

<script setup lang="ts">
import { watch, computed, onMounted, ref } from 'vue'
import FixturesList from '@/components/FixturesList.vue'
import { useApp } from '@/composables/useApp'
import { useWallet } from '@/composables/useWallet';
const { provider, connected } = useWallet();

/*
import { useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";

const MATCHES = gql`
    { 
        query: matches {
          id,
          league,
          status,
          teams {
            home,
            away
          },
          odds{
            home,
          away
          },
          startTime,
          result{
          winner,
            score
          }
      }
    }
    `;
    
const { result, loading, error } = useQuery(MATCHES);
const fixtures = computed(() => {
    console.log("Result:", result.value);
    return result.value?.query ?? [];
});*/
async function loadFixtures() {
  await provider.value.setApplication("e4df802d09e0477f5f28b80c456175511de700ebd303b6bfeca4322d5a674b8c");

  const graphql_query = '{ "query": "query { matches { id, league, status, teams{ home, away }, odds{ home, away }, startTime, result{ winner, score } } } "  }';
  //const graphql_query =                     '{ "query": "query { value }" }'
  const response = await provider.value.queryApplication(graphql_query);
  console.log("Response:", response);
  console.log("Después del query");
}

watch(connected, (newVal) => {
  if (newVal) {
    loadFixtures();
  }
});

const mock = ref([
  {
    id: 1,
    teams: { home: 'Real Madrid', away: 'Barcelona' },
    league: 'La Liga',
    startTime: Math.floor(new Date('2025-10-26T16:00:00Z').getTime() / 1000),
    odds: { home: (Math.random() * 2 + 1.5).toFixed(2), draw: (Math.random() * 1.5 + 3).toFixed(2), away: (Math.random() * 2.5 + 2).toFixed(2) }
  },
  {
    id: 2,
    teams: { home: 'Manchester United', away: 'Liverpool' },
    league: 'Premier League',
    startTime: Math.floor(new Date('2025-10-25T15:00:00Z').getTime() / 1000),
    odds: { home: (Math.random() * 2 + 1.5).toFixed(2), draw: (Math.random() * 1.5 + 3).toFixed(2), away: (Math.random() * 2.5 + 2).toFixed(2) }
  },
  {
    id: 3,
    teams: { home: 'Bayern Munich', away: 'Borussia Dortmund' },
    league: 'Bundesliga',
    startTime: Math.floor(new Date('2025-10-25T18:30:00Z').getTime() / 1000),
    odds: { home: (Math.random() * 2 + 1.5).toFixed(2), draw: (Math.random() * 1.5 + 3).toFixed(2), away: (Math.random() * 2.5 + 2).toFixed(2) }
  },
  {
    id: 4,
    teams: { home: 'Juventus', away: 'Inter Milan' },
    league: 'Serie A',
    startTime: Math.floor(new Date('2025-10-26T20:45:00Z').getTime() / 1000),
    odds: { home: (Math.random() * 2 + 1.5).toFixed(2), draw: (Math.random() * 1.5 + 3).toFixed(2), away: (Math.random() * 2.5 + 2).toFixed(2) }
  }
]);
</script>