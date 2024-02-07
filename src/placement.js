import { generateID } from './utils';
import { RangePartitioner, PARTITION_TARGET_SERIES, INGESTER_TARGET_SERIES, PARTITION_MAX_SERIES } from './partitioner';
import _ from 'lodash';

const TIME_END = new Date(Date.parse('3000-01-01T00:00:00Z'))

class PlacementService {
    constructor(partitionInfo, ingesters) {
        this.partitionInfo = partitionInfo
        this.ingesters = ingesters
        this.placementMatrix = []
        this.rangePartitioner = new RangePartitioner()
        this.lastUpdate = new Date()
        this.updateInterval = 10000
    }

    update() {
        const time = new Date()
        this.updateInterval = time - this.lastUpdate
        console.log("[PlacementService] starting placement update loop")
        this.updatePlacementMatrix()
        this.rebalance()
        this.lastUpdate = time
    }

    rebalance() {
        if(this.splitPartitions()) {
            return // We only allow one of the operations
        }
        this.movePartitions()
    }

    // The placement service asks all ingesters about their physical partitions
    // Using this data, the placement matrix would be built which has the full picture
    // of what's going on.
    updatePlacementMatrix() {
        const placementMatrix = []
        for (let [key, ingester] of this.ingesters) {
            placementMatrix.push({
                ingester: ingester,
                physicalPartitions: ingester.getPartitions(),
                activeSeries: ingester.getActiveSeriesCount(),
                series: ingester.getSeriesCount(),
            })
        };

        placementMatrix.sort((a, b) => {
            if (a.series < b.series) {
                return -1
            } 
            if(a.series > b.series) {
                return 1
            }
            // We now check for active series
            if (a.activeSeries < b.activeSeries) {
                return -1
            }
            if (a.activeSeries > b.activeSeries) {
                return 1
            }
            if (a.physicalPartitions.size < b.physicalPartitions.size) {
                return -1
            }
            if (a.physicalPartitions.size > b.physicalPartitions.size) {
                return 1
            }

            return 0
        })

        this.placementMatrix = placementMatrix
    }

    createTenantPartitions(tenantID, series) {
        return this.generateLogicalPartitions(tenantID, 4)
    }

    generateLogicalPartitions(tenantID, n) {
        const minTime = new Date()
        const lps = []
        for (let i = 0; i < n; i++) {
            const [minRange, maxRange] = this.rangePartitioner.getRange(i, n)
            lps.push(this.generateLogicalPartition(tenantID, minTime, minRange, maxRange))
        }
        return lps
    }

