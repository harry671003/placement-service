import * as bootstrap from 'bootstrap';

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './components/App.vue'


import {Cortex} from './cortex.js'
import {Ingester} from './ingester.js'


(async function() {
    const app = createApp(App)
    const pinia = createPinia()
    app.use(pinia)
    app.mount('#app')
})()
