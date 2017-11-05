import { Map, List } from 'immutable'

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
	    return arg.getIn(['status']) === 'stand' || arg.getIn(['status']) === 'not-attacking'
	if(List.isList(arg))
	    return arg.size > 0 && (arg.first().getIn(['status']) === 'stand' || arg.first().getIn(['status']) === 'not-attacking') 
	else if (arg)
	    return arg.status === 'stand' || arg.status === 'not-attacking'
	return 'stand'
    },
    not_attack(arg) {
	if(Map.isMap(arg))
	    return arg.getIn(['status']) === 'not-attacking'
	if(List.isList(arg))
	    return arg.size > 0 && arg.first().getIn(['status']) === 'not-attacking'
	else if (arg)
	    return arg.status === 'not-attacking'
	return 'not-attacking'

    },
    rest(arg) {
	if(Map.isMap(arg))
	    return arg.getIn(['status']) === 'rest'
	if(List.isList(arg))
	    return arg.size > 0 && arg.first().getIn(['status']) === 'rest'

	else if(arg)
	    return arg.status === 'rest'
	return 'rest'
	
    },
    reversed(arg) {
	if(Map.isMap(arg))
	    return arg.getIn(['status']) === 'reversed'
	if(List.isList(arg))
	    return arg.size > 0 && arg.first().getIn(['status']) === 'reversed'
	
	else if(arg)
	    return arg.status === 'reversed'
	return 'reversed'

    }
    
}

export { Triggers, Status }
