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


const implcollectplayercards = function(player, gs, includeoutofplay = true) {
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
    activecards = activecards.concat(climax= G.climax(gs, player))
    let cards = (level = G.level(gs, player))
//	.concat(climax = G.climax(gs, player))
	.concat(clock = G.clock(gs, player))
	.concat(memory = G.memory(gs, player))
//	.concat(deck = G.deck(gs, player))
    //	.concat(waiting_room = G.waiting_room(gs, player))
    if(includeoutofplay) {
	cards = cards.concat(hand = G.hand(gs, player))
	checkundefined(hand, 'hand')	
    }
    
    checkundefined(level, 'level')
    checkundefined(climax, 'climax')
    checkundefined(clock, 'clock')

//    checkundefined(waiting_room, 'waiting_room')
    checkundefined(memory, 'memory')
//    checkundefined(cards, 'allcards')
    //    console.log(`size of cards ${cards.size}`)
    return [activecards, cards]
}



// collects all cards that could possibly have an affect on the game through either passive or active abilities

const collectactivateablecards = function(gs) {
    validatefield(gs)
    //    return
    let [current_active, current_inactive] = implcollectplayercards(currentplayer(gs), gs)
    let [oppos_active, oppos_inactive] = implcollectplayercards(inactiveplayer(gs), gs)
    return current_active.concat(current_inactive).concat(oppos_active).concat(oppos_inactive)
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

    // finds the card on the stage if only an id given
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
		card = gs.getIn(['player1', 'stage'].concat(i)).first()
	    }
	    // else
	    // 	console.log(`${checked_id} does not match ${card}`)
	})
	pos.forEach(i => {
	    let checked_id
	    if(id === (checked_id = getId(gs, 'player2', i))) {
		card = gs.getIn(['player2', 'stage'].concat(i)).first()
	    }
	    // else
	    // 	console.log(`${checked_id} does not match ${card}`)
	    
	})
	
	if(!card) // this make no error occur
	    return -1;
    }
    
    let base = card.getIn(['active',type])
    if(typeof base === 'function')
	base = base(gs)
//    console.log(`base before ${base}`)
    let [currentplayercards, _1 ] = implcollectplayercards(currentplayer(gs), gs, false)
    let [inactiveplayercards, _2 ] = implcollectplayercards(inactiveplayer(gs), gs, false)

    let powermapper = iscurrentturn => {
	return c => {
    	    let func;
    	    if(func = c.getIn(['continous',type]))
    		return func(card, gs, c.getIn(['info','id']), iscurrentturn)
    	    return 0;
	}
    }
    base += currentplayercards.map(powermapper(true))
	.reduce( (R,T) => {
	    return R + T
	}, 0) 

    
    base += inactiveplayercards.map(powermapper(false))
	.reduce( (R,T) => {
	    return R + T
	}, 0)
//    console.log(`base after ${base}`)
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

function can_side_attack(card, gs) {
    let otherfunc = card.getIn(['continous','other'])
    let this_card_can_side_attack = otherfunc === undefined || (typeof otherfunc === 'function' && otherfunc({ context:"can_side_attack"}, card, gs))
    collectactivateablecards(gs).map(c => {
	let func;
	if(func = c.getIn(['continous', 'other']))
	    this_card_can_side_attack = this_card_can_side_attack && func({context:"allows_side_attacking"})
	
    })
    return this_card_can_side_attack;

}
				   
export { power_calc, soul_calc, level_calc, cost_calc, collectactivateablecards, can_side_attack }
