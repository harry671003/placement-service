import { Ingester } from './ingester.js'
import { Distributor } from './distributor.js'
import { PlacementService } from './placement.js'
import { Tenant } from './tenant.js'

function initCortex(partitionInfo) {
    const ingesters = new Map()
    const distributor = new Distributor()
    const placementService = new PlacementService(partitionInfo, ingesters)
    const cortex = new Cortex(ingesters, distributor, placementService, partitionInfo)
    cortex.scaleUp(3)

    cortex.loop()

    return cortex
}

class Interval {
    constructor(timeFactor) {
        this.timeFactor = timeFactor
        this.placementUpdate = 60 * 1000 // 1 minute
        this.ingestUpdate = 5 * 60 * 1000 // 5 minutes
    }

    get ingestUpdateInterval() {
        return this.ingestUpdate / this.timeFactor
    }

    get placementUpdateInterval() {
        return this.placementUpdate / this.timeFactor
    }
}

class Cortex { 
    constructor(ingesters, distributor, placementService, partitionInfo) { 
        this.ingesters = ingesters
        this.distributor = distributor
        this.placementService = placementService
        this.partitionInfo = partitionInfo
        this.tenants = new Map()

        this.interval = new Interval(10)
    }

    loop() {
        const crtx = this
        function placementUpdate() {
            crtx.placementService.loop()
            setTimeout(placementUpdate, crtx.interval.placementUpdateInterval)
        }
        

        function tenantIngest() {
            for(let [key, tenant] of crtx.tenants) {
                tenant.loop()
            }
            setTimeout(tenantIngest, crtx.interval.ingestUpdateInterval)
        }

        placementUpdate()
        tenantIngest()
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
        const tenant = new Tenant(tenantID, this.distributor, 0)
        this.tenants.set(tenantID, tenant)
    }
}

export {Cortex, initCortex};
