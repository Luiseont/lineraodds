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
    const nextBlockHeight = ref(0)

    // Variables para manejo de notificaciones
    let notificationUnsubscribe: (() => void) | null = null
    let subscriptionTimeout: number | null = null

    // Queries GraphQL
    const eventsQuery = '{ "query": "query { blobEvents { id, typeEvent, league, teams{ home, away }, odds{ home, away, tie }, status, startTime, result{ winner, awayScore, homeScore } } } "  }'
    const eventsDataBlobQuery = '{ "query": "query { eventsBlob }" }'
    const UserBalanceQuery = '{"query":"query{balance}"}'
    const UserBetsQuery = '{ "query": "query { myOdds { eventId, odd, league, teams{ home, away }, status, startTime, selection, bid, placedAt } } "  }'
    const SubscribeQuery = '{"query":"mutation{subscribe(chainId: \\"$CHAIN_ID\\")}"}'
    const MintTokensQuery = '{"query":"mutation{requestMint(amount: \\"$AMOUNT\\")}"}'
    const processIncomingMessagesQuery = '{"query":"mutation{processIncomingMessages}"}'
    const PlaceBetQuery = '{"query":"mutation{placeBet(home: \\"$HOME\\", away: \\"$AWAY\\", league: \\"$LEAGUE\\", startTime: $START_TIME, odd: $ODD, selection: \\"$SELECTION\\", bid: \\"$BID\\", eventId: \\"$EVENT_ID\\")}"}'
    const ClaimRewardQuery = '{"query":"mutation{claimReward(eventId: \\"$EVENT_ID\\")}"}'
    const getNextBlockHeightQuery = '{"query":"query{getBlockHeight}"}'

    // Composables
    const { connected, provider, address } = useWallet()

    // Computed
    const isBackendReady = computed(() => backendReady.value)

    // Funciones
    async function setBackend() {
        if (connected.value && provider.value) {
            try {
                backendReady.value = false
                console.log("Setting backend... " + import.meta.env.VITE_APP_ID)
                await provider.value.setApplication(import.meta.env.VITE_APP_ID ?? '184d0769b7365d3d6eb918be93efe042681120ff3e5357af1c19213eb2324f70')
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
        notificationUnsubscribe = provider.value.provider.client.onNotification(async (notification: any) => {
            console.log('Notificación recibida:', notification)

            if (notification.reason.BlockExecuted || notification.reason.NewBlock) {
                scheduleSubscription()
            }

            if (notification.reason.NewIncomingBundle) {
                processMessages()
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
        if (subscriptionTimeout) {
            clearTimeout(subscriptionTimeout)
            subscriptionTimeout = null
        }
    }

    function scheduleSubscription() {
        // Cancelar timeout anterior si existe
        if (subscriptionTimeout) {
            clearTimeout(subscriptionTimeout)
            subscriptionTimeout = null
        }

        // Programar actualización de datos y suscripción después de 5 segundos sin nuevos mensajes
        subscriptionTimeout = setTimeout(async () => {
            console.log('No se recibieron más mensajes, actualizando datos y suscribiendo...')
            try {
                // Actualizar datos primero
                await Promise.all([
                    getUserBalance(),
                    getEvents(),
                    getUserBets(),
                ])
                // Luego suscribir
                await subscribeBackend()
            } catch (error) {
                console.error('Error al actualizar datos o suscribir:', error)
            }
            subscriptionTimeout = null
        }, 2000) // 2 segundos de espera
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
            console.log("Events Response:", response)
            events.value = response.data?.blobEvents || []
        } catch (error) {
            console.error('Error al obtener eventos:', error)
            events.value = []
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
        // Usar la dirección como clave en localStorage
        const subscriptionKey = `isSubscribed_${address.value}`
        let isSubscribed = localStorage.getItem(subscriptionKey)

        if (isSubscribed) {
            console.log(`Wallet ${address.value} ya está suscrita`)
            return
        }

        try {
            console.log(`Suscribiendo wallet ${address.value} al backend...`)
            let query = SubscribeQuery.replace('$CHAIN_ID', import.meta.env.VITE_MAIN_CHAIN_ID ?? '1b21fe8df6c980ead17148966d747f6303cd84e00e50988634fc23b47c1f3cbd')
            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("Suscripción exitosa:", response)
            localStorage.setItem(subscriptionKey, 'true')
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
            console.log("Procesamiento de mensajes exitoso:", response)
        } catch (error) {
            console.error('Error procesando mensajes:', error)
            throw error
        }
    }

    async function getNextBlockHeight() {
        try {
            console.log("Obteniendo siguiente altura de bloque...")
            const result = await backend.value.query(getNextBlockHeightQuery)
            const response = JSON.parse(result)
            console.log("Siguiente altura de bloque obtenida:", response.data?.getBlockHeight)
            nextBlockHeight.value = response.data?.getBlockHeight
        } catch (error) {
            console.error('Error obteniendo siguiente altura de bloque:', error)
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
                getUserBalance(),
                getEvents(),
                getUserBets(),
            ])

            setupNotificationListener()

            // Programar suscripción inicial después de 2 segundos
            scheduleSubscription()
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