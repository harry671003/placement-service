
class Distributor { 
    constructor() { 
        this.series = 0;
    }

    assignPartition() {
        
    }

    ingest(tenantID, series) {
        console.log("ingesting ", tenantID, series)
    }

    getSeries() {
        return this.series
    }
} 

export { Distributor };
