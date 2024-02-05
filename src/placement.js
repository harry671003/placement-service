import {generateID} from './utils';
import { RangePartitioner } from './partitioner';

class PlacementService { 
    constructor(partitionInfo, ingesters) { 
        this.partitionInfo = partitionInfo
        this.ingesters = ingesters
        this.placementMatrix = {}
        this.rangePartitioner = new RangePartitioner()
    }

    createTenant(alias) {
        const lps = this.generateLogicalPartitions(4)
        const tenantID = `ws-${generateID()}`
        this.partitionInfo.tenants[tenantID] = {
            alias: alias,
            logicalPartitions: lps, 
        }

        return tenantID
    }

    update() {
        console.log("[PlacementService] loop")
        this.updatePlacementMatrix()
    }

    updatePlacementMatrix() {
        const placementMatrix = []
        for(let [key, ingester] of this.ingesters) {
            placementMatrix.push({
                ingester: ingester,
                physicalPartitions: ingester.getPartitions(),
                series: ingester.getSeriesCount()
            })
        };

        placementMatrix.sort((a, b) => {
            if (a.series == b.series) {
                if( a.physicalPartitions.size < b.physicalPartitions.size) {
                    return -1
                }
            }
            if(a.series < b.series) {
                return -1
            }

            return 1
        })

        this.placementMatrix = placementMatrix
    }

    generateLogicalPartitions(n) {
        const lps = []
        for (let i = 0; i < n; i++) {
            const [minRange, maxRange] = this.rangePartitioner.getRange(i, n)
            lps.push(this.generateLogicalPartition(minRange, maxRange))
        }
        return lps
    }

    generateLogicalPartition(minRange, maxRange) {
        const id = `log-${generateID()}`
        const log = {
            id: id,
            minTime: new Date().toISOString(),
            maxTime: '3000-01-01T00:00:00Z',
            minRange: minRange,
            maxRange: maxRange,
        }

        const phy = this.generatePhysicalPartition(log)
        log.physicalPartitions = [phy]

        this.partitionInfo.logicalPartitions[id] = log
        return id
    }

    generatePhysicalPartition(log) {
        const id = `phy-${generateID()}`
        const phy = {
            id: id,
            minTime: new Date().toISOString(),
            maxTime: '3000-01-01T00:00:00Z',
            minRange: log.minRange,
            maxRange: log.maxRange,
        }
        const stores = this.assignPhysicalPartition(phy, 3)

        phy.stores = stores
        this.partitionInfo.physicalPartitions[id] = phy
        
        return id
    }

    assignPhysicalPartition(phy, replicas) {
        const stores = []
        for(let i = 0; i < replicas; i++) {
           const ing = this.placementMatrix[i].ingester
           ing.assignPartition(phy)
           stores.push(ing.name)
        }
    
        this.updatePlacementMatrix()
        return stores
    }
}

export {PlacementService};
