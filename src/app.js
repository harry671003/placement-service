import * as bootstrap from 'bootstrap';

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './components/App.vue'

(async function() {
    const app = createApp(App)
    const pinia = createPinia()
    app.use(pinia)
    app.mount('#app')
})()
