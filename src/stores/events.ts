import { ref, computed, watch, provide } from 'vue'
import { defineStore } from 'pinia'
import { useWallet } from '@/composables/useWallet'
import {
    Faucet,
    Client,
    Application,
    PrivateKeySigner
} from "@linera/client";
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

export const eventsStore = defineStore('events', () => {
    const events = ref<Array<any>>([])
    const appClient = ref<Application | null>(null)
    const eventsQuery = '{ "query": "query { blobEvents { id, typeEvent, league, teams{ home, away }, odds{ home, away, tie }, status, startTime, result{ winner, awayScore, homeScore } } } "  }'

    // Composables
    const { connected, faucetUrl } = useWallet()

    async function getEvents() {
        try {
            if (appClient.value == null) {
                console.log('app dont set');
                return;
            }

            console.log("Obteniendo eventos...")
            const result = await appClient.value.query(eventsQuery)
            const response = JSON.parse(result)
            console.log("Eventos obtenidos:", response.data?.blobEvents)
            events.value = response.data?.blobEvents
        } catch (error) {
            console.error('Error obteniendo eventos:', error)
            throw error
        }
    }

    async function setAppClient() {
        try {
            console.log('Setting app client with private key signer')
            const privateKey = Uint8Array.from(Buffer.from('09c24a1d47803f95710cee88d6a56c573b73d49ef2b44cea50c832d1d2e6d1f4', 'hex'));
            const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
            console.log(Buffer.from(keyPair.secretKey).toString('hex'))
            // Create signer from private key
            const signer = new PrivateKeySigner(Buffer.from(keyPair.secretKey).toString('hex'));
            const address = await signer.address();
            const owner = signer.address().toLowerCase();
            console.log("Owner: ", owner)
            // Create faucet and wallet
            const faucet = await new Faucet(faucetUrl);
            const wallet = await faucet.createWallet();
            const chainId = await faucet.claimChain(wallet, address);
            console.log("Address: ", address)
            console.log("Faucet URL: ", faucetUrl)
            console.log("chainId: ", chainId)
            // Create client
            const client = await new Client(wallet, signer, true);
            // Get application
            const appId = import.meta.env.VITE_APP_ID ?? '184d0769b7365d3d6eb918be93efe042681120ff3e5357af1c19213eb2324f70'

            appClient.value = await client.application(appId);
            console.log('✅ Events store client configured successfully');
        } catch (error) {
            console.error('Error setting app client:', error);
            throw error;
        }
    }

    watch(connected, async (newVal) => {
        if (newVal) {
            await setAppClient()
            await getEvents()
        } else {
            appClient.value = null
            events.value = []
        }
    }, { immediate: true })

    return {
        events,
        getEvents
    }
})