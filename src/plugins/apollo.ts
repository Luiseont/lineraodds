import { DefaultApolloClient } from "@vue/apollo-composable";
import type { App } from "vue";
import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client/core";

const httpLink = createHttpLink({
  uri: "http://localhost:8080/chains/8655e3f2036cee48fa12bdba7f9f2364553de70d7bcdc4eedd592cc0e3eba82e/applications/0089b4ae47e4e776fc81d9f3c2e34628cf490f8de97e4c38eeb516a11fbcbc7d",
});

const cache = new InMemoryCache();

const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
});

export const apolloPlugin = {
  install(app: App) {
    app.provide(DefaultApolloClient, apolloClient);
  },
};