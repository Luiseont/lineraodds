import { storeToRefs } from 'pinia'
import { appStore } from '@/stores/app'
import { computed, ref, watch } from 'vue'

export function useApp() {
    const store = appStore()

    const { backend } = storeToRefs(store)

    const isBackendReady = computed(() => {
        return backend.value !== null
    })

    return {
        //state
        backend,
    }
}