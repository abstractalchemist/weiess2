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

export { debug, iscard, findopenpositions, currentplayer, collectactivateablecards, inactiveplayer }
