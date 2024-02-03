
class Cortex { 
    constructor(radius) { 
        this.radius = radius; 
    } 
  
    get radius() { 
        return this._radius; 
    } 
  
    set radius(r) { 
        this._radius = r; 
    } 
  
    get area() { 
        return ((22/7)*this.radius*this.radius); 
    } 
} 

export {Cortex};
