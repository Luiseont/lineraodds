import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useWallet } from '@/composables/useWallet'
import { useApp } from '@/composables/useApp'
import { createApolloClient } from '@/plugins/apollo-client'
import gql from 'graphql-tag'
import { useWebSubscriptionStore } from './webSubscription'

export const eventsStore = defineStore('events', () => {
    // Composables
    const { connected } = useWallet()
    const { AppID, ChainID } = useApp()
    const WsUrl = import.meta.env.VITE_APP_SERVICE == '' ? 'http://localhost:8081' : import.meta.env.VITE_APP_SERVICE

    // State - all events fetched from backend
    const allEvents = ref<Array<any>>([])

    // Pagination and filter state
    const currentPage = ref(1)
    const pageSize = ref(10) // Fixed at 10 items per page
    const selectedStatus = ref<string | undefined>(undefined)
    const selectedTypeEvent = ref<string | undefined>(undefined)

    // Computed para construir la URL reactivamente
    const AppChainUrl = computed(() =>
        `${WsUrl}/chains/${ChainID.value}/applications/${AppID.value}`
    );

    // Apollo Client y subscription
    let apolloClient: any = null;
    let notificationSubscription: any = null;

    // GraphQL queries - simplified to fetch all events
    const EVENTS_QUERY = gql`
        query Events {
          events {
            id
            typeEvent
            league
            teams {
              home
              away
            }
            odds {
              home
              away
              tie
            }
            status
            startTime
            result {
              winner
              awayScore
              homeScore
            },
            matchEvents {
                eventType,
                time,
                team,
                player,
                detail,
                timestamp
            },
            liveScore{
                home,
                away
                updatedAt
            },
            lastUpdated,
            currentMinute
          }
        }
    `;

    const NOTIFICATIONS_SUBSCRIPTION = gql`
        subscription Notifications($chainId: ID!) {
            notifications(chainId: $chainId)
        }
    `;

    // Computed: Apply filters to all events
    const filteredEvents = computed(() => {
        let filtered = allEvents.value

        // Apply status filter
        if (selectedStatus.value) {
            filtered = filtered.filter(event =>
                event.status.toLowerCase() === selectedStatus.value!.toLowerCase()
            )
        }

        // Apply type event filter
        if (selectedTypeEvent.value) {
            filtered = filtered.filter(event =>
                event.typeEvent.toLowerCase() === selectedTypeEvent.value!.toLowerCase()
            )
        }

        return filtered
    })

    // Computed: Apply pagination to filtered events
    const events = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        return filteredEvents.value.slice(start, end)
    })

    // Computed: Total pages based on filtered events
    const totalPages = computed(() => {
        return Math.ceil(filteredEvents.value.length / pageSize.value)
    })

    // Computed: Check if there's a next page
    const hasNextPage = computed(() => {
        return currentPage.value < totalPages.value
    })

    // Computed: Check if there's a previous page
    const hasPreviousPage = computed(() => {
        return currentPage.value > 1
    })

    async function getEvents() {
        try {
            console.log('Fetching all events (no filters)')

            const response = await fetch(AppChainUrl.value, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: EVENTS_QUERY.loc?.source.body || '',
                    variables: {}
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.errors) {
                console.error('GraphQL errors:', data.errors);
                return;
            }

            allEvents.value = data.data?.events || [];
            console.log('All events loaded:', allEvents.value.length);
        } catch (error) {
            console.error('Error fetching events:', error);
            allEvents.value = [];
        }
    }

    const webSubscription = useWebSubscriptionStore()

    // Register simple listener to reload events
    webSubscription.registerListener(() => {
        console.log('EventStore: Notification received, reloading events...')
        getEvents()
    })

    // Initial fetch if connected
    watch(connected, (isConnected) => {
        if (isConnected) {
            getEvents()
        }
    })

    // Fetch immediately for public access
    getEvents()

    // No internal Cleanup needed for this store's subscription logic anymore since it delegates to webSubscription

    // Pagination functions - now only update state
    function nextPage() {
        if (hasNextPage.value) {
            currentPage.value++
        }
    }

    function previousPage() {
        if (hasPreviousPage.value) {
            currentPage.value--
        }
    }

    function setFilters(status?: string, typeEvent?: string) {
        selectedStatus.value = status
        selectedTypeEvent.value = typeEvent
        currentPage.value = 1 // Reset to first page when filters change
    }

    return {
        events,
        allEvents,
        filteredEvents,
        currentPage,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        selectedStatus,
        selectedTypeEvent,
        getEvents,
        nextPage,
        previousPage,
        setFilters,
        cleanup: () => {
            allEvents.value = []
        }
    }
})