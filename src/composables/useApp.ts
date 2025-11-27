import { storeToRefs } from 'pinia'
import { appStore } from '@/stores/app'
import { computed, watch, ref } from 'vue'
import { useWallet } from '@/composables/useWallet'

export function useApp() {
    const store = appStore()
    const { backend } = storeToRefs(store)
    const { connected, provider } = useWallet()
    const eventsQuery = '{ "query": "query { events { id, typeEvent, league, teams{ home, away }, odds{ home, away, tie }, status, startTime, result{ winner, awayScore, homeScore } } } "  }';
    const UserBalanceQuery = '{"query":"query{balance}"}';
    const SubscribeQuery = '{"query":"mutation{subscribe(chainId: \\"83a55222a590b704d0fc5eb248ee9937cade4630b8c44ef12c2c864febc5e0f6\\")}"}'; const walletBalance = ref(0)


    async function setBackend() {
        if (connected.value && provider.value) {
            try {
                await provider.value.setApplication('dd235647d426d6593b9e2dc04c3af49cf39d23efd6ba385107812e9c2640e9c6')
                backend.value = provider.value.getApplication()
                console.log('✅ Backend configurado correctamente')
            } catch (error) {
                console.error('❌ Error al configurar backend:', error)
                backend.value = null
            }
        }
    }

    async function subscribeBackend() {
        if (backend.value) {
            const result = await backend.value.query(SubscribeQuery)
            const response = JSON.parse(result);
            console.log("✅ Response:", response);
        } else {
            console.log("❌ Backend no configurado")
        }
    }

    function resetBackend() {
        backend.value = null
    }

    const isBackendReady = computed(() => backend.value !== null)


    watch(connected, (newVal) => {
        if (newVal) {
            setBackend()
            subscribeBackend()
        } else {
            resetBackend()
        }
    }, { immediate: true })

    watch(isBackendReady, (newVal) => {
        if (newVal) {
            subscribeBackend()
        }
    }, { immediate: true })

    const events = async () => {
        if (backend.value) {
            const result = await backend.value.query(eventsQuery)
            const response = JSON.parse(result);
            console.log("✅ Response:", response.data?.events);
            return response.data?.events
        }
        return []
    }

    const userBalance = async () => {
        if (backend.value) {
            const result = await backend.value.query(UserBalanceQuery)
            const response = JSON.parse(result);
            console.log("✅ Response:", response);
            walletBalance.value = response.data?.balance
        }
    }

    return {
        backend,
        isBackendReady,
        walletBalance,
        events,
        userBalance
    }
}