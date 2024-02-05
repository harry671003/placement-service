class Ingester { 
    constructor(name) { 
        this.name = name;
        this.partitions = new Map()
        this.ingestedData = new Map()
        this.lastUpdate = new Date()
    }

    update() { // Mocking compaction cycle
        console.log("[Ingester] loop")
        const time = new Date()
        const sinceLastUpdate = time - this.lastUpdate
        for(let [key, phy] of this.partitions) {
            // TODO: Remove partitions with no data.
        };

        for(let [partitionId, _] of this.partitions) {
            const partition = this.ingestedData.get(partitionId)
            if(!partition) {
                continue
            }

            for(let [series, ingestedData] of partition) {
                const sinceLastIngest = time - ingestedData.ingestionTime
                if(sinceLastIngest > sinceLastUpdate) {
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
        partition.series = 0
        this.partitions.set(partition.id, partition)
    }

    getSeriesCount() {
        let retval = 0
        for(let [partitionId, value] of this.partitions) {
            retval += this.getSeriesForPartition(partitionId)
            
        };
        return retval
    }

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

        return maxSeries
    }
}

export { Ingester };
