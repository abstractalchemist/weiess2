import { Observable } from 'rxjs'
import { fromJS, Map, List } from 'immutable'

function createfield() {
    return {
	stage: {
	    center: {
		left:[],
		middle:[],
		right:[]
	    },
	    back: {
		left:[],
		right:[]
	    }
	},
	memory:[],
	clock:[],
	level:[],
	waiting_room:[],
	deck:[],
	hand:[]
    }
}

const GameStateFactory = function() {
    return fromJS({
	phase:undefined,
	turn:undefined,
	player1: createfield(),
	player2: createfield()
    })
}


export { GameStateFactory as default }
