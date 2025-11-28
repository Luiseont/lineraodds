import { ref, computed, watch, provide } from 'vue'
import { defineStore } from 'pinia'
import { useWallet } from '@/composables/useWallet'

export const appStore = defineStore('app', () => {
    // Estado
    const backend = ref<any | null>(null)
    const backendReady = ref(false)
    const walletBalance = ref(0)
    const events = ref<Array<any>>([])
    const userBets = ref<Array<any>>([])

    // Variables para manejo de notificaciones
    let notificationUnsubscribe: (() => void) | null = null
    let updateTimeout: number | null = null

    // Queries GraphQL
    const eventsQuery = '{ "query": "query { events { id, typeEvent, league, teams{ home, away }, odds{ home, away, tie }, status, startTime, result{ winner, awayScore, homeScore } } } "  }'
    const UserBalanceQuery = '{"query":"query{balance}"}'
    const UserBetsQuery = '{ "query": "query { myOdds { eventId, odd, league, teams{ home, away }, status, startTime, selection, bid, placedAt } } "  }'
    const SubscribeQuery = '{"query":"mutation{subscribe(chainId: \\"83a55222a590b704d0fc5eb248ee9937cade4630b8c44ef12c2c864febc5e0f6\\")}"}'
    const MintTokensQuery = '{"query":"mutation{requestMint(amount: \\"$AMOUNT\\")}"}'
    const processIncomingMessagesQuery = '{"query":"mutation{processIncomingMessages}"}'
    const PlaceBetQuery = '{"query":"mutation{placeBet(home: \\"$HOME\\", away: \\"$AWAY\\", league: \\"$LEAGUE\\", startTime: $START_TIME, odd: $ODD, selection: \\"$SELECTION\\", bid: \\"$BID\\", eventId: \\"$EVENT_ID\\")}"}'
    const ClaimRewardQuery = '{"query":"mutation{claimReward(eventId: \\"$EVENT_ID\\")}"}'

    // Composables
    const { connected, provider } = useWallet()

    // Computed
    const isBackendReady = computed(() => backendReady.value)

    // Funciones
    async function setBackend() {
        if (connected.value && provider.value) {
            try {
                backendReady.value = false

                await provider.value.setApplication('13f97983933aea75637f8ccf30e0efe447205799425ef025dcb8210cbb0ae694')
                backend.value = provider.value.getApplication()
                backendReady.value = true
            } catch (error) {
                console.error('Error al configurar backend:', error)
                backend.value = null
                backendReady.value = false
            }
        }
    }

    function setupNotificationListener() {
        if (!provider.value?.provider?.client) {
            console.warn('Cliente no disponible para notificaciones')
            return
        }

        // Limpiar listener anterior si existe
        cleanupNotificationListener()

        console.log('Configurando listener de notificaciones...')

        // Registrar nuevo listener
        notificationUnsubscribe = provider.value.provider.client.onNotification((notification: any) => {
            console.log('Notificación:', notification)

            // Debounce: esperar 500ms antes de actualizar
            // Si llegan múltiples notificaciones, solo actualizar una vez
            if (updateTimeout) {
                clearTimeout(updateTimeout)
            }

            if (notification.reason.NewBlock) {
                updateTimeout = setTimeout(async () => {
                    console.log('Actualizando datos por notificación...')
                    try {
                        await Promise.all([
                            getEvents(),
                            getUserBalance(),
                            getUserBets()
                        ])
                        console.log('atos actualizados correctamente')
                    } catch (error) {
                        console.error('Error al actualizar datos:', error)
                    }
                }, 500) // 500ms de debounce
            }
        })

        console.log('Listener de notificaciones configurado')
    }

    function cleanupNotificationListener() {
        if (notificationUnsubscribe) {
            console.log('Limpiando listener de notificaciones...')
            notificationUnsubscribe()
            notificationUnsubscribe = null
        }
        if (updateTimeout) {
            clearTimeout(updateTimeout)
            updateTimeout = null
        }
    }

    function resetBackend() {
        cleanupNotificationListener()
        backend.value = null
        backendReady.value = false
        walletBalance.value = 0
        events.value = []
        userBets.value = []
    }

    async function getEvents() {
        try {
            const result = await backend.value.query(eventsQuery)
            const response = JSON.parse(result)
            console.log("Eventos:", response.data?.events)
            events.value = response.data?.events || []
        } catch (error) {
            console.error('Error al obtener eventos:', error)
        }
    }

    async function getUserBets() {
        try {
            const result = await backend.value.query(UserBetsQuery)
            const response = JSON.parse(result)
            console.log("Apuestas del usuario:", response.data?.myOdds)
            userBets.value = response.data?.myOdds || []
        } catch (error) {
            console.error('Error al obtener apuestas del usuario:', error)
        }
    }

    async function getUserBalance() {
        try {
            const result = await backend.value.query(UserBalanceQuery)
            const response = JSON.parse(result)
            console.log("Balance obtenido:", response.data?.balance)
            walletBalance.value = response.data?.balance || 0
        } catch (error) {
            console.error('Error al obtener balance:', error)
            walletBalance.value = 0
        }
    }

    async function subscribeBackend() {
        try {
            console.log("📡 Suscribiendo al backend...")
            const result = await backend.value.query(SubscribeQuery)
            const response = JSON.parse(result)
            console.log("Suscripción exitosa:", response)
        } catch (error) {
            console.error('Error en suscripción:', error)
        }
    }

    async function mintTokens(amount: string) {
        try {
            console.log("Minting tokens...", amount)
            const query = MintTokensQuery.replace('$AMOUNT', amount)
            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("Minting exitoso:", response)

            //receiving messages
            await processMessages();
        } catch (error) {
            console.error('Error en minting:', error)
            throw error
        }
    }

    async function processMessages() {
        try {
            console.log("procesando mensajes..");
            const result = await backend.value.query(processIncomingMessagesQuery)
            const response = JSON.parse(result)
            console.log("Minting new block:", response)
        } catch (error) {
            console.error('Error en minting:', error)
            throw error
        }
    }

    async function placeBet(eventId: string, selection: string, amount: string, event: any) {
        try {
            console.log(`Placing bet on ${eventId} for ${selection} with amount ${amount}`)

            // Determine the odd value based on selection
            let oddValue = 0
            if (selection === 'Home') oddValue = event.odds.home
            else if (selection === 'Away') oddValue = event.odds.away
            else if (selection === 'Tie') oddValue = event.odds.tie

            let query = PlaceBetQuery
                .replace('$HOME', event.teams.home)
                .replace('$AWAY', event.teams.away)
                .replace('$LEAGUE', event.league)
                .replace('$START_TIME', event.startTime.toString())
                .replace('$ODD', oddValue.toString())
                .replace('$SELECTION', selection)
                .replace('$BID', amount)
                .replace('$EVENT_ID', eventId)

            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("Bet placed successfully:", response)

            // Process messages to update state
            await processMessages()
            // Update balance immediately
            await getUserBalance()
            await getUserBets()

        } catch (error) {
            console.error('Error placing bet:', error)
            throw error
        }
    }

    async function claimReward(eventId: string) {
        try {
            console.log(`Claiming reward for event ${eventId}`)
            const query = ClaimRewardQuery.replace('$EVENT_ID', eventId)

            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("Reward claimed successfully:", response)

            await processMessages()
        } catch (error) {
            console.error('Error claiming reward:', error)
            throw error
        }
    }

    // Watchers
    watch(connected, async (newVal) => {
        if (newVal) {
            await setBackend()
        } else {
            resetBackend()
        }
    }, { immediate: true })

    watch(isBackendReady, async (newVal) => {
        if (newVal) {

            await Promise.all([
                subscribeBackend(),
                getUserBalance(),
                getEvents(),
                getUserBets()
            ])

            setupNotificationListener()
        }
    }, { immediate: true })

    return {
        // state
        backend,
        backendReady,
        isBackendReady,
        walletBalance,
        events,
        userBets,

        // functions
        setBackend,
        resetBackend,
        getUserBalance,
        subscribeBackend,
        mintTokens,
        placeBet,
        claimReward
    }
})