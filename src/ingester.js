
class Ingester { 
    constructor(name) { 
        this.name = name;
        this.series = 0;
    }

    getSeries() {
        return this.series
    }
} 

export { Ingester };
