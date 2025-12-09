import { storeToRefs } from 'pinia'
import { eventsStore } from '@/stores/events'

export function useEvents() {
    const store = eventsStore()
    const { events } = storeToRefs(store)

    return {
        // Estado (refs reactivos)
        events
        // functions
    }
}