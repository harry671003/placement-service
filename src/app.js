import * as bootstrap from 'bootstrap';

// Or import only needed plugins
import { Tooltip as Tooltip, Toast as Toast, Popover as Popover } from 'bootstrap';

import {Cortex} from './cortex.js'
import {Ingester} from './ingester.js'

class App {
    constructor() { 
        this.cortex = new Cortex(0);
        this.ingester = new Ingester(0); 
    }

    run() {
        console.log("running")
    }
}


(async function() {
    const app = new App()
    app.run()
})()
