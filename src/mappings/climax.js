import { findcardonstage } from '../utils'
import { currentplayer } from '../deck_utils'
import { isinclimax } from './utils'
const ClimaxEffects = {
    power1000_soul1 : {
	continous: {
	    power(card, gs, id, iscurrentplayer) {

		if(iscurrentplayer && isinclimax(id,gs)) 

		    return 1000
		
		return 0
	    },
	    soul(card, gs, id, iscurrentplayer) {
		if(iscurrentplayer && isinclimax(is,gs))
		    return 1
		return 0
	    }
 	}

    }
}

export { ClimaxEffects }
