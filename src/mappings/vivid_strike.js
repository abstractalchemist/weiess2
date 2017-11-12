import { Observable } from 'rxjs'
import { fromJS, List } from 'immutable'
const { of } = Observable;
import { ClimaxEffects } from './climax'
import StageSelector from '../stageselector'
import React from 'react'
import { iscard } from '../field_utils'
import { DrawSelect,selectforpowerandsoul,isinfront, findoccupiedpositions, findAndRemoveCard, Bond, convertId } from './utils'
import { findstageposition } from '../utils'
import { currentplayer } from '../game_pos'
import  brainstorm, { search } from '../actions/brainstorm'
import { Status } from '../battle_const'

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

		// this is the card attacking if the attacking card is equal to the card that is currently being asked for auto abilities
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
	    other(context, card, gs) {
		if(context.context === 'can_side_attack') {
		    return false
		}
	    }
	},
	auto_abilities(evt, gs, id) {
	    
	    // this checks if this is current card being played;  play has the attribute id
	    if(evt.evt === 'play' && id === evt.id) {
		return List([
		    (evt, gs, ui) => {
			return func => {
			    return {
				id:'stage-select',
				prompt:<StageSelector openpositions={findoccupiedpositions(gs)}
				onselect={
				    pos => {
					ui.closeCurrentPrompt()
					
					func(selectforpowerandsoul(gs, 1500, 0)(pos))
				    }
				}
				selectioncount={1} />
			    }
			    
			}
		    }
		])
	    }
	}
    }),
 
    vs_w50_042: Object.assign({}, {
	continous: {
	    // card - the card currently being affected
	    // gs -  the game state
	    // id - the card whose continous ability is being invoked
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
	auto_abilities(evt, gs, id) {
	    if(evt.evt === 'play' && id === evt.id) {
		if(gs.getIn([currentplayer(gs), 'waiting_room']).find(c => c.getIn(['info','id']).startsWith(convertId("VS/W50-035")))) {
		    return List([
			(evt, gs, ui) => {
			    return func => {
				return {
				    id:'bond-handler',
				    prompt:<Bond cancelhandler={
					_ => {
					    ui.closeCurrentPrompt()
					    func(gs)
					}
				    } onend={
					gs => {
					    ui.closeCurrentPrompt()
					    func(gs)
					}
				    } gs={gs} cardid={convertId("VS/W50-035")}/>
				}
			    }
			}
		    ])
		}
		
	    }
	}
    }),
    vs_w50_061: Object.assign({}, {
	continous: {
	    
	}
    }),
    vs_w50_038:Object.assign({},
			     {
				 auto_abilities:(_ => {
				     let activated_on = undefined
				     return (evt, gs, id) => {
					 if(activated_on !== gs.getIn(['turn'])) {

					     // is_card_turn is an attribute added to tell whether the card's activated ability is being queried on the owner's turn, or owner's opponents turn
					     if(evt.evt === 'activated_ability' && evt.is_card_turn) {
						 return List([
						     
						     (evt, gs, ui) => {
							 return func => {
							     return { id:"stage-select",
								      prompt:<StageSelector openpositions={findoccupiedpositions(gs)}
								      selectioncount={1}
								      onselect={
									  pos => {
									      actived_on = gs.getIn(['turn'])
									      ui.closeCurrentPrompt()
									      func(selectforpowerandsoul(gs, 500, 0)(pos))
									  }
								      }/>
								    }
							 }
						     }
						     
						     
						 ])
					     }
					 }
				     }
				 })(),

				 availablecardactions(gs, evt) {
				     if(evt.evt === 'main' && gs.getIn([currentplayer(gs), 'stock']).size > 0 && evt.when !== 'start') {
					 
					 return fromJS([
					     {
						 exec(gs,ui,id) {
						     return brainstorm(gs => {
							 let stock = gs.getIn([currentplayer(gs), 'stock'])
							 let pos = findstageposition(gs, id)
							 let card = stock.first();
							 return gs.updateIn([currentplayer(gs), 'stock'], stock => stock.shift())
							     .updateIn([currentplayer(gs), 'waiting_room'], wr => wr.push(card))
							     .updateIn([currentplayer(gs), 'stage'].concat(pos), stage => stage.update(0, card => card.updateIn(['status'], _ => Status.rest())))
							 
						     }, search())(gs, ui)
						 },
						 desc:"Brainstorm",
						 shortdesc:"Brainstorm"
					     }
					 ])
				     }
				     
				 }
			     })
				     
    
}
