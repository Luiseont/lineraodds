import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useWallet } from '@/composables/useWallet'
export const appStore = defineStore('app', () => {
    const { connected, client } = useWallet()
    const backend = ref<any | null>(null)

    async function setBackend()
    {
        if (connected.value && client.value) {
            backend.value = await client.value.frontend().application('c4c4e25784d37e4a583bea83c3c2cb5b156a8783967094eeda8018342196ae85');
        }   
    }

    function resetBackend() {
        backend.value = null
    }

    watch(
        [connected, client],
        async ([isConnected, cli]) => {
        if (isConnected && cli) {
            await setBackend()
        } else {
            resetBackend()
        }
        },
        { immediate: true }
    )


    return {
        //state
        backend,
        //actions
        setBackend,
        resetBackend
    }
})