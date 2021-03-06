import { currentplayer, inactiveplayer } from './game_pos'
import { Map, List } from 'immutable'


function getlocation(gs, player, location) {
    return gs.getIn([player, location])
}

function waiting_room(gs, player) {
    player = player || currentplayer(gs)
 
    return getlocation(gs, player, 'waiting_room')
}

function stock(gs, player) {
    player = player || currentplayer(gs)
    return getlocation(gs, player, 'stock')
}

function hand(gs, player) {
    player = player || currentplayer(gs)
    return getlocation(gs, player, 'hand')
}

function deck(gs, player) {
    player = player || currentplayer(gs)
    return getlocation(gs, player, 'deck')
}

function clock(gs, player) {
    player = player || currentplayer(gs)
    return getlocation(gs, player, 'clock')
}

function climax(gs, player) {
    player = player || currentplayer(gs)
    return getlocation(gs, player, 'climax')
}

const G = {
    waiting_room:waiting_room,
    stock:stock,
    hand:hand,
    deck:deck,
    clock:clock,
    climax:climax
}

function status(card) {
    if(List.isList(card)) {
	return card.first().getIn(['status'])
    }
    return card.getIn(['status'])
}

// returns the first phase action assigned to this card
function firstaction(card) {
    if(List.isList(card)) {
	let f = card.first().getIn(['actions'])
	if(List.isList(f))
	    return f.first().getIn(['exec'])
							     
    }
    if(Map.isMap(card)) {
	let f = card.getIn(['actions'])
	if(List.isList(f))
	    return f.first().getIn(['exec'])
	
    }
    return undefined;
}

const C = {
    status:status,
    firstaction:firstaction
}



export { G as default, C }
