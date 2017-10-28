import { fromJS } from 'immutable'
import { shuffle } from './utils'

function choose(values) {
    let val = Math.floor( Math.random() * values.length );
    return values[val]
}

function randomdeck() {

    // generate 8 climax cards
    let deck = [];
    for(let i = 0; i < 8; ++i) {
	deck.push({ info: { lvl: 0, triggerActions: "", title:i + "/CC" , id:"RAND/" + i + "/CC"}, active: {} })
    }
    // generate 8 lvl 3 cards
    let powers = [9000,9500,10000]
    for(let i = 0; i < 8; ++i) {
	deck.push({ info: { lvl: 3, title: i + "/3", triggerActions: "", power:choose(powers), id:"RAND/" + i + "/3"}, active: {} })
    }

    // generate 8 lvl 2 cards
    powers = [5000,5500,6000,7000,8000,85000]
    for(let i = 0; i < 8; ++i) {
	deck.push({ info: { lvl: 2, title: i + "/2", triggerActions: "", power:choose(powers), id:"RAND/" + i + "/2"}, active: {} })
    }

    // generate 12 lvl 1 cards
    powers = [6500, 6000, 5000, 3000, 4000]
    for(let i = 0; i < 12; ++i) {
	deck.push({ info: { lvl: 1, title: i + "/1", triggerActions: "", power:choose(powers), id:"RAND/" + i + "/1"}, active: {} })
    }
    
    // generate 14 lvl 1 cards
    powers = [100,200,500,2000,3000]
    for(let i = 0; i < 14; ++i) {
	deck.push({ info: { lvl: 0, title: i + "/0", triggerActions: "", power:choose(powers), id:"RAND/" + i + "/0"}, active: {} })
    }

    return fromJS(deck)
}

export { randomdeck as default, shuffle }
