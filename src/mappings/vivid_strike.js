import { Observable } from 'rxjs'
import { List } from 'immutable'
const { of } = Observable;
import { ClimaxEffects } from './climax'
import StageSelector from '../stageselector'
import React from 'react'
import { iscard } from '../field_utils'
import { DrawSelect,selectforpowerandsoul,isinfront, findoccupiedpositions, findAndRemoveCard } from './utils'
import { findstageposition } from '../utils'
import { currentplayer } from '../game_pos'


export default {
    vs_w50_064: Object.assign({}, ClimaxEffects.power1000_soul1),
    vs_w50_067: Object.assign({}, {
	auto_abilities(evt,gs) {
	    if(gs.getIn(['phase']) === 'climax') {
		return List([
		    
		    (evt, gs, ui) => {
			return func => {
			    return  {
				id: 'stage-select',
				prompt: <StageSelector onselect={
				    pos => {
					gs = selectforpowerandsoul(gs, 2000, 1)(pos)
					ui.closeCurrentPrompt()
					func(gs)
				    }
				}
				openpositions={findoccupiedpositions(gs)}
				selectioncount={2}/>
			    }
			}
		    }
		    
		]);
	    }
	}
    }),
    vs_w50_045: Object.assign({}, {

	// id is the id of the card that the ability is bein invoked on
	auto_abilities(evt, gs, id) {
	    if(evt.evt === 'attack_select') {
		
		let pos = evt.selected_pos;
		//let stagepos = findstageposition(gs, 'VS/W50-045')
		let attacker = gs.getIn([currentplayer(gs), 'stage'].concat(pos)).first()
		if(attacker.getIn(['info','id']) === id) {
		    return List([
			(evt, gs, ui) => {
			    return func => {
				return {
				    id: 'draw-select',
				    prompt: ( <DrawSelect draw_count={2} onend={
					gs => {
					    ui.closeCurrentPrompt()
					    func(gs)
					}
				    } game_state={gs}
					      cancelhandler={
						  evt => {
						      ui.closeCurrentPrompt()
						      func(gs)
						  }
					      }/>  )
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
	    power(card, gs, id) {
		let otherpos = findstageposition(gs, id)

		if(iscard(card)) {
		    let pos = findstageposition(gs, card.getIn(['info', 'id']))
		    if(pos && otherpos && isinfront(pos, otherpos)) {
			let level = card.getIn(['active','level'])
			if(typeof level === 'function')
			    level = level(gs)
			return level * 500;
		    }
		}
		return 0;
		
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
