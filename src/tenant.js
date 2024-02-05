class Tenant { 
    constructor(tenantId, distributor, series) { 
        this.tenantId = tenantId;
        this.distributor = distributor
        this.series = series
    }

    loop() {
        this.distributor.ingest(this.tenantId, this.series)
    }
}

export { Tenant };