    generateLogicalPartition(tenantID, minTime, minRange, maxRange) {
        const id = `log-${generateID()}`
        const log = {
            id: id,
            tenantID: tenantID,
            minTime: minTime,
            maxTime: TIME_END,
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
            maxTime: TIME_END,
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

        for (let mat of this.placementMatrix) {
            if (mat.physicalPartitions.get(phy.id)) {
                continue
            }
            mat.ingester.assignPartition(phy)
            stores.push(mat.ingester.name)

            if (stores.length >= replicas) {
                break
            }
            this.updatePlacementMatrix()
        }

        console.log(`[PlacementService] Assigning ${phy.id} to ${stores}`)
        return stores
    }

    // Has capacity calculates whether the ingesters have enough capacity to accommodate the given amount of series
    hasCapacity(series) {
        const totalCapacity = this.placementMatrix.length * INGESTER_TARGET_SERIES
        let usedCapacity = 0

        for (let mat of this.placementMatrix) {
            usedCapacity += mat.series
        }

        if (totalCapacity - usedCapacity >= series) {
            return true
        }

        console.log("[PlacementService] Not enough capacity to split", "totalCapacity", totalCapacity, "usedCapacity", usedCapacity, "neededCapacity", series)
        return false
    }

    // When splitting a logical partition, 2 new logical partitions are created with 3 replicas each
    hasCapacityForSplit(series) {
        let replicaSeries = series / 2
        if(series == PARTITION_MAX_SERIES) {
            // Assume the worst
            replicaSeries = PARTITION_MAX_SERIES
        }

        const seriesAfterSplit = replicaSeries * 6

        if(!this.hasCapacity(seriesAfterSplit)) {
            return false
        }
        return true
    }

    // Split partitions would pick a partition that is exceeding the target series and splits it.
    splitPartitions() {
        const time = new Date()
        const partitionsToSplit = []
        for (let mat of this.placementMatrix) {
            for (let [key, phy] of mat.physicalPartitions) {
                if (phy.series == 0) {
                    continue
                }
                if (phy.maxTime < time) {
                    // The partition is not active.
                    continue
                }
                if ((time - phy.createTime) < (10) * this.updateInterval) {
                    // Not enough time elapsed between when the partition was created.
                    continue
                }
                if (phy.series < PARTITION_TARGET_SERIES) {
                    // The partition still hasn't exceeded the target
                    continue
                }

                partitionsToSplit.push(phy)
            }
        }

        // Sort the partitions to split
        // Sort by the the split size
        partitionsToSplit.sort((a, b) => {
            const splitA = this.rangePartitioner.getRangeSplit(a.minRange, a.maxRange)
            const splitB = this.rangePartitioner.getRangeSplit(b.minRange, b.maxRange)
            a.splits = splitA
            b.splits = splitB
            if (splitA < splitB) {
                return -1
            }
            if (splitA > splitB) {
                return 1
            }

            return 0
        })

        for(let partition of partitionsToSplit) {
            if(!this.hasCapacityForSplit(partition.series)) {
                break
            }
            // Get the logical partition ID
            const phy = this.partitionInfo.physicalPartitions[partition.id]
            if(this.split(phy.logicalPartitionId)) {
                return true // Only allow one split per cycle
            }
        }
        if(partitionsToSplit.length > 0) {
            console.log(`[PlacementService] partitions remaining to be split: ${partitionsToSplit.length}`)
        }

        return false
    }

    
    // Moving tries to rebalance all the physical partitions on all storage nodes evenly
    // Approach: 
    // Get the largest partition from the largest ingester and put it on the smallest ingester
    movePartitions() {
        const time = new Date()
        const len = this.placementMatrix.length
        if (len <= 3) {
            return false
        }
        if (this.isBalanced()) {
            return false
        }

        const sourceIngester = this.placementMatrix[len - 1]
        const destIngester = this.placementMatrix[0]

        const sourcePartitions = []
        // Get the active partitions from the largest ingester
        for (let [key, phy] of sourceIngester.physicalPartitions) {
            if (phy.series == 0) {
                continue
            }
            if (phy.maxTime < time) {
                // The partition is not active.
                continue
            }
            if ((time - phy.createTime) < (10) * this.updateInterval) {
                // Not enough time elapsed between when the partition was created.
                continue
            }

            sourcePartitions.push(phy)
        }

        sourcePartitions.sort((a, b) => {
            if (a.series > b.series) {
                return -1
            }
            if (a.series < b.series) {
                return 1
            }

            return 0
        })

        for (let partition of sourcePartitions) {
            if (this.tryMove(partition, sourceIngester, destIngester)) {
                return true // We only move one partition per cycle
            }
        }
        return false
    }

    tryMove(partition, sourceIngester, destIngester) {
        if (destIngester.physicalPartitions.get(partition.id)) {
            // The partition is already present on the destination ingester
            return false
        }

        if (!this.shouldMove(sourceIngester, destIngester, partition)) {
            return false
        }
        this.move(partition, sourceIngester.ingester, destIngester.ingester)
        return true
    }

    shouldMove(source, dest, partition) {
        const destSeries = dest.ingester.getActiveSeriesCount()
        const moveSeries = partition.series
        const sourceSeries = source.ingester.getActiveSeriesCount()

        const sourceSeriesAfterMove = sourceSeries - moveSeries
        const destSeriesAfterMove = destSeries + moveSeries


        if (destSeriesAfterMove > sourceSeriesAfterMove) {
            console.log("[PlacementService] skip moving", "destSeriesAfterMove", destSeriesAfterMove, "sourceSeriesAfterMove", sourceSeriesAfterMove, "moveSeries", moveSeries)
            return false
        }

        if (moveSeries / destSeriesAfterMove <= 0.1) {
            console.log("[PlacementService] skip moving", "destSeries", destSeries, "sourceSeries", sourceSeries, "moveSeries", moveSeries, "diff", moveSeries / destSeriesAfterMove)
            return false
        }

        return true
    }

    isBalanced() {
        const len = this.placementMatrix.length
        const largest = this.placementMatrix[len - 1]
        const smallest = this.placementMatrix[0]

        const largestSeries = largest.ingester.getActiveSeriesCount()
        const smallestSeries = smallest.ingester.getActiveSeriesCount()
        const diffSeries = largestSeries - smallestSeries
        const diffPercent = diffSeries / largestSeries


        if (diffPercent <= 0.1) {
            console.log("[PlacementService] placement matrix is balanced", "largest", largestSeries, "smallest", smallestSeries, "diffPercent", diffPercent)
            return true
        }
        return false
    }

    // Move moves a physical partition from source to destination
    move(ingPhy, source, dest) {
        console.log(`[PlacementService] Moving: ${ingPhy.id} - ${ingPhy.series}]`, `[source: ${source.name} - ${source.getSeriesCount()}]`, `[dest: ${dest.name} - ${dest.getSeriesCount()}]`)
        const moveTime = new Date()

        // Update the partition info
        const phy = this.partitionInfo.physicalPartitions[ingPhy.id]
        const stores = phy.stores.filter((store) => {
            return store != source.name
        })
        stores.push(dest.name)
        phy.stores = stores
        this.partitionInfo.physicalPartitions[phy.id] = phy

        // Update ingesters
        dest.assignPartition(ingPhy)
        ingPhy.maxTime = moveTime // Close the old partition
        source.assignPartition(ingPhy)
    }

    // Split operation splits a logical partition into 2
    split(logicalPartitionId) {
        const splitTime = new Date()
        const lp = this.partitionInfo.logicalPartitions[logicalPartitionId]

        const [leftMinRange, leftMaxRange, rightMinRange, rightMaxRange] = this.rangePartitioner.splitRange(lp.minRange, lp.maxRange)

        // Split and create two new logical partitions
        // They will be backed by other physical partitions
        const leftPartition = this.generateLogicalPartition(lp.tenantID, splitTime, leftMinRange, leftMaxRange)
        const rightPartition = this.generateLogicalPartition(lp.tenantID, splitTime, rightMinRange, rightMaxRange)

        const splits = this.rangePartitioner.getRangeSplit(lp.minRange, lp.maxRange)


        // Assign partitions to tenant
        const tenant = this.partitionInfo.tenants[lp.tenantID]
        tenant.logicalPartitions.push(leftPartition, rightPartition)
        

        // Close the old logical partitions
        // Set the maxTime
        lp.maxTime = splitTime
        this.partitionInfo.logicalPartitions[logicalPartitionId] = lp

        // Close the physical partition replicas
        for(let phyId of lp.physicalPartitions) {
            const phy = this.partitionInfo.physicalPartitions[phyId]
            for(let store of phy.stores) {
                const ingester = this.ingesters.get(store)
                const ingPhy = {
                    id: phy.id,
                    logicalPartitionId: phy.logicalPartitionId,
                    minTime: phy.minTime,
                    maxTime: splitTime,
                    minRange: phy.minRange,
                    maxRange: phy.maxRange,
                }
                ingester.assignPartition(ingPhy)
            }
        }

        console.log(`[PlacementService] Splitting (${splits} to ${splits * 2})`, `partition: ${lp.id} -> (${lp.minRange}, ${lp.maxRange})`, `leftPartition: ${leftPartition} -> (${leftMinRange}, ${leftMaxRange})`, `rightPartition: ${rightPartition} -> (${rightMinRange}, ${rightMaxRange})`)
        return true
    }

    // Partition operations
    // 1. split -> Split a logical partition into two partitions
    // 2. move -> Move a physical partition from one ingester to another ingester
    // 3. Partition capacity -> 
}

export { PlacementService };
