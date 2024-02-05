import { defineStore } from 'pinia'
import { initCortex } from '../cortex'
import { usePartitionInfo } from './partitioninfo'
import {ref} from 'vue';

export const useStore = defineStore('store', () => {
    const partitionInfo = usePartitionInfo()
    const crtx = initCortex(partitionInfo)
    
    const cortex = ref(crtx)

    return { cortex }
})
