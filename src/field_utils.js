import { inactiveplayer, currentplayer } from './game_pos'
import { List, Map, isImmutable } from 'immutable'

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


export { G, validatefield, iscard }
