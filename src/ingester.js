class Ingester { 
    constructor(name) { 
        this.name = name;
        this.partitions = new Map()
        this.ingestedData = new Map()
        this.lastUpdate = new Date()
    }

    update() {
        console.log("[Ingester] loop")
        const time = new Date()
        const sinceLastUpdate = time - this.lastUpdate
        for(let [key, phy] of this.partitions) {
            const data = this.ingestedData.get(key)
            if(data) {
                const sinceLastIngest = time - data.ingestionTime
                if(sinceLastIngest < sinceLastUpdate) {
                    continue
                }
            }
            phy.series = 0
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
        for(let [key, value] of this.partitions) {
            const ingested = this.ingestedData.get(key)
            if (ingested) {
                retval += ingested.series
            }
        };
        return retval
    }

    push(partitionId, series) {
        const time = new Date()
        this.ingestedData.set(partitionId, {
            series: series,
            ingestionTime: time,
        })
        const phy = this.partitions.get(partitionId)
        if(!phy) {
            console.warn("physical partition not found")
            return
        }
        phy.series = series
    }
}

export { Ingester };
