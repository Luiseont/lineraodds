<template>
  <FixturesList :fixtures="fixtures"/>
</template>

<script setup lang="ts">
import { watch, computed, onMounted, ref } from 'vue'
import FixturesList from '@/components/FixturesList.vue'
import { useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";
    const MATCHES = gql`
    { 
        query: matches {
        id,
        name,
        time
        }
    }
    `;
    
const { result, loading, error } = useQuery(MATCHES);
const matches = computed(() => {
    return result.value?.query ?? [];
});
  
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