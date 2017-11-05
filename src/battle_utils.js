import { Status } from './battle_const'
import { currentplayer } from './game_pos'
import { List } from 'immutable'
import { Observable } from 'rxjs'
const { of } = Observable;
import { iscard } from './field_utils'

function checkbattleconditions(if_something_not_resting, and) {
    return gs => {
	
	
	// true if there is no card, or the card is actually resting
	const is_stage_resting = stack => {
	    let c;
	    if(List.isList(stack) && stack.size > 0 && iscard(c = stack.first())) {
		//			    return !(Status.not_attack(c) || Status.stand(c))

		let rested = Status.rest(c)
		let reversed = Status.reversed(c)
		
		return rested || reversed || Status.not_attack(c)
	    }
	    return true
	}
	
	let stage_cl = gs.getIn([currentplayer(gs), 'stage', 'center','left'])
	let stage_cm = gs.getIn([currentplayer(gs), 'stage', 'center','middle'])
	let stage_cr = gs.getIn([currentplayer(gs), 'stage', 'center','right'])
	if(and)
	    and(gs)
	if(!(is_stage_resting(stage_cl) && is_stage_resting(stage_cm) && is_stage_resting(stage_cr))) {
	    
	    //	    return this.resolve()
	    return if_something_not_resting()
	}
	else {
	    
	    return of(gs)
	}
    }
}

export { checkbattleconditions }
