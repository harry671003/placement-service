import {generateID} from './utils';

class PlacementService { 
    constructor(partitionInfo, ingesters) { 
        this.partitionInfo = partitionInfo
        this.ingesters = ingesters
        this.placementMatrix = {}
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

    loop() {
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
                return a.physicalPartitions.size > b.physicalPartitions.size
            }
            a.series > b.series
        })

        this.placementMatrix = placementMatrix
    }

    generateLogicalPartitions(n) {
        const lps = []
        for (let i = 0; i < n; i++) {
            lps.push(this.generateLogicalPartition())
        }
        return lps
    }

    generateLogicalPartition() {
        const log = `log-${generateID()}`
        const phy = this.generatePhysicalPartition(log)

        this.partitionInfo.logicalPartitions[log] = {
            id: log,
            physicalPartitions: [phy],
            minTime: new Date().toISOString(),
            maxTime: '3000-01-01T00:00:00Z',
        }
        return log
    }

    generatePhysicalPartition(log) {
        const id = `phy-${generateID()}`
        const phy = {
            id: id,
            minTime: new Date().toISOString(),
            maxTime: '3000-01-01T00:00:00Z',
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
