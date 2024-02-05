import {generateID} from './utils';
import { RangePartitioner } from './partitioner';

class PlacementService { 
    constructor(partitionInfo, ingesters) { 
        this.partitionInfo = partitionInfo
        this.ingesters = ingesters
        this.placementMatrix = []
        this.rangePartitioner = new RangePartitioner()
        this.lastUpdate = new Date()
        this.updateInterval = 1000
    }

    createTenantPartitions(series) {
        return this.generateLogicalPartitions(4)
    }

    update() {
        const time = new Date()
        this.updateDelay = time - this.lastUpdate
        console.log("[PlacementService] loop")
        this.updatePlacementMatrix()
        this.rebalance()
    }

    // The placement service asks all ingesters about their series
    // Using this data, ingesters would be asked to move.
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
        const minTime = new Date()
        const id = `log-${generateID()}`
        const log = {
            id: id,
            minTime: minTime,
            maxTime: new Date(Date.parse('3000-01-01T00:00:00.000Z')),
            minRange: minRange,
            maxRange: maxRange,
        }


        const phy = this.generatePhysicalPartition(log.id, log.minTime, log.minRange, log.maxRange)
        log.physicalPartitions = [phy]

        this.partitionInfo.logicalPartitions[id] = log
        return id
    }

    generatePhysicalPartition(logicalPartitionId, minTime, minRange, maxRange) {
        const id = `phy-${generateID()}`
        const phy = {
            id: id,
            logicalPartitionId: logicalPartitionId,
            minTime: minTime,
            maxTime: new Date(Date.parse('3000-01-01T00:00:00Z')),
            minRange: minRange,
            maxRange: maxRange,
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

    // Rebalance tries to rebalance all the physical partitions on all storage nodes evenly
    // TODO: Some complex logic.
    rebalance() {
        const time = new Date()
        // Approach: 
        // Get the largest partition from the largest ingester and put it on the smallest ingester
        const len = this.placementMatrix.length
        if(len <= 3) {
            return
        }
        const largestIngester = this.placementMatrix[len - 1]

        let largestPartition = null
        // Get the largest active partition from the largest ingester
        for(let [key, phy] of largestIngester.physicalPartitions) {
            if(phy.series == 0) {
                continue
            } 
            if(phy.maxTime < time) {
                // The partition is not active.
                continue
            }
            if((time - phy.minTime) < (30) * this.updateInterval) {
                // Not enough time elapsed between when the partition was created.
                continue
            }
            
            if(largestPartition == null) {
                largestPartition = phy
                continue
            }
            if(phy.series > largestPartition.series) {
                largestPartition = phy
            }
        }

        if(largestPartition == null) {
            // Nothing to do here
            return
        }

        // Move
        this.move(largestPartition)

        // console.log(largestPartition)
        // // Next we have to find a suitable place for this partition.
        // let destinationIngester = null
        // for(let ing of this.placementMatrix) {
        //     if(largestPartition.stores.includes(ing.name)) {
        //         // Check if this ingester already has a replica
        //         continue
        //     }
        //     destinationIngester = ing
        // }
    }

    // Move moves a physical partition from source to destination
    // Since we cannot really move partitions on ingesters
    // It's the same as closing a physical partition and starting a new physical partition.
    move(phy) {
        console.log("Moving: ", phy)
        const moveTime = new Date()
        phy.maxTime = moveTime // Close the old partition
        const newId = this.generatePhysicalPartition(phy.logicalPartitionId, moveTime, phy.minRange, phy.maxRange)

        // Add the new physical partition to the logical partition.
        const lp = this.partitionInfo.logicalPartitions[phy.logicalPartitionId]
        lp.physicalPartitions = [phy.id, newId]
        this.partitionInfo.logicalPartitions[phy.logicalPartitionId] = lp

        // Update the old physical partition
        this.partitionInfo.physicalPartitions[phy.id] = phy
    }

    // Split operation splits a logical partition into 2
    split(log) {

    }

    // Partition operations
    // 1. split -> Split a logical partition into two partitions
    // 2. move -> Move a physical partition from one ingester to another ingester
    // 3. Partition capacity -> 
}

export {PlacementService};
