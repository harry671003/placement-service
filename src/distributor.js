import { RangePartitioner } from "./partitioner"


class Distributor {
    constructor(partitionInfo, ingesters) {
        this.rangePartitioner = new RangePartitioner()
        this.partitionInfo = partitionInfo
        this.ingesters = ingesters
    }

    ingest(tenantID, series) {
        const time = new Date()
        const lps = this.getLogicalPartitions(tenantID, time)

        for (let lp of lps) {
            const split = this.rangePartitioner.getRangeSplit(lp.minRange, lp.maxRange)
            const seriesPerLp = series / split
            const phys = this.getPhysicalPartitions(lp, time)
            const seriesPerPhy = seriesPerLp / phys.length

            for (let phy of phys) {
                this.push(phy.stores, phy.id, seriesPerPhy)
            }
        }
    }

    getLogicalPartitions(tenantID, time) {
        const tenant = this.partitionInfo.tenants[tenantID]
        if (!tenant) {
            console.warn("tenant not found")
        }
        const lps = []
        for (let id of tenant.logicalPartitions) {
            const lp = this.partitionInfo.logicalPartitions[id]
            if (time > lp.minTime && time <= lp.maxTime) {
                lps.push(lp)
            }
        }

        return lps
    }

    getPhysicalPartitions(lp, time) {
        const phys = []
        for (let id of lp.physicalPartitions) {
            const phy = this.partitionInfo.physicalPartitions[id]
            if (time > phy.minTime && time <= phy.maxTime) {
                phys.push(phy)
            }
        }
        return phys
    }

    push(stores, phyPartition, series) {
        for (const store of stores) {
            const ingester = this.ingesters.get(store)
            if (!ingester) {
                console.warn('ingester not found')
                return
            }
            ingester.push(phyPartition, series)
        }
    }
}

export { Distributor };
