import { defineStore } from 'pinia'
import { ref } from 'vue';


export const usePartitionInfo = defineStore('partitionInfo', () => {
    const tenants = ref({})
    const partitions = ref({})

    return { tenants, partitions }
})
