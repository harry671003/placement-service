import _ from 'lodash';
import { PARTITION_MAX_SERIES } from './partitioner';

class Ingester {
    constructor(name) { 
        this.name = name;
        this.partitions = new Map()
        this.ingestedData = new Map()
        this.lastUpdate = new Date()
        this.updateInterval = 10000
    }

    update() { // Mocking compaction cycle
        console.log("[Ingester] compaction")
        const time = new Date()
        this.updateInterval = time - this.lastUpdate

        for(let [partitionId, phy] of this.partitions) {
            // For any partition, that doesn't have samples for more than one compaction cycle
            // They'll get removed.
            if((time - phy.maxTime) > this.updateInterval) {
                this.partitions.delete(partitionId)
            }
        };

        for(let [partitionId, _] of this.partitions) {
            const partition = this.ingestedData.get(partitionId)
            if(!partition) {
                continue
            }

            for(let [series, ingestedData] of partition) {
                const sinceLastIngest = time - ingestedData.ingestionTime
                if(sinceLastIngest > this.updateInterval) {
                    partition.delete(series)
                }
            };

            this.updatePartitionSeries(partitionId)
        };

        this.lastUpdate = time
    }

    getPartitions() {
        return this.partitions
    }

    assignPartition(partition) {
        partition = _.cloneDeep(partition)
        if(!this.partitions.get(partition.id)) {
            // Creating the partition for the first time.
            partition.createTime = new Date()
        }
        this.partitions.set(partition.id, partition)
    }

    getSeriesCount() {
        let retval = 0
        for(let [partitionId, value] of this.partitions) {
            retval += this.getSeriesForPartition(partitionId)
        };
        return retval
    }

    getActiveSeriesCount() {
        const time = new Date()
        let retval = 0
        for(let [partitionId, partition] of this.partitions) {
            if(partition.maxTime < time) {
                continue
            }
            retval += this.getSeriesForPartition(partitionId)
        };
        return retval
    }

    // Push receives series from distributors
    // This mocks the ingester push.
    push(partitionId, series) {
        const ingestionTime = new Date()

        let partition = this.ingestedData.get(partitionId)
        if(!partition) {
            partition = new Map()
        }

        partition.set(series, {
            series: series,
            ingestionTime: ingestionTime,
        })

        this.ingestedData.set(partitionId, partition)

        this.updatePartitionSeries(partitionId)
    }

    updatePartitionSeries(partitionId) {
        const partition = this.ingestedData.get(partitionId)
        if(!partition) {
            console.warn('ingested data not found')
            return
        }
        
        let maxSeries = 0

        for(let [series, ingestedData] of partition) {
            if(ingestedData.series > maxSeries) {
                maxSeries = ingestedData.series
            }
        };

        const phy = this.partitions.get(partitionId)
        if(!phy) {
            console.warn("physical partition not found")
            return
        }
        phy.series = maxSeries
    }

    getSeriesForPartition(partitionId) {
        const partition = this.ingestedData.get(partitionId)
        if(!partition) {
            return 0
        }

        let maxSeries = 0
        for(let [series, ingestedData] of partition) {
            if(ingestedData.series > maxSeries) {
                maxSeries = ingestedData.series
            }
        };

        if(maxSeries > PARTITION_MAX_SERIES) {
            maxSeries = PARTITION_MAX_SERIES
        }

        return maxSeries
    }
}

export { Ingester };
