import { Observable } from 'rxjs'
import React from 'react'
import StageSelector from './stageselector'
const { of, create } = Observable;
import { isImmutable, List, fromJS } from 'immutable'
import { shuffle, debug, iscard, currentplayer, findopenpositions, collectactivateablecards, isevent, refresh, isclimax } from './utils'

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
         exec: return Observable
	 desc:
      }]
   },
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
    let _gs = game_state;


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
								 let cardactions = f(gs, evt)
								 return cardactions.map( action => {
								     return action.updateIn(['exec'], exec => {
									 return _ => {
									     exec(gs)
										 .subscribe(gs => {
										     if(next)
											 next(gs)
										 })
									     
									 }
									 
								     })
								 })
							     }
							 })
						     }
						     return l
						 })
									  

	

	
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
		return level.map(l => l.updateIn(['cardactions'], _ => l.getIn(['availablecardactions'])(gs)))
	    })
	    .updateIn([currentplayer(gs), 'clock'], clock => {
		return clock.map(l => l.updateIn(['cardactions'], _ => l.getIn(['availablecardactions'])(gs)))
	    })
	    .updateIn([currentplayer(gs), 'memory'], memory => {
		return memory.map(l => l.updateIn(['cardactions'], _ => l.getIn(['availablecardactions'])(gs)))
	    })
	    .updateIn([currentplayer(gs), 'waiting_room'], waiting_room => {
		return waiting_room.map(l => l.updateIn(['cardactions'], _ => l.getIn(['availablecardactions'])(gs)))
	    })
	
	
    }
    
    // update ui with the given event
    // evt - the event that occurred
    // func - 
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

    let canplay = (gs, h) => {

	// can play if level 0
	return h.getIn(['info','lvl']) === 0 ||

	// have the stock
	( h.getIn(['info', 'cost']) <= gs.getIn([currentplayer(gs), 'stock']).size &&

	  // color is in level or clock
	  ( gs.getIn([currentplayer(gs), 'level']).map(c => c.getIn(['info','color'])).includes( h.getIn(['info', 'color']) ) ||
	    gs.getIn([currentplayer(gs), 'clock']).map(c => c.getIn(['info','color'])).includes( h.getIn(['info', 'color']) ) ) &&

	  // and current level ( this is a function since continous abilites are typically a function of game_state )
	  gs.getIn([currentplayer(gs), 'level']).size >= h.getIn(['active','level'])(gs) )
    }


    let playCard = (gs, card, deststage, destpos) => {
	if(canplay(gs, card)) {
 	    let cost = card.getIn(['info','cost'])

	    // delete the card from the hand
	    gs = gs.updateIn([currentplayer(gs), 'hand'], hand=> {
		let index = hand.findIndex(c => c.getIn(['info','id']) === card.getIn(['info','id']))
		return hand.delete(index)
	    })
	    
	    // subtract the cost
	    let stock = gs.getIn([currentplayer(gs), 'stock'])
	    let payment = stock.slice(0, cost)
	    let rem = stock.slice(cost)

	    if(deststage === 'event') {

		////////////// TODO ////////////////////
	    }
	    else {
		gs = gs.updateIn([currentplayer(gs), 'stage', deststage, destpos], cards => {
		    return cards.insert(0, card)
		})
	    }
	    return gs.updateIn([currentplayer(gs), 'stock'], rem)
		.updateIn([currentplayer(gs), 'waiting_room'], payment)
	}

    }

    
    return {

	updategamestate(gs) {
	    if(gs !== undefined)
		_gs = gs;
	},

	// function to regster the ui to call back to
	registerUI(ui) {
	    _ui = ui;
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
		gs = refresh(gs)

		// deck should be non-zero
		let deck = gs.getIn([currentplayer(gs), 'deck'])
		
		let card = deck.first();
		return refresh(gs.updateIn([currentplayer(gs), 'hand'], hand => iscard(card) ? hand.push(card) : hand)
			       .updateIn([currentplayer(gs), 'deck'], deck => deck.shift()))
	    }
	    return of(_gs.updateIn(['phase'], _ => 'draw'))
		.map(drawIt)
		.mergeMap(gs => {
		    if(gs.getIn(['applyrefreshdamage'])) {
			let card = gs.getIn([currentplayer(gs), 'deck'])
			return of(gs.updateIn(['applyrefreshdamage'], false)
				  .updateIn([currentplayer(gs), 'deck'], deck => deck.shift())
				  .updateIn([currentplayer(gs), 'clock'], clock => iscard(card) ? clock.insert(0, card) : clock))
		    }
		    return of(gs)
		})
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
		    let hand = gs.getIn([currentplayer(gs), 'hand'])
		    let card = hand.findIndex(c => clockIt === c.getIn(['info','id']))
		    let c = hand.get(card)
		    return gs.updateIn([currentplayer(gs), 'hand'], hand => hand.delete(card))
			.updateIn([currentplayer(gs), 'clock'], clock => iscard(c) ? clock.insert(0, c) : clock)
		    
		})
	    
	},

	// this is called recursively for after each main turn
	main() {

	    let action = undefined;

	    
	    
	    let moveCardActions = (srcstage, srcpos) => {
		return gs => {
		    return gs.updateIn([currentplayer(gs), 'stage', srcstage, srcpos], cards => cards.update(0, card => {
			if(iscard(card))
			    return card.updateIn(['actions'], _ => fromJS([
				{
				    exec() {
					ui.prompt(<StageSelector onselect={
					    ([deststage, destpos]) => {
						action = gs => {
						    let cardpos = gs.getIn([currentplayer(gs), srcstage, srcpos])
						    let carddes = gs.getIn([currentplayer(gs), deststage, destpos])

						    // all cards here go into the waiting room
						    if(iscard(carddest.first())) {
							// shift into waiting room
							gs = gs.updateIn([currentplayer(gs), 'waiting_room'], waiting_room => waiting_room.unshift(carddes))
						    }

						    return gs.setIn([currentplayer(gs), deststage, despos], cardpos)
						}
					    }
					} openpositions={[['center','left'],
							  ['center','middle'],
							  ['center','right'],
							  ['back','left'],
							  ['back','right']]}/>)
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
			return h.updateIn(['actions'], [
			    {
				exec() {
				    ui.prompt(<StageSelector onselect={
					([deststage, destpos]) => {
					    action = gs => {
					
						return of(playcard(gs, h, deststage, destpos))
					    }
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
				    } />)
				    
				},
				desc: "Play"
			    }
			])
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
		.mergeMap(updateUI({evt:"main"}, obs => {
		    return gs => {
			action = gs => {
			    obs.next(gs)
			}
		    }
		}))
		.mergeMap(gs => {
		    if(action) {
			_gs = action(gs);
		    }
		    return this.main()
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
					let hand = gs.getIn([currentplayer(gs), 'hand'])
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
			
	}
    
	
    }
}


export { ControllerFactory as default }
