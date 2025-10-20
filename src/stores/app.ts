import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useWallet } from '@/composables/useWallet'
export const appStore = defineStore('app', () => {
    const { connected, client } = useWallet()
    const backend = ref<any | null>(null)

    async function setBackend()
    {
        if (connected.value && client.value) {
            backend.value = await client.value.frontend().application('2b1a0df8868206a4b7d6c2fdda911e4355d6c0115b896d4947ef8e535ee3c6b8');
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