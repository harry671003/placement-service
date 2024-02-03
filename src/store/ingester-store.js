import { defineStore } from 'pinia'
import { Ingester } from '../ingester.js'


export const useIngesterStore = defineStore('ingester', {
    state: () => {
        return {
          // all these properties will have their type inferred automatically
          count: 0,
          ingesters: [
            new Ingester('ingester-1'),
            new Ingester('ingester-2'),
            new Ingester('ingester-3'),
            new Ingester('ingester-4'),
            new Ingester('ingester-5')
          ],
        }
      },
})
