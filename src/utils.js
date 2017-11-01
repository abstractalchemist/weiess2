import { fromJS, isImmutable, List } from 'immutable'
import { Observable } from 'rxjs'
const { of } = Observable
import GamePositions, { currentplayer, inactiveplayer } from './game_pos'

// returns true if c is a card
const iscard = function(c) {
    return c !== undefined && isImmutable(c) && c.has('active') && c.has('info');
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
    climax:getposition('climax'),
    waiting_room:getposition('waiting_room'),
    level:getposition('level')
    
}

const findopenpositions = function(gs) {
    let positions = []

    if(iscard(gs.getIn(GamePositions.stage_cl(gs)).first()))
	positions.push(['center','left'])
    if(iscard(gs.getIn(GamePositions.stage_cm(gs)).first()))
	positions.push(['center','middle'])
    if(iscard(gs.getIn(GamePositions.stage_cr(gs)).first()))
	positions.push(['center','right'])
    if(iscard(gs.getIn(GamePositions.stage_bl(gs)).first()))
	positions.push(['back','left'])
    if(iscard(gs.getIn(GamePositions.stage_br(gs)).first()))
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
	.concat(G.climax(gs, player))
	.concat(G.clock(gs, player))
	.concat(G.memory(gs, player))
	.concat(G.hand(gs, player))
	.concat(G.waiting_room(gs, player))
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
    return iscard(card) && (card.getIn(['info','power']) === undefined || card.getIn(['info','power']) === 0) && (card.getIn(['active','level']) === undefined || card.getIn(['active','level']) === 0)
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
			    func(gs.updateIn(GamePositions.level(gs, player),  level => level.insert(0, card))
				 .updateIn(GamePositions.clock(gs, player), clock => rem)
				 .updateIn(GamePositions.waiting_room(gs, player), wr => rem.concat(wr)))
			    
			    
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
	    
	    return gs.updateIn(GamePositions.stock(gs), _ => rem)
		.updateIn(GamePositions.waiting_room(gs), room => payment.concat(room))
	}
	return gs;


    }
}

const canplay = function(gs, h) {

    let level = h.getIn(['active','level'])
    if(typeof level === 'function')
	level = level(gs)
    
    // can play if level 0
    return level === 0 ||

    // have the stock
    ( h.getIn(['info', 'cost']) <= G.stock(gs).size &&

      // color is in level or clock
      ( G.level(gs).map(c => c.getIn(['info','color'])).includes( h.getIn(['info', 'color']) ) ||
	G.clock(gs).map(c => c.getIn(['info','color'])).includes( h.getIn(['info', 'color']) ) ) &&

      // and current level ( this is a function since continous abilites are typically a function of game_state )
      G.level(gs).size >= level )
}

const clearactions = function(gs) {
    return gs
	.updateIn(GamePositions.stage_cl(gs), s => {
	    if(iscard(s.first()))
		return s.update(0, c => c.updateIn(['actions'], _ => List()))
	    return s
	})
	.updateIn(GamePositions.stage_cm(gs), s => {
	    if(iscard(s.first()))
		return s.update(0, c => c.updateIn(['actions'], _ => List()))
	    return s
	})
	.updateIn(GamePositions.stage_cr(gs), s => {
	    if(iscard(s.first()))
		return s.update(0, c => c.updateIn(['actions'], _ => List()))
	    return s
	})
	.updateIn(GamePositions.stage_bl(gs), s => {
	    if(iscard(s.first()))
		return s.update(0, c => c.updateIn(['actions'], _ => List()))
	    return s
	})
	.updateIn(GamePositions.stage_br(gs), s => {
	    if(iscard(s.first()))
		return s.update(0, c => c.updateIn(['actions'], _ => List()))
	    return s
	})
	.updateIn(GamePositions.hand(gs), hand => {
	    return hand.map(c => {
		return c.updateIn(['actions'], _ => List())
	    })
	})
    
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

// returns true if there are any user actions required;  used primarily by user interface to determine whether to push on or not
const hasavailableactions = function(gs, field) {
    //    console.log(`checking ${field}`)
    let hasactions = false;
    if(!field) {
	
	collectactivateablecards(gs).forEach(T => {
	    if(!hasactions) {
		//	    console.log(T)
		if(iscard(T)) {
		    let a, b;
		    hasactions = (a = List.isList(T.getIn(['actions'])) && T.getIn(['actions']).size > 0) || (b = List.isList(T.getIn(['cardactions'])) && T.getIn(['cardactions']).size > 0)
 		    // if(hasactions) {
		    // 	console.log(`${T.getIn(['info','name'])} has actions ${a} and cardactions ${b}`)
		    // 	if(a) {
		    // 	    console.log(T.getIn(['actions']))
		    // 	}
			
		    // }
		}
		else if(List.isList(T) && iscard(T.first())) {
		    let a,b
		    T = T.first()
		    hasactions = (a = List.isList(T.getIn(['actions'])) && T.getIn(['actions']).size > 0) || (b = List.isList(T.getIn(['cardactions'])) && T.getIn(['cardactions']).size > 0)
		    // if(hasactions) {
		    // 	console.log(`${T.getIn(['info','name'])} has actions ${a} and cardactions ${b}`)
		    // 	if(a) {
		    // 	    console.log(T.getIn(['actions']))
		    // 	}
		    // }
		}
	    }
	})

    }
    else {
	if(!Array.isArray(field))
	    field = [field]
	gs.getIn([currentplayer(gs)]).getIn(field).forEach(T => {
	    if(!hasactions) {
		if(iscard(T)) {
		    hasactions = (T.getIn(['actions']) && T.getIn(['actions']).size > 0) || (T.getIn(['cardactions']) && T.getIn(['cardactions']).size > 0)
		}
	    }
	})
    }
    return hasactions;
}

export { debug, iscard, findopenpositions, currentplayer, collectactivateablecards, inactiveplayer, isevent, isclimax, canplay, payment, findcardonstage, findstageposition, G, dealdamage, clockDamage, hasavailableactions, clearactions }
