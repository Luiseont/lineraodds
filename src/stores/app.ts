import { ref } from 'vue'
import { defineStore } from 'pinia'
export const appStore = defineStore('app', () => {
    const backend = ref<any | null>(null)

    return {
        backend
    }
})