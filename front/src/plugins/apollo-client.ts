import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

export function createApolloClient(httpUrl: string, wsUrl: string) {
    // HTTP link para queries y mutations
    const httpLink = new HttpLink({
        uri: httpUrl,
    })

    // WebSocket link para subscriptions
    const wsLink = new GraphQLWsLink(
        createClient({
            url: wsUrl,
        })
    )

    // Split entre HTTP y WebSocket según el tipo de operación
    const link = split(
        ({ query }) => {
            const definition = getMainDefinition(query)
            return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'subscription'
            )
        },
        wsLink,
        httpLink
    )

    return new ApolloClient({
        link,
        cache: new InMemoryCache(),
    })
}
