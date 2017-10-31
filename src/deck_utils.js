import { Observable } from 'rxjs'
import { List, fromJS } from 'immutable'
import { currentplayer, G,iscard } from './utils'
import React from 'react'
import DeckSelector from './deckselector'

function shuffle(deck) {
    let current = []
    while(deck.size > 0) {
	let index = Math.floor(Math.random() * deck.size)
	let c = deck.get(index)
	deck = deck.delete(index)
	current.push(c)
    }
    return fromJS(current)
}


// refreshes deck and sets apply refresh to true
const refresh = function(gs,player) {
    player = player || currentplayer(gs)
    let deck = undefined
    if((deck = G.deck(gs,player)).size === 0) {
	let waiting_room = G.waiting_room(gs, player)
	return gs.setIn([player, 'deck'], shuffle(waiting_room))
	    .setIn([player, 'waiting_room'], List())
	    .setIn(['applyrefreshdamage'], true)
    }
    return gs;
}

// if the flage is set, apply the refresh damage
const applyrefreshdamage = function(gs, player) {
    player = player || currentplayer(gs)
    if(gs.getIn(['applyrefreshdamage'])) {
	let card = G.deck(gs)
	return gs.updateIn(['applyrefreshdamage'], _ => false)
	    .updateIn([player, 'deck'], deck => deck.shift())
	    .updateIn([player, 'clock'], clock => iscard(card) ? clock.insert(0, card) : clock)
    }
    return gs

}



function drawfromdeck(count, destfield, gs, func, player) {
    let i = 0;
    if(!Array.isArray(destfield))
	destfield = [destfield]
    player = player || currentplayer(gs)
    let deck = G.deck(gs, player)
    let dest = gs.getIn([player,]).getIn(destfield)
//    console.log(`${destfield} size ${gs.getIn([player]).getIn(destfield).size}`)
    while(i++ < count) {
	if(deck.size > 0) {
	    let card = deck.first() 
	    if(func)
		func(card)

	    gs = gs
		.updateIn([player], field => {
		    return field.updateIn(destfield, loc => loc.push(card))
		})
		.updateIn([player, 'deck'], _ => deck = deck.shift())
	    //	console.log(`${destfield} size ${gs.getIn([player]).getIn(destfield).size}`)
	    gs = refresh(gs, player)

	    deck = G.deck(gs, player)
	    //	console.log(`after refresh ${deck.size}`)
	}
    }
    return gs;
    
}



function searchdeck(count, destfield, filter, gs, player) {
    player = player || currentplayer(gs)
    const findids = func => {
	
	return ids => {
	    if(ids.length <= count) {
		ids.forEach(id => {
		    let deck = G.deck(gs);
		    let index = deck.findIndex(i => i.getIn(['info','id']) === id)
		    if(index > 0) {
			let card = deck.get(index);
			gs = gs
			    .updateIn([currentplayer(gs), 'deck'], wr => {
				return refresh(wr.delete(index))
			    })
 			    .updateIn([currentplayer(gs)], field => {
				return field.getIn(destfield, loc => loc.push(card))
			    })
		    }
		})
		func(gs)
	    }  
	}
    }

    return func => {
	return {
	    prompt:<DeckSelector game_state={gs} field={['deck']} player={player} selectcount={count} filter={filter}
	    onselect= {
		ids => findids(func)(ids)
	    }>
		</DeckSelector>,
	    id:'deck-selector'
	}
    }
}

function searchwaitingroom(count, destfield, filter, gs, player) {
    player = player || currentplayer(gs)
    const findids = func => {
	
	return ids => {
	    if(ids.length <= count) {
		id.forEach(id => {
		    let deck = G.waiting_room(gs);
		    let index = deck.findIndex(i => i.getIn(['info','id']) === id)
		    if(index > 0) {
			let card = deck.get(index);
			gs = gs
			    .updateIn([currentplayer(gs), 'waiting_room'], wr => {
				return wr.delete(index)
			    })
 			    .updateIn([currentplayer(gs)], field => {
				return field.getIn(destfield, loc => loc.push(card))
			    })
		    }
		})
		func(gs)
	    }  
	}
    }

    return func => {
	return {
	    prompt:<DeckSelector game_state={gs} field={['waiting_room']} player={player} selectcount={count} filter={filter}
	    onselect={
		ids => findids(func)(ids)
	    }>
		</DeckSelector>,
	    id:'deck-selector'
	}
    }
}

export { refresh, applyrefreshdamage, drawfromdeck, searchdeck, shuffle, searchwaitingroom }
