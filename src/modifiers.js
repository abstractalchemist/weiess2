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

function getId(gs, player, pos) {
    let stage_pos = gs.getIn([player, 'stage'].concat(pos))
    
    if(List.isList(stage_pos) && stage_pos.size > 0) {
	return stage_pos.first().getIn(['info','id'])
    }
}

function findbase(card, gs, type) {
    if(!card)
	return -1
    
    if(!iscard(card)) {
	let id = card;
	// then is id
	let pos = [['center','left'],
		   ['center','middle'],
		   ['center','right'],
		   ['back','left'],
		   ['back','right']]

	pos.forEach(i => {
	    let checked_id
	    if(id === (checked_id = getId(gs, 'player1', i))) {
		console.log(`${checked_id} matches ${card}`)
		card = gs.getIn(['player1', 'stage'].concat(i)).first()
	    }
	    else
		console.log(`${checked_id} does not match ${card}`)
	})
	pos.forEach(i => {
	    let checked_id
	    if(id === (checked_id = getId(gs, 'player2', i))) 
	    {		console.log(`${checked_id} matches ${card}`)
			card = gs.getIn(['player2', 'stage'].concat(i)).first()
	    }
	    else
		console.log(`${checked_id} does not match ${card}`)
	    
	})
	
	if(!card) // this make no error occur
	    return -1;
    }
    
    let base = card.getIn(['active',type])
    if(typeof base === 'function')
	base = base(gs)
    //    console.log(`base before ${base}`)
    base += collectactivateablecards(gs).map(c => {
    	let func;
    	if(func = c.getIn(['continous',type]))
    	    return func(card, gs)
    	return 0;
    })
	.reduce( (R,T) => {
	    return R + T
	}, 0)
    //  console.log(`base after ${base}`)
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
