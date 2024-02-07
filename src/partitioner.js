
const RANGE_MAX = 4294967296
const PARTITION_MAX_SERIES = 500000
const PARTITION_TARGET_SERIES = 250000
const INGESTER_TARGET_SERIES = 2000000


class RangePartitioner {
    getRange(i, count) {
        const size = RANGE_MAX / count
        const minRange = (i) * size
        const maxRange = (i + 1) * size - 1

        return [minRange, maxRange]
    }

    splitRange(minRange, maxRange) {
        const size = maxRange - minRange + 1
        const splitSize = size / 2
        const leftMinRange = minRange
        const leftMaxRange = leftMinRange + splitSize - 1

        const rightMinRange = leftMaxRange + 1
        const rightMaxRange = maxRange

        return [leftMinRange, leftMaxRange, rightMinRange, rightMaxRange]
    }

    getRangeSplit(minRange, maxRange) {
        const size = (maxRange - minRange) + 1
        return RANGE_MAX/size
    }
}

export { RangePartitioner, PARTITION_MAX_SERIES, PARTITION_TARGET_SERIES, INGESTER_TARGET_SERIES}
