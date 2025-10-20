import { storeToRefs } from 'pinia'
import { appStore } from '@/stores/app'

export function useApp() {
    const store = appStore()
    const { backend } = storeToRefs(store)

    async function getCounter(){
        if (backend.value) {
            const response = await backend.value.query('{ "query": "query { value }" }');
            return JSON.parse(response).data.value;
        }
        return null;
    }

    return {
        getCounter
    }
}