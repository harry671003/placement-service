import { Ingester } from './ingester.js'
import { Distributor } from './distributor.js'
import { PlacementService } from './placement.js'

function initCortex(partitionInfo) {
    const ingesters = new Map()
    const distributor = new Distributor()
    const placementService = new PlacementService(partitionInfo, ingesters)
    const cortex = new Cortex(ingesters, distributor, placementService, partitionInfo)
    cortex.scaleUp(3)

    cortex.loop()

    return cortex
}

class Cortex { 
    constructor(ingesters, distributor, placementService, partitionInfo) { 
        this.ingesters = ingesters
        this.distributor = distributor
        this.placementService = placementService
        this.partitionInfo - partitionInfo
        this.timer = 5000
    }

    loop() {
        const crtx = this
        function loopInternal() {
            crtx.placementService.loop()
            setTimeout(loopInternal, crtx.timer)
        }
        loopInternal()
    }
  
    scaleUp(n) {
        const curIngesters = this.ingesters.size

        for (let i = 0; i < n; i++) {
            const ing = new Ingester(`i${curIngesters + i}`)
            this.ingesters.set(ing.name, ing)
        }
    }

    createTenant(alias) {
        this.placementService.createTenant(alias)
    }
}

export {Cortex, initCortex};
