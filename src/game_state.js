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
	climax:[],
	hand:[],
	stock:[]
    }
}

const GameStateFactory = function() {
    return fromJS({
	phase:'start',
	triggeraction:undefined,
	applyrefreshdamage:false,
	turn:0,
	player1: createfield(),
	player2: createfield()
    })
}


export { GameStateFactory as default }
