import { RangePartitioner } from "./partitioner"


class Distributor {
    constructor(partitionInfo, ingesters) {
        this.rangePartitioner = new RangePartitioner()
        this.partitionInfo = partitionInfo
        this.ingesters = ingesters
    }

    ingest(tenantID, series) {
        const time = new Date()
        const parts = this.getPartitions(tenantID, time)

        for (let part of parts) {
            const split = this.rangePartitioner.getRangeSplit(part.minRange, part.maxRange)
            const seriesPerPart = series / split
            this.push(part.stores, part.id, seriesPerPart)
        }
    }

    getPartitions(tenantID, time) {
        const tenant = this.partitionInfo.tenants[tenantID]
        if (!tenant) {
            console.warn("tenant not found")
        }
        const parts = []
        for (let id of tenant.partitions) {
            const part = this.partitionInfo.partitions[id]
            if (time > part.minTime && time <= part.maxTime) {
                parts.push(part)
            }
        }

        return parts
    }

    push(stores, partId, series) {
        for (const store of stores) {
            const ingester = this.ingesters.get(store)
            if (!ingester) {
                console.warn('ingester not found')
                return
            }
            ingester.push(partId, series)
        }
    }
}

export { Distributor };
