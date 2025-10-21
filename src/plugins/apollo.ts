import { DefaultApolloClient } from "@vue/apollo-composable";
import type { App } from "vue";
import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client/core";

const httpLink = createHttpLink({
  uri: "http://localhost:8080/chains/8655e3f2036cee48fa12bdba7f9f2364553de70d7bcdc4eedd592cc0e3eba82e/applications/c4c4e25784d37e4a583bea83c3c2cb5b156a8783967094eeda8018342196ae85",
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