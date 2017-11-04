// a set of functions to apply modifiers to attributes
import { G, iscard } from './field_utils'
import { validatefield } from './field_utils'
import { currentplayer, inactiveplayer } from './game_pos'
import { List } from 'immutable'

const checkundefined = (l, field) => {
    if(!l)
	console.log(`${field} is undefined`)
    if(l.find(T => T === undefined)) {
	console.log(`${field} contains undefined`)
    }
}


const implcollectplayercards = function(player, gs) {
    //    console.log(`looking at ${player} cards`)
    let activecards = List()
    const pushCard = (stage, pos) => {
	let c = gs.getIn([player, 'stage', stage, pos])
	if(iscard(c.first()))
	    activecards = activecards.push(c.first())
    }
    pushCard('center','left')
    pushCard('center','middle')
    pushCard('center','right')
    pushCard('back','left')
    pushCard('back','right')
    checkundefined(activecards, 'stage cards')
    let level, climax, clock, hand, deck, waiting_room, memory;
    let cards = activecards.concat(level = G.level(gs, player))
	.concat(climax = G.climax(gs, player))
	.concat(clock = G.clock(gs, player))
	.concat(memory = G.memory(gs, player))
	.concat(hand = G.hand(gs, player))
	.concat(deck = G.deck(gs, player))
	.concat(waiting_room = G.waiting_room(gs, player))
    
    checkundefined(level, 'level')
    checkundefined(climax, 'climax')
    checkundefined(clock, 'clock')
    checkundefined(hand, 'hand')
    checkundefined(waiting_room, 'waiting_room')
    checkundefined(memory, 'memory')
    checkundefined(cards, 'allcards')
    //    console.log(`size of cards ${cards.size}`)
    return cards;
}



// collects all cards that could possibly have an affect on the game through either passive or active abilities

const collectactivateablecards = function(gs) {
    validatefield(gs)
    return implcollectplayercards(currentplayer(gs), gs).concat(implcollectplayercards(inactiveplayer(gs), gs))
}


function findbase(card, gs, type) {
    let base = card.getIn(['active',type])
    if(typeof base === 'function')
	base = base(gs)
    return base

}

function power_calc(card, gs) {
    let power = findbase(card, gs, 'power');
    return power;
}

function soul_calc(card, gs) {
    let soul = findbase(card, gs, 'soul');
    return soul
}

function level_calc(card, gs) {
    let level = findbase(card,gs,'level')
    return level
}

function cost_calc(card, gs) {
    let cost = findbase(card,gs,'cost')
    
    return cost
}

export { power_calc, soul_calc, level_calc, cost_calc, collectactivateablecards }
