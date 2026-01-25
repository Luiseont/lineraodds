import { ref, computed, watch, provide } from 'vue'
import { defineStore } from 'pinia'
import { useWallet } from '@/composables/useWallet'
import { betsStore } from '@/stores/bets'

export const appStore = defineStore('app', () => {
    // Estado
    const backend = ref<any | null>(null)
    const backendReady = ref(false)
    const walletBalance = ref(0)
    const events = ref<Array<any>>([])
    const isTransactionPending = ref(false)

    const AppID = ref(import.meta.env.VITE_APP_ID == "" ? '04ea8a0cd8fe7c648596f404e53e2d90ab7f30df82186b798ecc85e63ebfd353' : import.meta.env.VITE_APP_ID)
    const ChainID = ref(import.meta.env.VITE_MAIN_CHAIN_ID == "" ? '1b21fe8df6c980ead17148966d747f6303cd84e00e50988634fc23b47c1f3cbd' : import.meta.env.VITE_MAIN_CHAIN_ID)

    // Variables para manejo de notificaciones
    let notificationUnsubscribe: (() => void) | null = null
    let subscriptionTimeout: ReturnType<typeof setTimeout> | null = null

    // Queries GraphQL
    const UserBalanceQuery = '{"query":"query{balance}"}'
    const BonusClaimedQuery = '{"query":"query{bonusClaimed}"}'
    const MintTokensQuery = '{"query":"mutation{requestMint(amount: \\"$AMOUNT\\")}"}'
    const PlaceBetQuery = '{"query":"mutation{placeBet(home: \\"$HOME\\", away: \\"$AWAY\\", league: \\"$LEAGUE\\", startTime: $START_TIME, odd: $ODD, selection: \\"$SELECTION\\", bid: \\"$BID\\", eventId: \\"$EVENT_ID\\")}"}'
    const ClaimRewardQuery = '{"query":"mutation{claimReward(eventId: \\"$EVENT_ID\\")}"}'

    // Composables
    const { connected, provider, address } = useWallet()

    // Computed
    const isBackendReady = computed(() => backendReady.value)

    // Helper functions for block height tracking
    function getBlockHeights(): Record<string, { highestHeight: number; lastUpdated: string }> {
        const stored = localStorage.getItem('blockHeights')
        return stored ? JSON.parse(stored) : {}
    }

    function getHighestHeight(userAddress: string): number {
        const heights = getBlockHeights()
        return heights[userAddress]?.highestHeight || 0
    }

    function setHighestHeight(userAddress: string, height: number): void {
        const heights = getBlockHeights()
        heights[userAddress] = {
            highestHeight: height,
            lastUpdated: new Date().toISOString()
        }
        localStorage.setItem('blockHeights', JSON.stringify(heights))
        console.log(`Updated highest height for ${userAddress}: ${height}`)
    }

    function shouldProcessBlock(userAddress: string, height: number): boolean {
        const currentHighest = getHighestHeight(userAddress)
        return height > currentHighest
    }

    // Funciones
    async function setBackend() {
        if (connected.value && provider.value) {
            try {
                backendReady.value = false
                console.log("Setting backend... " + AppID.value)

                // Use LineraAdapter for application setup
                const adapter = (await import('@/plugins/linera-adapter')).lineraAdapter
                await adapter.setApplication(AppID.value)
                backend.value = adapter.getApplication()
                backendReady.value = true
            } catch (error) {
                console.error('Error al configurar backend:', error)
                backend.value = null
                backendReady.value = false
            }
        }
    }

    function setupNotificationListener() {
        if (!provider.value?.client) {
            console.warn('Cliente no disponible para notificaciones')
            return
        }

        // Limpiar listener anterior si existe
        cleanupNotificationListener()

        console.log('Configurando listener de notificaciones...')

        // Registrar nuevo listener
        notificationUnsubscribe = provider.value.chain.onNotification(async (notification: any) => {
            console.log('Notificación recibida:', notification)
            scheduleSubscription()
            /*
            // Extraer información del bloque
            const blockInfo = notification.reason.BlockExecuted || notification.reason.NewBlock

            if (blockInfo) {
                const height = blockInfo.height
                const hash = blockInfo.hash
                // Obtener dirección del usuario actual
                const userAddress = address.value
                console.log("User address: " + userAddress)
                if (height !== undefined && userAddress) {
                    console.log(`Bloque recibido - Height: ${height}, Hash: ${hash?.substring(0, 8)}...`)

                    if (shouldProcessBlock(userAddress, height)) {
                        setHighestHeight(userAddress, height)
                        scheduleSubscription()
                    } else {
                        const currentHighest = getHighestHeight(userAddress)
                        console.log(`Ignorando bloque antiguo (height: ${height} <= ${currentHighest})`)
                    }
                } else {
                    scheduleSubscription()
                }
            }
            */
            if (notification.reason.NewIncomingBundle) {
                getUserBalance()
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

        // Programar actualización de datos
        subscriptionTimeout = setTimeout(async () => {
            if (isTransactionPending.value) {
                console.log("Transacción pendiente, posponiendo actualización de datos...");
                return;
            }

            console.log('No se recibieron más mensajes, actualizando datos y suscribiendo...')
            try {
                // Actualizar datos primero
                await getUserBalance()

                // Actualizar lista completa de apuestas
                const bets = betsStore()
                await bets.fetchAllBets()
            } catch (error) {
                console.error('Error al actualizar datos:', error)
            }
            subscriptionTimeout = null
        }, 1000) // 1 segundo de espera
    }

    function resetBackend() {
        cleanupNotificationListener()
        backend.value = null
        backendReady.value = false
        walletBalance.value = 0
        events.value = []

        // Limpiar sistema viejo de hashes (migración)
        localStorage.removeItem('processedBlockHashes')
        localStorage.removeItem('lastProcessedBlockHash')
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

    async function mintTokens(amount: string) {
        isTransactionPending.value = true
        try {
            console.log("Minting tokens...", amount)
            const query = MintTokensQuery.replace('$AMOUNT', amount)
            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("Minting exitoso:", response)

            // Refresh user balance after successful mint
            await getUserBalance()
        } catch (error) {
            console.error('Error en minting:', error)
            throw error
        } finally {
            isTransactionPending.value = false
        }
    }

    async function placeBet(eventId: string, selection: string, amount: string, event: any) {
        isTransactionPending.value = true
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

            // Refresh user balance after successful bet
            await getUserBalance()

        } catch (error) {
            console.error('Error placing bet:', error)
            throw error
        } finally {
            isTransactionPending.value = false
        }
    }

    async function claimReward(eventId: string) {
        isTransactionPending.value = true
        try {
            console.log(`Claiming reward for event ${eventId}`)
            const query = ClaimRewardQuery.replace('$EVENT_ID', eventId)

            const result = await backend.value.query(query)
            const response = JSON.parse(result)
            console.log("Reward claimed successfully:", response)

            // Refresh user balance after successful claim
            await getUserBalance()
        } catch (error) {
            console.error('Error claiming reward:', error)
            throw error
        } finally {
            isTransactionPending.value = false
        }
    }

    async function checkBonusClaimed(): Promise<boolean> {
        try {
            const result = await backend.value.query(BonusClaimedQuery)
            const response = JSON.parse(result)
            console.log("Bonus claimed status:", response.data?.bonusClaimed)
            return response.data?.bonusClaimed || false
        } catch (error) {
            console.error('Error checking bonus claimed:', error)
            return false
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

            await getUserBalance()

            // Initialize user bets
            const bets = betsStore()
            await bets.fetchAllBets()

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
        AppID,
        ChainID,

        // functions
        setBackend,
        resetBackend,
        getUserBalance,
        mintTokens,
        placeBet,
        claimReward,
        checkBonusClaimed
    }
})