import { Ingester } from './ingester.js'
import {v4 as uuidv4} from 'uuid';

function initCortex() {
    const cortex = new Cortex()
    cortex.scaleUp(3)

    return cortex
}

class Cortex { 
    constructor(placementService) { 
        this.placementService = placementService;
        this.ingesters = []
        this.tenants = []
    }
  
    scaleUp(n) {
        const curIngesters = this.ingesters.length

        for (let i = 0; i < n; i++) {
            const ing = new Ingester(`i${curIngesters + i}`)
            this.ingesters.push(ing)
        }
    }

    createTenant(alias) {
        this.tenants.push({
            id: `ws-${uuidv4()}`,
            alias: alias,
        })
    }
}

export {Cortex, initCortex};
