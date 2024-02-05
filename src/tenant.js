class Tenant { 
    constructor(tenantId, distributor, series) { 
        this.tenantId = tenantId;
        this.distributor = distributor
        this.series = series
    }

    update() {
        this.distributor.ingest(this.tenantId, this.series)
    }
}

export { Tenant };
