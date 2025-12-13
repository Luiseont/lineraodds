import { storeToRefs } from 'pinia'
import { eventsStore } from '@/stores/events'

export function useEvents() {
    const store = eventsStore()

    const {
        events,
        allEvents,
        filteredEvents,
        currentPage,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        selectedStatus,
        selectedTypeEvent
    } = storeToRefs(store)

    return {
        events,
        allEvents,
        filteredEvents,
        currentPage,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        selectedStatus,
        selectedTypeEvent,
        getEvents: store.getEvents,
        nextPage: store.nextPage,
        previousPage: store.previousPage,
        setFilters: store.setFilters,
        cleanup: store.cleanup
    }
}