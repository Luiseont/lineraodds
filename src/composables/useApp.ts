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

    async function setBackend() {
        if (connected.value && provider.value) {
            try {
                // setApplication no retorna nada, solo establece this.application internamente
                await provider.value.setApplication('b564e8ceaef07fc919dc188259f6643a9f6414e74c63326238073d11b91adac0')
                // Ahora obtenemos la aplicación del provider
                backend.value = provider.value.getApplication()
                console.log('✅ Backend configurado correctamente')
            } catch (error) {
                console.error('❌ Error al configurar backend:', error)
                backend.value = null
            }
        }
    }

    function resetBackend() {
        backend.value = null
    }

    const isBackendReady = computed(() => backend.value !== null)

    // Watch con immediate: true para ejecutar al montar
    watch(connected, (newVal) => {
        if (newVal) {
            setBackend()
        } else {
            resetBackend()
        }
    }, { immediate: true })

    const events = async () => {
        if (backend.value) {
            const result = await backend.value.query(eventsQuery)
            const response = JSON.parse(result);
            console.log("✅ Response:", response.data?.events);
            return response
        }
        return []
    }

    const userBalance = async () => {
        if (backend.value) {
            const result = await backend.value.query(UserBalanceQuery)
            const response = JSON.parse(result);
            console.log("✅ Response:", response);
            return response.data?.balance
        }
        return 0
    }

    return {
        backend,
        isBackendReady,
        events,
        userBalance
    }
}