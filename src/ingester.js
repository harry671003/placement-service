class Ingester { 
    constructor(name) { 
        this.name = name;
        this.partitions = new Map()
        this.ingestedData = new Map()
    }

    update() {

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
            lastTime: time,
        })
    }
}

export { Ingester };
