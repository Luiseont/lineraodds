import { storeToRefs } from 'pinia'
import { eventsStore } from '@/stores/events'

export function useEvents() {
    const store = eventsStore()

    const { events, currentPage, pageSize } = storeToRefs(store)

    return {
        events,
        currentPage,
        pageSize,
        getEvents: store.getEvents,
        nextPage: store.nextPage,
        previousPage: store.previousPage,
        setFilters: store.setFilters,
        startNotificationSubscription: store.startNotificationSubscription,
        stopNotificationSubscription: store.stopNotificationSubscription,
        initialize: store.initialize,
        cleanup: store.cleanup
    }
}