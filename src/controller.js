import { Observable } from 'rxjs'
import React from 'react'
import StageSelector from './stageselector'
const { of, create } = Observable;
import { isImmutable, List, fromJS } from 'immutable'
import { shuffle, debug, iscard, currentplayer, findopenpositions, collectactivateablecards, isevent, isclimax, canplay, payment, G, clockDamage } from './utils'
import { refresh, applyrefreshdamage, searchdeck, drawfromdeck } from './deck_utils'
import AttackPhase from './attack_phase'

/*

  cards have a format 
  {
  active: {
  level:,
  power:,
  },
  info: {
  id:
  cost:
  level:
  power:
  triggeraction:
  
  },
  // this is a function which applies passive effects to the current game state, and returns the new game state
  passiveactions: function(gs, evt) {
  
  },

  // this is a function which return a list of { exec, desc } actions to be executed, or no
  availableactions: function(gs, evt) {
  },
  cardactions: {
  [{
  exec(gs, ui): return Observable
  desc:
  shortdesc:
  }]
  },

  // these are phase related functions, that are not parts of the available actions
  actions: {
  [{
  exec: return Observable
  desc:
  }] 
  }
  }
*/
const ControllerFactory = function(game_state) {

    let _ui = undefined;
    let _gs = game_state

    // apply all currently available continous actions and attaches active actions ( which require input from the user ) to activate
    // gs - gamestate
    // evt - the event that occurred
    const applyActions = (gs, evt, next) => {

	collectactivateablecards(gs).forEach( T => {
	    let f = undefined;
	    if(f =  T.getIn(['passiveactions']))
		gs = f(gs, evt)
	    
	    return true;
	})

	let getcardactions = deck => deck.update(0,
						 l => {

						     if(iscard(l)) {

							 return l.updateIn(['cardactions'], _ => {
							     let f = undefined;

							     if(f = l.getIn(['availablecardactions'])) {
								 //console.log(l)
								 //console.log(`wrapping ${f}`)
								 let cardactions = f(gs, evt)
								 return cardactions.map( action => {

								     return action.updateIn(['exec'], exec => {
									 return _ => {
									     return exec(gs,_ui).mergeMap(gs => {
										 if(next)
										     next(gs)
										 return of(gs)
									     })
									 }
									 
								     })
								 })
							     }
							 })
						     }
						     return l
						 })
	

	let checkavailableactions = (gs) => {
	    return card => {
		let f = undefined;
		if(f = card.getIn(['availableactions']))
		    return card.updateIn(['cardactions'], _ => f(gs))
		return card
	    }
	}

	// add available actions to the card these are abilites that require user input ( choose, pay, whatever )
	return gs.updateIn([currentplayer(gs), 'stage'], stage => {
	    return stage.updateIn(['center'], center => {
		return center.updateIn(['left'], getcardactions)
		    .updateIn(['middle'], getcardactions)
		    .updateIn(['right'], getcardactions)
	    })
		.updateIn(['back'], back => {
		    return back.updateIn(['left'], getcardactions)
			.updateIn(['right'], getcardactions)
		})
	    
	    
	})
	    .updateIn([currentplayer(gs), 'level'], level => {
		return level.map(checkavailableactions(gs))
	    })
	    .updateIn([currentplayer(gs), 'clock'], clock => {
		return clock.map(checkavailableactions(gs))
	    })
	    .updateIn([currentplayer(gs), 'memory'], memory => {
		return memory.map(checkavailableactions(gs))
	    })
	    .updateIn([currentplayer(gs), 'waiting_room'], waiting_room => {
		return waiting_room.map(checkavailableactions(gs))
	    })
	
	
    }
    
    // update ui with the given event
    // evt - the event that occurred
    // func - a function to be executed by any activated action; or force the stream to continue
    const updateUI= (evt, func) => {
	return gs => {
	    let f = func || (o => (gs => {
		o.next(gs)
		o.complete()
	    }))
	    
	    return create(obs => {
		_ui.updateUI(applyActions(gs,evt,f(obs)), obs, evt)
	    })
	}
    }



    let playcard = (gs, card, deststage, destpos) => {

	if(canplay(gs, card)) {
 	    let cost = card.getIn(['info','cost'])
	    // delete the card from the hand
	    gs = gs.updateIn([currentplayer(gs), 'hand'], hand=> {
		let index = hand.findIndex(c => c.getIn(['info','id']) === card.getIn(['info','id']))
		return hand.delete(index)
	    })
	    
	    // subtract the cost
	    if(cost > 0) {
		

		gs = payment(cost)(gs)
	    }
	    if(deststage === 'event') {
		
		////////////// TODO ////////////////////
	    }
	    else {
		gs = gs.updateIn([currentplayer(gs), 'stage', deststage, destpos], cards => {
		    return cards.insert(0, card)
		})
	    }
	    return gs
	}

    }

    
    return {

	updateUI:updateUI,

	updategamestate(gs) {
	    if(gs !== undefined) {
		_gs = gs;
		_ui.updateUI(_gs)
	    }
	},

	// function to regster the ui to call back to
	registerUI(ui) {
	    _ui = ui;
	},


	// this should do some preinitialization of stuff
	initializeGS() {
	    
	},

	// called when current player ends the current phase
	next() {
	    let currentphase = _gs.getIn([currentplayer(_gs), 'phase'])
	    switch(currentphase) {
	    case 'standup': {
		draw().subscribe(
		    gs => {
			_gs = gs
		    })
	    }
		break;
	    case 'draw' : {
		clock().subscribe(
		    gs => {
			_gs = gs
		    })
	    }
		break;
	    case 'clock' : {
		main().subscribe(gs => {
		    _gs = gs
		})
	    }
		break;
	    default: {
		// undefined, so start
		standup().subscribe(
		    gs => {
			_gs = gs
		    })
	    }
		break;
	    }
	},


	

	// called when the current player enters the standup phase
	standup() {

	    let standcard = cards => cards.update(0, card => {
		if(iscard(card))
		    return card.updateIn(['status'], _ => 'stand')
		return card
	    })


	    let standLC = gs => gs.updateIn([currentplayer(gs), 'stage', 'center', 'left'], standcard)
	    
	    let standCC = gs => gs.updateIn([currentplayer(gs), 'stage', 'center', 'middle'], standcard)

	    let standRC = gs => gs.updateIn([currentplayer(gs), 'stage', 'center', 'right'], standcard)
	    let player = currentplayer(_gs)
	    return of(_gs.setIn(['phase'], 'standup'))
		.mergeMap(updateUI({evt:"phase_begin"}))
		.map(standLC)
		.mergeMap(updateUI({evt:"stand",pos:[player,'stage','center','left']}))
		.map(standCC)
		.mergeMap(updateUI({ evt: "stand", pos: [player, 'stage','center','middle']}))
		.map(standRC)
		.mergeMap(updateUI({ evt: "stand", pos: [player, 'stage','center','right']}))

	    
	},
	draw() {
	    let drawIt = gs => {
		return drawfromdeck(1, 'hand', gs)
	    }
	    return of(_gs.updateIn(['phase'], _ => 'draw'))
		.map(drawIt)
		.map(applyrefreshdamage)
		.mergeMap(clockDamage(_ui))
		.mergeMap(updateUI({ evt: "draw" }))
	},
	clock() {

	    // the card that should be clocked
	    let clockIt = undefined;
	    
	    let clock = gs => {
		return gs.updateIn([currentplayer(gs), 'hand'], hand => {
		    return hand.map(c => c.updateIn(['actions'], _ => fromJS([
			{
			    exec() {
				clockIt = c.getIn(['info','id'])
				return of(gs)
			    },
			    desc: "Clock"
			}
		    ])))
		})
	    }
	    return of(_gs)
		.map(clock)
		.mergeMap(updateUI({ evt: "clock" }))
		.map(gs => {
		    let hand = G.hand(gs)
		    let card = hand.findIndex(c => clockIt === c.getIn(['info','id']))
		    let c = hand.get(card)
		    return gs.updateIn([currentplayer(gs), 'hand'], hand => hand.delete(card))
			.updateIn([currentplayer(gs), 'clock'], clock => iscard(c) ? clock.insert(0, c) : clock)
		    
		})
	    
	},

	// this is called recursively for after each main turn
	main() {

	    
	    let moveCardActions = (srcstage, srcpos) => {
		return gs => {
		    return gs.updateIn([currentplayer(gs), 'stage', srcstage, srcpos], cards => cards.update(0, card => {
			if(iscard(card))
			    return card.updateIn(['actions'], _ => fromJS([
				{
				    exec() {
					return _ui.prompt(obs => {
					    return {
						id:'stage-selector',
						prompt: 
						<StageSelector onselect={
						    ([deststage, destpos]) => {
							let cardpos = gs.getIn([currentplayer(gs), 'stage', srcstage, srcpos])
							let carddes = gs.getIn([currentplayer(gs), 'stage', deststage, destpos])
							
							
							// all cards here go into the waiting room
							if(iscard(carddes.first())) {
							    
							    gs = gs.updateIn([currentplayer(gs), 'waiting_room'], waiting_room => carddes.concat(waiting_room))
							}
							
							return of(gs
								  .setIn([currentplayer(gs), 'stage', deststage, destpos], cardpos)
								  .setIn([currentplayer(gs), 'stage', srcstage, srcpos], List()))
							  //  .mergeMap(updateUI({ evt: "move", id:cardpos.first().getIn(['info','id']) }))
							    .subscribe(
								gs => {
								    obs(gs)
								})
							
						    }
						} openpositions={[['center','left'],
								  ['center','middle'],
								  ['center','right'],
								  ['back','left'],
								  ['back','right']]}/>
					    }
					})
					    
				    },
				    desc: "Move"
				}
			    ]))
			return card
		    }))
		}
	    }
	    
	    let playCardActions = gs => {
		return gs.updateIn([currentplayer(gs), 'hand'], hand => hand.map(h => {
		    if(canplay(gs, h))
			return h.updateIn(['actions'], _ => fromJS([
			    {
				exec() {
				    return _ui.prompt(obs => {
					return {
					    prompt:
						       <StageSelector onselect={
							   ([deststage, destpos]) => {
							       return of(playcard(gs, h, deststage, destpos))
								   .mergeMap(updateUI({ evt: "play", id:h.getIn(['info','id']) }))
								   .subscribe(gs => {
								       obs(gs)
								   })
							   }
						       } openpositions={
							   (_ => {
							       if(isevent(h))
								   return [['event']]
							       return  [['center','left'],
									['center','middle'],
									['center','right'],
									['back','left'],
									['back','right']]
							   })()
						       } />,
					    id:'stage-selector'
					}
				    })
				    
				},
				desc: "Play"
			    }
			]))
		    return h;
		}))
		
	    }

	    return of(_gs.updateIn(['phase'], _ => 'main'))
		.map(moveCardActions('center','left'))
	    	.map(moveCardActions('center','middle'))
	    	.map(moveCardActions('center','right'))
	    	.map(moveCardActions('back', 'left'))
	    	.map(moveCardActions('back', 'right'))
		.map(playCardActions)
		.mergeMap(updateUI({evt:"main"}))
		.mergeMap(gs => {

		    if(gs) {
			
			_gs = gs
			if(!gs.getIn(['endmainphase'])) {
			    return this.main()
			}
			else
			    _gs = _gs.setIn(['endmainphase'])
		    }
		    return of(gs)
		})
	},
	climax() {
	    let selectclimax = gs => {
		return gs.updateIn([currentplayer(gs), 'hand'], hand => {
		    return hand.map(c => {
			//			console.log(`updating ${c}`)
			return c.updateIn(['actions'], _ => {
			    return fromJS([
				{
				    exec() {
					let hand = G.hand(gs)
					let index = hand.findIndex(c1 => c1.getIn(['info','id']) === c.getIn(['info','id']))
					let card = hand.get(index)
					if(index >= 0 && isclimax(card)) {
					    return of(gs.updateIn([currentplayer(gs), 'hand'], hand => hand.delete(index)).updateIn([currentplayer(gs), 'climax'], _ => List().push(card)))
					}
					return of(gs)
				    },
				    desc: "Play climax card"
				    
				}
			    ])
			})
		    })
		})
	    }
	    return of(_gs)
		.mergeMap(updateUI({evt:"climax",when:"begin"}))
		.map(selectclimax)
		.mergeMap(updateUI({evt:"climax"}))
	    
	},
	attack() {
	    const a = AttackPhase(_gs, _ui)
	    return a.resolve()
	}
    }
}


export { ControllerFactory as default }
