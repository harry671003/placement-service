class Ingester { 
    constructor(name) { 
        this.name = name;
        this.partitions = new Map()
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
            retval += value.series
        };
        return retval
    }
}

export { Ingester };
