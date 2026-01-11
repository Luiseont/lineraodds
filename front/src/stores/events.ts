import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useWallet } from '@/composables/useWallet'
import { useApp } from '@/composables/useApp'
import { createApolloClient } from '@/plugins/apollo-client'
import gql from 'graphql-tag'

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

    function startNotificationSubscription() {
        try {
            // Crear Apollo Client si no existe
            if (!apolloClient) {
                const httpUrl = `${WsUrl}/ws`;
                const wsUrl = httpUrl.replace('http://', 'ws://').replace('https://', 'wss://');

                console.log('Creating Apollo Client');
                console.log('HTTP URL:', httpUrl);
                console.log('WS URL:', wsUrl);

                apolloClient = createApolloClient(httpUrl, wsUrl);
            }

            // Si ya hay una subscription activa, no crear otra
            if (notificationSubscription) {
                console.log('Notification subscription already active');
                return;
            }

            console.log('Starting notification subscription for chain:', ChainID.value);

            // Suscribirse a notificaciones
            notificationSubscription = apolloClient.subscribe({
                query: NOTIFICATIONS_SUBSCRIPTION,
                variables: {
                    chainId: ChainID.value
                }
            }).subscribe({
                next: (result: any) => {
                    console.log('Notification received:', result);
                    // Cuando llega una notificación, recargar eventos
                    console.log('Refreshing events due to notification...');
                    getEvents();
                },
                error: (error: any) => {
                    console.error('Subscription error:', error);
                    // Si falla la subscription, no hacer nada (los eventos ya se cargaron)
                },
                complete: () => {
                    console.log('Subscription completed');
                }
            });

        } catch (error) {
            console.error('Error setting up notification subscription:', error);
            // Si falla, al menos tenemos los eventos cargados inicialmente
        }
    }

    function stopNotificationSubscription() {
        if (notificationSubscription) {
            console.log('Stopping notification subscription');
            notificationSubscription.unsubscribe();
            notificationSubscription = null;
        }
    }

    function cleanup() {
        stopNotificationSubscription();
        // Limpiar lista de eventos
        allEvents.value = [];
        // Limpiar Apollo Client para forzar recreación en próxima conexión
        if (apolloClient) {
            apolloClient = null;
        }
    }

    // Función para inicializar la suscripción si ya está conectado
    function initialize() {
        if (connected.value && !notificationSubscription) {
            console.log('Initializing subscription (already connected)');
            startNotificationSubscription();
        }
    }

    // Limpiar cuando se cierra el navegador o la pestaña
    function setupBrowserCleanup() {
        // Cuando se cierra el navegador/pestaña
        window.addEventListener('beforeunload', () => {
            console.log('Browser closing, cleaning up subscription');
            cleanup();
        });
        /*
        // Cuando la pestaña se oculta (cambio de pestaña, minimizar)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden, cleaning up subscription');
                cleanup();
            } else if (connected.value) {
                console.log('Page visible again, reinitializing subscription');
                initialize();
            }
        });*/

        // Evento adicional para cuando se descarga la página
        window.addEventListener('pagehide', () => {
            console.log('Page hiding, cleaning up subscription');
            cleanup();
        });
    }

    watch(connected, async (newVal) => {
        if (newVal) {
            // Solo iniciar si no hay suscripción activa
            if (!notificationSubscription) {
                startNotificationSubscription();
            }
        } else {
            // Solo limpiar cuando se desconecta
            cleanup();
        }
    }, { immediate: true })

    // Configurar listeners del navegador
    setupBrowserCleanup();

    // Inicializar inmediatamente si ya está conectado
    initialize();

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
        startNotificationSubscription,
        stopNotificationSubscription,
        initialize,
        cleanup
    }
})