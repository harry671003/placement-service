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

    // The placement service asks all ingesters about their partitions
    // Using this data, the placement matrix would be built which has the full picture
    // of what's going on.
    updatePlacementMatrix() {
        const placementMatrix = []
        for (let [key, ingester] of this.ingesters) {
            placementMatrix.push({
                ingester: ingester,
                partitions: ingester.getPartitions(),
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
            if (a.partitions.size < b.partitions.size) {
                return -1
            }
            if (a.partitions.size > b.partitions.size) {
                return 1
            }

            return 0
        })

        this.placementMatrix = placementMatrix
    }

    createTenantPartitions(tenantID, series) {
        return this.generatePartitions(tenantID, 2)
    }

    generatePartitions(tenantID, n) {
        const minTime = new Date()
        const parts = []
        for (let i = 0; i < n; i++) {
            const [minRange, maxRange] = this.rangePartitioner.getRange(i, n)
            const part = this.generatePartition(tenantID, minTime, minRange, maxRange)
            const stores = this.assignPartition(part, 3)

            part.stores = stores
            this.partitionInfo.partitions[part.id] = part
            parts.push(part.id)
        }
        return parts
    }

    generatePartition(tenantID, minTime, minRange, maxRange) {
        const id = `p-${generateID()}`
        const part = {
            id: id,
            tenantID: tenantID,
            minTime: minTime,
            maxTime: TIME_END,
            minRange: minRange,
            maxRange: maxRange,
        }
        return part
    }

    assignPartition(part, replicas) {
        const stores = []

        for (let mat of this.placementMatrix) {
            if (mat.partitions.get(part.id)) {
                continue
            }
            mat.ingester.assignPartition(part)
            stores.push(mat.ingester.name)

            if (stores.length >= replicas) {
                break
            }
            this.updatePlacementMatrix()
        }

        console.log(`[PlacementService] Assigning ${part.id} to ${stores}`)
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

    // When splitting a partition, 2 new partitions are created with 3 replicas each
    hasCapacityForSplit(series) {
        let replicaSeries = series / 2
        if(series == PARTITION_MAX_SERIES) {
            // Assume the worst
            replicaSeries = PARTITION_MAX_SERIES
        }

        const seriesAfterSplit = replicaSeries * 3

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
            for (let [key, part] of mat.partitions) {
                if (part.series == 0) {
                    continue
                }
                if (part.maxTime < time) {
                    // The partition is not active.
                    continue
                }
                if ((time - part.createTime) < (10) * this.updateInterval) {
                    // Not enough time elapsed between when the partition was created.
                    continue
                }
                if (part.series < PARTITION_TARGET_SERIES) {
                    // The partition still hasn't exceeded the target
                    continue
                }

                partitionsToSplit.push(part)
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
            // Get the partition ID
            const part = this.partitionInfo.partitions[partition.id]
            if(this.split(part.id)) {
                return true // Only allow one split per cycle
            }
        }

        // Map is used to only de-dup and print a more accurate number.
        const map = new Map()
        for(let partition of partitionsToSplit) {
            const part = this.partitionInfo.partitions[partition.id]
            map.set(part.id, true)
        }
        if(map.size > 0) {
            console.log(`[PlacementService] partitions remaining to be split: ${map.size}`)
        }

        return false
    }

    
    // Moving tries to rebalance all the partitions on all storage nodes evenly
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
        for (let [key, part] of sourceIngester.partitions) {
            if (part.series == 0) {
                continue
            }
            if (part.maxTime < time) {
                // The partition is not active.
                continue
            }
            if ((time - part.createTime) < (10) * this.updateInterval) {
                // Not enough time elapsed between when the partition was created.
                continue
            }

            sourcePartitions.push(part)
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
        if (destIngester.partitions.get(partition.id)) {
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

    // Move moves a partition from source to destination
    move(ingpart, source, dest) {
        console.log(`[PlacementService] Moving: ${ingpart.id} - ${ingpart.series}]`, `[source: ${source.name} - ${source.getSeriesCount()}]`, `[dest: ${dest.name} - ${dest.getSeriesCount()}]`)
        const moveTime = new Date()

        // Update the partition info
        const part = this.partitionInfo.partitions[ingpart.id]
        const stores = part.stores.filter((store) => {
            return store != source.name
        })
        stores.push(dest.name)
        part.stores = stores
        this.partitionInfo.partitions[part.id] = part

        // Update ingesters
        dest.assignPartition(ingpart)
        ingpart.maxTime = moveTime // Close the old partition
        source.assignPartition(ingpart)
    }

    // Split operation splits a partition into 2
    split(partitionId) {
        const splitTime = new Date()
        const part = this.partitionInfo.partitions[partitionId]

        const [leftMinRange, leftMaxRange, rightMinRange, rightMaxRange] = this.rangePartitioner.splitRange(part.minRange, part.maxRange)

        // Split and create two new partitions
        // They will be backed by other partitions
        const leftPartition = this.generatePartition(part.tenantID, splitTime, leftMinRange, leftMaxRange)
        const rightPartition = this.generatePartition(part.tenantID, splitTime, rightMinRange, rightMaxRange)

        // Assign the left partitition to the same stores as the old partition
        leftPartition.stores = part.stores
        this.assignPartitionToStores(leftPartition, leftPartition.stores)

        // Assingn the right partition to other ingesters
        const stores = this.assignPartition(rightPartition, 3)
        rightPartition.stores = stores

        const splits = this.rangePartitioner.getRangeSplit(part.minRange, part.maxRange)


        // Assign partitions to tenant
        const tenant = this.partitionInfo.tenants[part.tenantID]
        tenant.partitions.push(leftPartition.id, rightPartition.id)

        this.partitionInfo.partitions[leftPartition.id] = leftPartition
        this.partitionInfo.partitions[rightPartition.id] = rightPartition        

        // Close the old partition
        // Set the maxTime
        part.maxTime = splitTime
        this.partitionInfo.partitions[partitionId] = part
        this.assignPartitionToStores(part, part.stores)
        
        console.log(`[PlacementService] Splitting (${splits} to ${splits * 2})`, `partition: ${part.id} -> (${part.minRange}, ${part.maxRange})`, `leftPartition: ${leftPartition.id} -> (${leftMinRange}, ${leftMaxRange})`, `rightPartition: ${rightPartition.id} -> (${rightMinRange}, ${rightMaxRange})`)
        return true
    }

    assignPartitionToStores(part, stores) {
        for(let store of stores) {
            const ingester = this.ingesters.get(store)
            const ingpart = {
                id: part.id,
                minTime: part.minTime,
                maxTime: part.maxTime,
                minRange: part.minRange,
                maxRange: part.maxRange,
            }
            ingester.assignPartition(ingpart)
        }
    }

    // Partition operations
    // 1. split -> Split a partition into two partitions
    // 2. move -> Move a partition from one ingester to another ingester
    // 3. Partition capacity -> 
}

export { PlacementService };
