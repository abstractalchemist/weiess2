import { Observable } from 'rxjs'
import { List } from 'immutable'
const { of } = Observable;
import { ClimaxEffects } from './climax'
import StageSelector from '../stageselector'
import React from 'react'
import { iscard } from '../field_utils'
import { DrawSelect } from './utils'
import { findstageposition } from '../utils'

export default {
    vs_w50_064: Object.assign({}, ClimaxEffects.power1000_soul1),
    vs_w50_067: Object.assign({}, {
	auto_abilities(evt,gs) {
	    if(gs.getIn(['phase']) === 'climax') {
		return List([
		    
		    (evt, gs) => {
			return func => {
			    return  {
				id: 'stage-select',
				prompt: <StageSelector onselect={selectforpowerandsoul(gs, 2000, 1)}
				openpositions={[['center','left'],
						['center','middle'],
						['center','right'],
						['back','left'],
						['back','right']]}
				selectioncount={2}/>
			    }
			}
		    }
		    
		]);
	    }
	}
    }),
    vs_w50_045: Object.assign({}, {
	auto_abilities(evt, gs, ui) {
	    if(evt.evt === 'attack_select') {
		
		let pos = evt.pos;
		let stagepos = findstageposition(gs, 'VS/W50-045')
		if(pos[0] === stagepos[0] && pos[1] === stagepos[1]) {
		    return fromJS([
			(evt, gs) => {
			    return func => {
				return {
				    id: 'action-dialog',
				    prompt: ( <DrawSelect draw_count={2} onend={
					gs => {
					    func(gs)
					}
				    } game_state={gs}/>  )
				}
			    }
			}
		    ])
		}

		
	    }
	}
    }),
    vs_w50_043: Object.assign({}, {
	continous: {
	    
	}
    }),
    vs_w50_042: Object.assign({}, {
	continous: {
	    power(card, gs) {
		if(iscard(card)) {
		    let pos = findstageposition(gs, card.getIn(['info', 'id']))
		    if(pos[0] !== 'center') {
			return 0
		    }
		    // can only be called if this card is on the field anyway
		    let otherpos = findstageposition(gs, card.getIn(['info','id']))
		    
			
			
		}
	    }
	},
	auto_abilities(ev, gs, ui) {
	}
    }),
    vs_w50_061: Object.assign({}, {
	continous: {
	}
    })
    
    
}
