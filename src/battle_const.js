import { Map } from 'immutable'

const Triggers = {
    soul2: "soul2",
    soulgate : "soul gate",
    treasure : "treasure",
    salvage : "salvage",
    pool : "pool",
    draw : "draw",
    shot : "shot",
    soul : "soul",
    soulgate : "soul gate"
}

const Status = {
    stand(arg) {
	if(Map.isMap(arg))
	    return arg.getIn(['status']) === 'stand'
	else if (arg)
	    return arg.status === 'stand'
	return 'stand'
    },
    rest(arg) {
	if(Map.isMap(arg))
	    return arg.getIn(['status']) === 'rest'
	else if(arg)
	    return arg.status === 'rest'
	return 'rest'
	
    },
    reversed(arg) {
	if(Map.isMap(arg))
	    return arg.getIn(['status']) === 'reversed'
	else if(arg)
	    return arg.status === 'reversed'
	return 'reversed'

    }
    
}

export { Triggers, Status }
