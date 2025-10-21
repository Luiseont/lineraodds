import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { apolloPlugin } from "./plugins/apollo";
import App from './App.vue'
import router from './router'
import './assets/css/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(apolloPlugin);
app.mount('#app')
    