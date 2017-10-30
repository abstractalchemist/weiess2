import { fromJS, isImmutable, List } from 'immutable'
import { Observable } from 'rxjs'
const { of } = Observable

// returns true if c is a card
const iscard = function(c) {
    return c !== undefined && isImmutable(c) && c.has('active') && c.has('info');
}



function currentplayer(gs) {
    if(!gs)
	throw "currentplayer(gs) parameter null"

    if(gs.getIn(['turn']) === undefined)
	throw "invalid turn defined"
    return `player${gs.getIn(['turn']) % 2 + 1}`
}

function inactiveplayer(gs) {
    if(!gs)
	throw "currentplayer(gs) parameter null"

    if(gs.getIn(['turn']) === undefined)
	throw "invalid turn defined"
    return `player${gs.getIn(['turn'])  % 2 + 2}`

}

function getposition(location) {
    return (gs, player) => {
	player = player || currentplayer(gs)
	return gs.getIn([player, location])
    }
}

const G = {
    stock:getposition('stock'),
    stage:getposition('stage'),
    hand:getposition('hand'),
    deck:getposition('deck'),
    memory:getposition('memory'),
    clock:getposition('clock'),
    waiting_room:getposition('waiting_room'),
    level:getposition('level')
}

const findopenpositions = function(gs) {
    let positions = []

    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'center', 'left']).first()))
	positions.push(['center','left'])
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'center', 'middle']).first()))
	positions.push(['center','middle'])
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'center', 'right']).first()))
	positions.push(['center','right'])
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'back', 'left']).first()))
	positions.push(['center','left'])
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'back', 'right']).first()))
	positions.push(['back','right'])
    return positions;
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
    return activecards.concat(G.level(gs, player))
	.concat(G.clock(gs, player))
	.concat(G.memory(gs, player))
	.concat(G.waiting_room(gs, player))
}

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


// collects all cards that could possibly have an affect on the game through either passive or active abilities
const collectactivateablecards = function(gs) {
    return implcollectplayercards(currentplayer(gs), gs).concat(implcollectplayercards(inactiveplayer(gs), gs))
}

function debug(field, gs) {

    if(gs === undefined) {
	return "game_state not passed"
    }
    switch(field) {
    case 'hand':
	{
	    return `hand: ${G.hand(gs).map(c => c.getIn(['info','id'])).toJS()}`
	}
	break;
    case 'stage':
	{

	    let stage = G.stage(gs)
	    let getid = location => {
		let pos = stage.getIn(location)
		if(List.isList(pos) && iscard(pos.first()))
		    return `${location} - ${pos.first().getIn(['info','id'])}`
	    }
	    return `center/left: ${getid(['center','left'])}, center/middle: ${getid(['center','middle'])}, center/right: ${getid(['center','right'])}`
	    
	}
	break;
    case 'level':
	{
	}
	break;
    case 'clock':
	{
	}
	break;
    default:
	{
	    return `${field} is not a  valid field`
	}
    }
    
}

// event cards will not have a power
const isevent = function(card) {
    return iscard(card) && card.getIn(['info','power']) == undefined;
}

// climax cards have no level and no power
const isclimax = function(card) {
    return iscard(card) && card.getIn(['info','power']) === undefined && card.getIn(['active','level']) === undefined;
}

// refreshes deck and sets apply refresh to true
const refresh = function(gs) {
    if(gs.getIn([currentplayer(gs), 'deck']).size === 0) {
	let waiting_room = G.waiting_room(gs)
	
	return gs.setIn([currentplayer(gs), 'deck'], shuffle(waiting_room)).setIn([currentplayer(gs), 'waiting_room'], List()).setIn(['applyrefreshdamage'], waiting_room.size > 0)
    }
    return gs;
}

// if the flage is set, apply the refresh damage
const applyrefreshdamage = function(gs) {
    if(gs.getIn(['applyrefreshdamage'])) {
	let card = G.deck(gs)
	return gs.updateIn(['applyrefreshdamage'], false)
	    .updateIn([currentplayer(gs), 'deck'], deck => deck.shift())
	    .updateIn([currentplayer(gs), 'clock'], clock => iscard(card) ? clock.insert(0, card) : clock)
    }
    return gs

}

