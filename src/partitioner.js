
const RANGE_MAX = 4294967296

class RangePartitioner {
    getRange(i, count) {
        const size = RANGE_MAX / count
        const minRange = (i) * size
        const maxRange = (i + 1) * size - 1

        return [minRange, maxRange]
    }
}

export { RangePartitioner }
