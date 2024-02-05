import { defineStore } from 'pinia'
import { ref } from 'vue';

export const usePartitionInfo2 = defineStore('partitionInfo', {
    state: () => {
        return {
            tenants: {},
            logicalPartitions: {},
            physicalPartitions: {},
        }
    },
})


export const usePartitionInfo = defineStore('partitionInfo', () => {
    const tenants = ref({})
    const logicalPartitions = ref({})
    const physicalPartitions = ref({})

    return { tenants, logicalPartitions, physicalPartitions }
})
