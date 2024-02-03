import { defineStore } from 'pinia'
import { initCortex } from '../cortex'


export const useStore = defineStore('store', {
    state: () => {
        return {
            // all these properties will have their type inferred automatically
            cortex: initCortex(),
        }
    },
})
