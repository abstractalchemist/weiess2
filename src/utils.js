import { fromJS, isImmutable, List } from 'immutable'


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

const findcardonstage = function(gs, card) {
    let id = card;
    if(iscard(card))
	id = card.getIn(['info','id']);
    let stage = G.stage(gs)
    let c = undefined;
    let pos = ['center','left']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return [c, pos]
    }
    pos = ['center','middle']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return [c, pos]
    }
    pos = ['center','right']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return [c, pos]
    }
    pos = ['back','left']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return [c, pos]
    }
    pos = ['back','right']
    if(iscard(c = stage.getIn(pos).first())) {
	if(c.getIn(['info','id']) == id)
	    return [c, pos]
    }
    return [undefined, []]
    
}

export { debug, iscard, findopenpositions, currentplayer, collectactivateablecards, inactiveplayer, shuffle, isevent, refresh, isclimax, canplay, payment, findcardonstage, G }
