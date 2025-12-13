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

    //vars here
    const events = ref<Array<any>>([])

    // Pagination state
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

    // GraphQL queries
    const EVENTS_QUERY = gql`
        query Events($status: String, $typeEvent: String, $offset: Int, $limit: Int) {
          events(status: $status, typeEvent: $typeEvent, offset: $offset, limit: $limit) {
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
            }
          }
        }
    `;

    const NOTIFICATIONS_SUBSCRIPTION = gql`
        subscription Notifications($chainId: ID!) {
            notifications(chainId: $chainId)
        }
    `;

    async function getEvents(status?: string, typeEvent?: string, page: number = 1) {
        try {
            const offset = (page - 1) * pageSize.value

            console.log('Fetching events with filters:', { status, typeEvent, offset, limit: pageSize.value })

            const response = await fetch(AppChainUrl.value, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: EVENTS_QUERY.loc?.source.body || '',
                    variables: {
                        status,
                        typeEvent,
                        offset,
                        limit: pageSize.value
                    }
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

            events.value = data.data?.events || [];
            console.log('Events loaded:', events.value.length);
        } catch (error) {
            console.error('Error fetching events:', error);
            events.value = [];
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

            // Cargar eventos con filtro inicial de SCHEDULED
            setFilters('Scheduled');

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
                    getEvents(selectedStatus.value, selectedTypeEvent.value, currentPage.value);
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
        events.value = [];
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
            events.value = [];
        }
    }, { immediate: true })

    // Configurar listeners del navegador
    setupBrowserCleanup();

    // Inicializar inmediatamente si ya está conectado
    initialize();

    // Pagination functions
    function nextPage() {
        currentPage.value++
        getEvents(selectedStatus.value, selectedTypeEvent.value, currentPage.value)
    }

    function previousPage() {
        if (currentPage.value > 1) {
            currentPage.value--
            getEvents(selectedStatus.value, selectedTypeEvent.value, currentPage.value)
        }
    }

    function setFilters(status?: string, typeEvent?: string) {
        selectedStatus.value = status
        selectedTypeEvent.value = typeEvent
        currentPage.value = 1 // Reset to first page
        getEvents(status, typeEvent, 1)
    }

    return {
        events,
        currentPage,
        pageSize,
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