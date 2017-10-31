import { Observable } from 'rxjs'
import { fromJS, Map, List } from 'immutable'
import GamePhases from './game_phases'

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
	phase:GamePhases.not_started.id,
	triggeraction:undefined,
	applyrefreshdamage:false,
	turn:0,
	player1: createfield(),
	player2: createfield()
    })
}


export { GameStateFactory as default }
