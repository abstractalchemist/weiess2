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
    return activecards.concat(gs.getIn([player, 'level']))
	.concat(gs.getIn([player,'clock']))
	.concat(gs.getIn([player,'memory']))
	.concat(gs.getIn([player, 'waiting_room']))
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
	}
	break;
    case 'stage':
	{

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
	let waiting_room = gs.getIn([currentplayer(gs),'waiting_room'])
	
	return gs.setIn([currentplayer(gs), 'deck'], shuffle(waiting_room)).setIn([currentplayer(gs), 'waiting_room'], List()).setIn(['applyrefreshdamage'], waiting_room.size > 0)
    }
    return gs;
}


// utility to pay
const payment = function(cost) {
    return gs => {
//	console.log(`attempting to pay ${cost}`)
	let stock = gs.getIn([currentplayer(gs), 'stock'])
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
    ( h.getIn(['info', 'cost']) <= gs.getIn([currentplayer(gs), 'stock']).size &&

      // color is in level or clock
      ( gs.getIn([currentplayer(gs), 'level']).map(c => c.getIn(['info','color'])).includes( h.getIn(['info', 'color']) ) ||
	gs.getIn([currentplayer(gs), 'clock']).map(c => c.getIn(['info','color'])).includes( h.getIn(['info', 'color']) ) ) &&

      // and current level ( this is a function since continous abilites are typically a function of game_state )
      gs.getIn([currentplayer(gs), 'level']).size >= h.getIn(['active','level'])(gs) )
}


export { debug, iscard, findopenpositions, currentplayer, collectactivateablecards, inactiveplayer, shuffle, isevent, refresh, isclimax, canplay, payment }
