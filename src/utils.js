import { fromJS, isImmutable, List, Map } from 'immutable'
import { Observable } from 'rxjs'
const { of, create } = Observable
import GamePositions, { currentplayer, inactiveplayer } from './game_pos'
import { refresh } from './deck_utils'
import React from 'react'
import CardSelector from './cardselector'


// returns true if c is a card
const iscard = function(c) {
    return c !== undefined && isImmutable(c) && c.has('active') && c.has('info');
}

const validateloc = (label, gs) => {
    let loc = gs.getIn([label])
    if(!List.isList(loc))
	throw new Error(`${label} is undefined or not a list`)
    if(loc.find(T => T === undefined) || loc.find(T => !Map.isMap(T))) {
	throw new Error(`${label} contains undefined`)
    }
}

const validateside = side => {
    validateloc('deck', side)
    validateloc('memory', side)
    validateloc('clock', side)
    validateloc('level', side)
    validateloc('waiting_room', side)
    validateloc('stock', side)
}

const validatefield = gs => {
    validateside(gs.getIn([currentplayer(gs)]))
    validateside(gs.getIn([inactiveplayer(gs)]))
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
    let c;
    if(List.isList(c = gs.getIn(GamePositions.stage_cl(gs))) && !iscard(c.first()))
	positions.push(['center','left'])
    if(List.isList(c = gs.getIn(GamePositions.stage_cm(gs))) && !iscard(c.first()))
	positions.push(['center','middle'])
    if(List.isList(c = gs.getIn(GamePositions.stage_cr(gs))) && !iscard(c.first()))
	positions.push(['center','right'])
    if(List.isList(c = gs.getIn(GamePositions.stage_bl(gs))) && !iscard(c.first()))
	positions.push(['back','left'])
    if(List.isList(c = gs.getIn(GamePositions.stage_br(gs))) && !iscard(c.first()))
	positions.push(['back','right'])
    return positions;
}

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
	    let rem = clock.slice(0, clock.size - 7)
	    return ui.prompt(func => {
		return {
		    prompt:  <CardSelector onselect={
			id => {
			    if(!id)
				throw new Error("id cannot be undefined")
			    console.log(`clicked on ${id}`)
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

const dealdamage = function(count, gs, player, cancelable = true) {
    validatefield(gs)
    player = player || currentplayer(gs)
    let playerdest = player === 'player1' ? 'player2' : 'player1'
    let canceled = false;
    let i = 0;
    let damage =[];
    let deck = G.deck(gs)
    while(i++ < count && !canceled) {
	let dmg = deck.first()
	gs = refresh(gs.updateIn([player, 'deck'], deck => deck.shift()), player)
	deck = G.deck(gs)
	if(cancelable && isclimax(dmg)) {

	    canceled = true;
	}
	damage.push(dmg)
	
    }
    if(canceled) {
	gs = gs.updateIn([playerdest, 'waiting_room'], wr => fromJS(damage).concat(wr))
    }
    else {
	gs = gs.updateIn([playerdest, 'clock'], clock => fromJS(damage).concat(clock))
    }
    validatefield(gs)
    return gs;

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


const resetcard = (card) => {
    if(List.isList(card)) {
	return card.map(resetcard)
    }
    else if(iscard(card)) {
	
	let info = card.getIn(['info'])
	return card
	    .updateIn(['active'], active => {
		return active.setIn(['power'], info.getIn(['power']))
		    .setIn(['soul'], info.getIn(['soul']))
		    .setIn(['level'], info.getIn(['level']))
	    })
	    .updateIn(['actions'], _ => List())
	    .updateIn(['cardactions'], _ => List())
    }
    return card;
}

const resetplayer = (gs, player) => {
    return gs
	.updateIn([player, 'stage', 'center', 'left'], resetcard)
    	.updateIn([player, 'stage', 'center', 'middle'], resetcard)
    	.updateIn([player, 'stage', 'center', 'right'], resetcard)
    	.updateIn([player, 'stage', 'back', 'left'], resetcard)
    	.updateIn([player, 'stage', 'back', 'right'], resetcard)
}

// reset all cards
function reset(gs) {
    gs =  resetplayer(gs, currentplayer(gs))
    gs = resetplayer(gs, inactiveplayer(gs))
    return gs;
}

// apply all currently available continous actions and attaches active actions ( which require input from the user ) to activate
// gs - gamestate
// evt - the event that occurred
const applyActions = (gs, evt, ui, next) => {
    
    let activecards = collectactivateablecards(gs).filter(T => T !== undefined)
    activecards.forEach( T => {
	let f = undefined;

	if(Map.isMap(T) && (f =  T.getIn(['passiveactions'])))
	    gs = f(gs, evt)
	else if(!T || !T.getIn)
	    console.log(` T is ${T}`)
	
	return true;
    })

    let getcardactions = deck => deck.update(0,
					     l => {

						 if(iscard(l)) {

						     return l.updateIn(['cardactions'], _ => {
							 let f = undefined;

							 if(f = l.getIn(['availablecardactions'])) {
							     //console.log(l)
				 			     //console.log(`wrapping ${f}`)
							     let cardactions = f(gs, evt)
							     return cardactions.map( action => {

								 return action.updateIn(['exec'], exec => {
								     return _ => {
									 return exec(gs,ui).mergeMap(gs => {
									     if(next)
										 next(gs)
									     return of(gs)
									 })
								     }
								     
								 })
							     })
							 }
						     })
						 }
						 return l
					     })
    

    let checkavailableactions = (gs) => {
	return card => {
	    let f = undefined;
	    if(f = card.getIn(['availableactions']))
		return card.updateIn(['cardactions'], _ => f(gs))
	    return card
	}
    }

    // add available actions to the card these are abilites that require user input ( choose, pay, whatever )
    return gs
	.updateIn([currentplayer(gs), 'stage'], stage => {
	    return stage.updateIn(['center'], center => {
		return center.updateIn(['left'], getcardactions)
		    .updateIn(['middle'], getcardactions)
		    .updateIn(['right'], getcardactions)
	    })
		.updateIn(['back'], back => {
		    return back.updateIn(['left'], getcardactions)
			.updateIn(['right'], getcardactions)
		})
	    
	    
	})
	.updateIn([currentplayer(gs), 'level'], level => {
	    return level.filter(T => T !== undefined).map(checkavailableactions(gs))
	})
	.updateIn([currentplayer(gs), 'clock'], clock => {
	    return clock.filter(T => T !== undefined).map(checkavailableactions(gs))
	})
	.updateIn([currentplayer(gs), 'memory'], memory => {
	    return memory.filter(T => T !== undefined).map(checkavailableactions(gs))
	})
	.updateIn([currentplayer(gs), 'waiting_room'], waiting_room => {
	    return waiting_room.filter(T => T !== undefined).map(checkavailableactions(gs))
	})
    
    
}



// update ui with the given event
// evt - the event that occurred
// func - a function to be executed by any activated action; or force the stream to continue
const updateUIFactory = function(ui) {
    //    console.log(`*********************** ui ${ui} ****************************`)
    return function(evt, ignoreprompt, func) {
	//	console.log(`*********************** ui ${ui}, evt ${evt} ****************************`)
	return function(gs)  {
	    //	    console.log(`gs? ${gs}`)
	    let f = func || (o => (gs => {
		//		console.log(`gs? ${gs}`)
		o.next(gs)
		o.complete()
	    }))
	    //	    console.log(`gs? ${gs}`)
	    return create(obs => {
		ui.updateUI(applyActions(gs,evt, ui, f(obs)), obs, evt, ignoreprompt)
	    })
	}
    }
}


function CardViewer({func, gs, ui}) {
    return (<dialog id='card-viewer'>
	    <div className='mdl-dialog__content viewer' >
	    {( _ => {
		let deck = G.deck(gs)
		let c
		if(deck.size > 0 && iscard(c = deck.first())) {
		    if(isclimax(c))
		       return (<div className="image-viewer" style={{background:`no-repeat center/80% url(${c.getIn(['info','image'])})`, transform:"rotate(270deg)"}}>
			    </div>)
		       
		    return (<div className="image-viewer" style={{background:`no-repeat center/80% url(${c.getIn(['info','image'])})`}}>
			    </div>)
		}
	    })()
	    }
	    </div>
	    <div className='mdl-dialog__actions'>
	    <button id='card-viewer-ok' className='mdl-button mdl-js-button' onClick={
		evt => {
		    ui.closeCurrentPrompt()
		    func(gs)
		}
	    }>
	    Ok
	    </button>
	    </div>
	    </dialog>)
}

function cardviewer(ui) {
    return gs => {
	return ui.prompt(func => {
	    return {
		prompt:<CardViewer gs={gs} func={func}  ui={ui} />,
		id:'card-viewer'
	    }
	})
    }
}


export { applyActions ,debug, iscard, findopenpositions, collectactivateablecards,  isevent, isclimax, canplay, payment, findcardonstage, findstageposition, G, dealdamage, clockDamage, hasavailableactions, clearactions, reset, validatefield, updateUIFactory, cardviewer }
