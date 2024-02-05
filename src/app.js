import * as bootstrap from 'bootstrap';

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './components/App.vue'
import Home from './components/Home.vue'
import LogicalPartition from './components/LogicalPartition.vue'
import Tenant from './components/Tenant.vue'
import Ingesters from './components/Ingesters.vue'

(async function () {
  const routes = [
    { path: '/', component: Home },
    { path: '/tenants/:id', component: Tenant },
    { path: '/logical', component: LogicalPartition },
    { path: '/ingesters', component: Ingesters },
  ]
  const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHashHistory(),
    routes, // short for `routes: routes`
  })

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.mount('#app')
})()
