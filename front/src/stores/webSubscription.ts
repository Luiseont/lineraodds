import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useWallet } from '@/composables/useWallet'
import { useApp } from '@/composables/useApp'
import { createApolloClient } from '@/plugins/apollo-client'
import gql from 'graphql-tag'

type Callback = () => void | Promise<void>

export const useWebSubscriptionStore = defineStore('webSubscription', () => {
    // Composables
    const { connected } = useWallet()
    const { ChainID } = useApp()
    const WsUrl = import.meta.env.VITE_APP_SERVICE == '' ? 'http://localhost:8081' : import.meta.env.VITE_APP_SERVICE

    // Apollo Client y subscription
    let apolloClient: any = null
    let notificationSubscription: any = null

    // Listeners state
    const listeners = ref<Set<Callback>>(new Set())

    // Subscription query
    const NOTIFICATIONS_SUBSCRIPTION = gql`
        subscription Notifications($chainId: ID!) {
            notifications(chainId: $chainId)
        }
    `

    function registerListener(callback: Callback) {
        listeners.value.add(callback)
    }

    function removeListener(callback: Callback) {
        listeners.value.delete(callback)
    }

    function notifyListeners() {
        console.log(`Notifying ${listeners.value.size} listeners...`)
        listeners.value.forEach(callback => {
            try {
                callback()
            } catch (error) {
                console.error('Error in listener callback:', error)
            }
        })
    }

    function startSubscription() {
        try {
            if (!apolloClient) {
                const httpUrl = `${WsUrl}/ws`
                const wsUrl = httpUrl.replace('http://', 'ws://').replace('https://', 'wss://')
                console.log('Creating Apollo Client for WebSubscription')
                apolloClient = createApolloClient(httpUrl, wsUrl)
            }

            if (notificationSubscription) {
                return
            }

            console.log('Starting centralized subscription for chain:', ChainID.value)

            notificationSubscription = apolloClient.subscribe({
                query: NOTIFICATIONS_SUBSCRIPTION,
                variables: {
                    chainId: ChainID.value
                }
            }).subscribe({
                next: (result: any) => {
                    console.log('WebSubscription Notification received:', result)
                    notifyListeners()
                },
                error: (error: any) => {
                    console.error('WebSubscription error:', error)
                },
                complete: () => {
                    console.log('WebSubscription completed')
                }
            })

        } catch (error) {
            console.error('Error setting up WebSubscription:', error)
        }
    }

    function stopSubscription() {
        if (notificationSubscription) {
            console.log('Stopping WebSubscription')
            notificationSubscription.unsubscribe()
            notificationSubscription = null
        }
    }

    function cleanup() {
        stopSubscription()
        if (apolloClient) {
            apolloClient = null
        }
        listeners.value.clear()
    }

    function setupBrowserCleanup() {
        window.addEventListener('beforeunload', () => cleanup())
        window.addEventListener('pagehide', () => cleanup())
    }

    // Start subscription immediately (public access)
    startSubscription()

    setupBrowserCleanup()

    // Optional: Log connection status changes but don't stop public subscription
    watch(connected, (newVal) => {
        console.log('Wallet connection changed:', newVal)
        // We could potentially reconnect or refresh here if needed, 
        // but the public subscription to Main Chain should remain active.
    })

    return {
        registerListener,
        removeListener,
        startSubscription,
        stopSubscription,
        cleanup
    }
})
