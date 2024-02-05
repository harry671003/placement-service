import {v4 as uuidv4} from 'uuid';

function generateID() {
    return uuidv4().split('-').reverse()[0]
}

export { generateID }