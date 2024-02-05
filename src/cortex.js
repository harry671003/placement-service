import { Ingester } from './ingester.js'
import { Distributor } from './distributor.js'
import { PlacementService } from './placement.js'
import { Tenant } from './tenant.js'

function initCortex(partitionInfo) {
    const ingesters = new Map()
    const placementService = new PlacementService(partitionInfo, ingesters)

    const distributor = new Distributor(partitionInfo, ingesters)
    const cortex = new Cortex(ingesters, distributor, placementService, partitionInfo)
    cortex.scaleUp(3)

    cortex.update()

    return cortex
}

class Interval {
    constructor(timeFactor) {
        this.timeFactor = timeFactor
        this.placementServiceLoop = 60 * 1000 // 1 minute
        this.tenantLoop = 5 * 60 * 1000 // 5 minutes
        this.ingesterLoop = 2 * 60 * 60 * 1000 // 2 hours
    }

    get tenantInterval() {
        return this.tenantLoop / this.timeFactor
    }

    get placementServiceInterval() {
        return this.placementServiceLoop / this.timeFactor
    }
}

class Cortex { 
    constructor(ingesters, distributor, placementService, partitionInfo) { 
        this.ingesters = ingesters
        this.distributor = distributor
        this.placementService = placementService
        this.partitionInfo = partitionInfo
        this.tenants = new Map()

        this.interval = new Interval(100)
    }

    update() {
        const crtx = this
        function placementUpdate() {
            crtx.placementService.update()
            setTimeout(placementUpdate, crtx.interval.placementServiceInterval)
        }
        

        function tenantUpdate() {
            for(let [key, tenant] of crtx.tenants) {
                tenant.update()
            }
            setTimeout(tenantUpdate, crtx.interval.tenantInterval)
        }

        function ingesterUpdate() {
            for(let [key, ingester] of crtx.ingesters) {
                ingester.update()
            }
            setTimeout(ingesterUpdate, crtx.interval.tenantInterval)
        }

        placementUpdate()
        tenantUpdate()
    }

    updateInterval() {
        this.interval = new Interval(timeFactor)
    }
  
    scaleUp(n) {
        const curIngesters = this.ingesters.size

        for (let i = 0; i < n; i++) {
            const ing = new Ingester(`i${curIngesters + i}`)
            this.ingesters.set(ing.name, ing)
        }
    }

    createTenant(alias) {
        const tenantID = this.placementService.createTenant(alias)
        const tenant = new Tenant(tenantID, this.distributor, 100000)
        this.tenants.set(tenantID, tenant)
    }
}

export {Cortex, initCortex};