const clockDamage = (ui, player) => {

    return function(gs) {
	player = player || currentplayer(gs)
	let clock = G.clock(gs)
	if(clock.size >= 7) {
	    let selectable = clock.slice(clock.size - 7)
	    let rem = clock(0, clock.size - 7)
	    return ui.prompt(func => {
		return {
		    prompt:  <CardSelector onselect={
			id => {

			    let index = selectable.findIndex(c => id === c.getIn(['info','id']))
			    let card = selectable.get(index)
			    func(gs.updateIn([player, 'level'],  level => level.insert(0, card)
					     .updateIn([player, 'clock'], clock => rem)
					     .updateIn([player, 'waiting_room'], wr => rem.concat(wr))))
					    
			    
			}
		    } selection={selectable}/>,
		    id:'card-selector'
		}
	    })
	}
	return of(gs)
    }
}

// utility to pay
const payment = function(cost) {
    return gs => {
	//	console.log(`attempting to pay ${cost}`)
	let stock = G.stock(gs)
	if(stock.size >= cost) {
	    let payment = stock.slice(0, cost)
	    let rem = stock.slice(cost)
	    
	    return gs.updateIn([currentplayer(gs), 'stock'], _ => rem)
		.updateIn([currentplayer(gs), 'waiting_room'], room => payment.concat(room))
	}
	return gs;


    }
}

const canplay = function(gs, h) {
    // can play if level 0
    return h.getIn(['info','level']) === 0 ||

    // have the stock
    ( h.getIn(['info', 'cost']) <= G.stock(gs).size &&

      // color is in level or clock
      ( G.level(gs).map(c => c.getIn(['info','color'])).includes( h.getIn(['info', 'color']) ) ||
	G.clock(gs).map(c => c.getIn(['info','color'])).includes( h.getIn(['info', 'color']) ) ) &&

      // and current level ( this is a function since continous abilites are typically a function of game_state )
      G.level(gs).size >= h.getIn(['active','level'])(gs) )
}

const findstageposition = function(gs, card) {
    let id = card;
    let stage = G.stage(gs)
    let c = undefined;
    let pos = ['center','left']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return pos
    }
    pos = ['center','middle']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return pos
    }
    pos = ['center','right']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return pos
    }
    pos = ['back','left']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return pos
    }
    pos = ['back','right']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return pos;
    }
    return undefined;

}

const findcardonstage = function(gs, card) {
    let id = card;
    if(iscard(card))
	id = card.getIn(['info','id'])
    let pos = findstageposition(gs, id)
    if(pos)
	return [G.stage(gs).getIn(pos).first(), pos]
    return [undefined, []]
}

const dealdamage = function(count, gs, cancelable = true) {
    let canceled = false;
    let i = 0;
    let damage =[];
    while(i++ < count && !canceled) {
	let dmg = deck.first();
	deck = deck.shift()
	if(cancelable && isclimax(dmg)) {
	    canceled = true;
	}
	damage.push(dmg)
	
    }
    if(canceled) {
	return gs.updateIn([inactiveplayer(gs), 'waiting_room'], wr => fromJS(damage).concat(wr))
    }
    else {
	return gs.updateIn([inactiveplayer(gs), 'clock'], clock => fromJS(damage).concat(clock))
    }

}

const hasavailableactions = function(gs) {
    let hasactions = false;
    collectactivateablecards(gs).forEach(T => {
	if(!hasactions) {
	    if(iscard(T)) {
		hasactions = (T.getIn(['actions']) && T.getIn(['actions']).size > 0) || (T.getIn(['cardactions']) && T.getIn(['cardactions']).size > 0)
	    }
	    else if(List.isList(T) && iscard(T.first())) {
		T = T.first()
		hasactions = (T.getIn(['actions']) && T.getIn(['actions']).size > 0) || (T.getIn(['cardactions']) && T.getIn(['cardactions']).size > 0)
	    }
	}
    })
    return hasactions;
}

export { debug, iscard, findopenpositions, currentplayer, collectactivateablecards, inactiveplayer, shuffle, isevent, refresh, isclimax, canplay, payment, findcardonstage, findstageposition, G, dealdamage, applyrefreshdamage, clockDamage, hasavailableactions }
