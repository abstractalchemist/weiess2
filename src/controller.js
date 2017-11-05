import { Observable } from 'rxjs'
import React from 'react'
import StageSelector from './stageselector'
const { of, create } = Observable;
import { isImmutable, List, fromJS } from 'immutable'
import GamePositions, { currentplayer, inactiveplayer } from './game_pos'
import { applyActions, reset, shuffle, debug, iscard, findopenpositions, isevent, isclimax, canplay, payment, clockDamage, clearactions, hasavailableactions,  updateUIFactory, cardviewer } from './utils'
import { collectactivateablecards } from './modifiers'
import { G, validatefield } from './field_utils'
import { refresh, applyrefreshdamage, searchdeck, drawfromdeck } from './deck_utils'
import AttackPhase from './attack_phase'
import GamePhases from './game_phases'
import { Status } from './battle_const'
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

  continuous: {
     power(card,gs)
     soul(card,gs)
     level(card,gs)
     cost(card,gs)
 }

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
		let dest = gs.getIn([currentplayer(gs), 'stage', deststage, destpos])
		if(List.isList(dest) && dest.size > 0) {
		    gs = gs.updateIn(GamePositions.waiting_room, cards => dest.concat(cards))
		}
		gs = gs.updateIn([currentplayer(gs), 'stage', deststage, destpos], cards => {
		    return cards.insert(0, card)
		})
	    }
	    return gs
	}

    }

    let updateUI;
    
    return {


	// initializes a game; assumes 50 cards in the deck
	initgame(gs) {

	    if(gs.getIn([currentplayer(gs), 'deck']).size < 50 || gs.getIn([inactiveplayer(gs), 'deck']).size < 50)
		throw "decks not correct"
	    const addhandprompts = (gs, player) => {
		return gs.updateIn([player, 'hand'],
				   hand => {
				       return hand.map(card => {
					   return card.updateIn(['actions'], _ => fromJS([
					       {
						   
						   exec() {
						       return of(gs)
						       
							   .mergeMap(gs => {
							       let hand = G.hand(gs, player)
							       let index = hand.findIndex(c => c.getIn(['info', 'id']) === card.getIn(['info','id']))
							       if(index >= 0) {
								   let c = hand.get(index)
								   let deck = G.deck(gs, player)

								   // we don't use draw here since we assume there is a full deck loaded
								   return gs
								       .updateIn([player, 'hand'], _ => {
									   hand =hand.delete(index)
									   if(deck.size > 0)
									       return hand.unshift(deck.first())
									   return hand
								       })
								       .updateIn([player, 'waiting_room'], wr => wr.unshift(c))
								       .updateIn([player, 'deck'], deck => deck.size > 0 ? deck.shift() : deck)
							       }
							   })
						   },
						   desc: "Discard"
					       }]))
					   
					   
				       })
				       
				   })
	    }
	    
	    gs = drawfromdeck(5, 'hand', gs, _ => {}, currentplayer(gs))
	    gs = drawfromdeck(5, 'hand', gs, _ => {}, inactiveplayer(gs))
	    gs = addhandprompts(gs, currentplayer(gs))
	    gs = addhandprompts(gs, inactiveplayer(gs))
	    return of(gs)
		.mergeMap(updateUI({evt:"init"}))
	},

	updategamestate(gs) {
	    if(gs !== undefined) {
		validatefield(gs)
		_gs = gs;
		_ui.updateUI(_gs)
	    }
	},

	// function to regster the ui to call back to
	registerUI(ui) {
	    _ui = ui;
	    updateUI = updateUIFactory(_ui)
	},


	// this should do some preinitialization of stuff
	initializeGS() {
	    
	},

	// called when current player ends the current phase
	next() {
	    let currentphase = _gs.getIn(['phase'])
	    switch(currentphase) {
	    case GamePhases.standup.id: {
		this.draw().subscribe(
		    gs => {
			_gs = gs
		    },
		    err => {
			alert(err)
		    },
		    _ => {
			_ui.updateUI(_gs)
		    })
		
	    }
		break;
	    case GamePhases.draw.id : {
		this.clock().subscribe(
		    gs => {
			_gs = gs
		    },
		    err => {
			alert(err)
		    },
		    _ => {
			_ui.updateUI(_gs)
		    })
	    }
		break;
	    case GamePhases.clock.id : {
		this.main().subscribe(
		    gs => {
			_gs = gs
		    },
		    err => {
			alert(err)
		    },
		    _ => {
			_ui.updateUI(_gs)
		    })
	    }
		break;
	    case GamePhases.main.id : {
		this.climax().subscribe(
		    gs => {
			_gs = gs
		    },
		    err => {
			alert(err)
		    },
		    _ => {
			_ui.updateUI(_gs)
		    })
	    }
		break;
	    case GamePhases.climax.id: {
		this.attack().subscribe(
		    gs => {
			_gs = gs
		    },
		    err => {
			throw err;
		    },
		    _ => {
			_ui.updateUI(_gs)
		    })
	    }
		break;
	    case GamePhases.attack.id: {
		_gs = reset(_gs.updateIn(['turn'], turn => turn + 1))
		_ui.updateUI(_gs)
	    }
	    case GamePhases.not_started.id:
	    default: {
		// undefined, so start
		this.standup().subscribe(
		    gs => {
			_gs = gs
		    },
		    err => {
			throw err;
		    },
		    _ => {
			//			console.log(G.climax(_gs))
			
			_ui.updateUI(_gs)
			
		    })
	    }
		break;
	    }
	},


	

	// called when the current player enters the standup phase
	standup() {
	    let standcard = cards => cards.update(0, card => {
		if(iscard(card))
		    return card.updateIn(['status'], _ => Status.stand())
		return card
	    })


	    let standLC = gs => gs.updateIn([currentplayer(gs), 'stage', 'center', 'left'], standcard)
	    
	    let standCC = gs => gs.updateIn([currentplayer(gs), 'stage', 'center', 'middle'], standcard)

	    let standRC = gs => gs.updateIn([currentplayer(gs), 'stage', 'center', 'right'], standcard)
	    let player = currentplayer(_gs)
	    return of(GamePhases.standup.set(_gs))
		.map(clearactions)
		.mergeMap(updateUI(GamePhases.standup.start()))
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
	    return of(GamePhases.draw.set(_gs))
		.map(clearactions)
		.mergeMap(updateUI(GamePhases.draw.start()))
		.mergeMap(cardviewer(_ui))
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
	    return of(GamePhases.clock.set(_gs))
		.map(clearactions)
	    	.mergeMap(updateUI(GamePhases.clock.start(), true))
		.map(clock)
	    	.mergeMap(updateUI({ evt: "clock" }))
		.map(gs => {
		    let hand = G.hand(gs)
		    let card = hand.findIndex(c => clockIt === c.getIn(['info','id']))
		    if(card >= 0) {
			let c = hand.get(card)
			
			gs= gs.updateIn([currentplayer(gs), 'hand'], hand => hand.delete(card))
			    .updateIn([currentplayer(gs), 'clock'], clock => iscard(c) ? clock.insert(0, c) : clock)
			gs = drawfromdeck(2, 'hand', gs);
			
			
		    }
		    return gs;
		    
		})
	    
	},

	// this is called recursively for after each main turn
	main() {

//	    console.log('running main')
	    let moveCardActions = (srcstage, srcpos) => {
		return gs => {
		    //		    console.log(`adding move phase to ${srcstage} => ${srcpos} with gs ${gs}`)
		    return gs.updateIn([currentplayer(gs), 'stage', srcstage, srcpos], cards => cards.update(0, card => {
			if(iscard(card)) {
//			    console.log(`adding move to ${card.getIn(['info','id'])}`)
			    return card.updateIn(['actions'], _ => fromJS([
				{
				    exec() {
					return _ui.prompt(obs => {
					    return {
						id:'stage-select',
						prompt: 
						    <StageSelector onselect={
							([deststage, destpos]) => {
							    let cardpos = gs.getIn([currentplayer(gs), 'stage', srcstage, srcpos])
							    let carddes = undefined
							    if(destpos) {
								carddes = gs.getIn([currentplayer(gs), 'stage', deststage, destpos])
								
								
								// all cards here go into the waiting room
								if(iscard(carddes.first())) {
								    
								    gs = gs.updateIn([currentplayer(gs), 'waiting_room'], waiting_room => carddes.concat(waiting_room))
								}
							    }
							    _ui.closeCurrentPrompt();
							    let moveRx;
							    if(destpos) {
								moveRx = of(gs
									    .setIn([currentplayer(gs), 'stage', deststage, destpos], cardpos)
									    .setIn([currentplayer(gs), 'stage', srcstage, srcpos], List()))
							    }
							    else {
								moveRx = of(gs
									    .updateIn([currentplayer(gs), deststage], wr => cardpos.concat(wr)))
							    }
							    
							    return moveRx.mergeMap(updateUI({ evt: "move", id:cardpos.first().getIn(['info','id']) }, true))
								.subscribe(
								    gs => {
									obs(gs)
								    },
								    err => {
									alert(err)
								    },
								    _ => {
								    })


							}
						    } openpositions={[['center','left'],
								      ['center','middle'],
								      ['center','right'],
								      ['back','left'],
								      ['back','right'],
								      ['waiting_room', '']
								     ]}/>
					    }
					})
					
				    },
				    desc: "Move"
				}
			    ]))
			}
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
							    .map(clearactions)
							    .do(_ => _ui.prompt(undefined))
							    .mergeMap(updateUI({ evt: "play", id:h.getIn(['info','id']) }, true))
							    .subscribe(
								gs => {
								    obs(gs)
								},
								err => {
								    alert(err)
								},
								_ => {
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
					    id:'stage-select'
					}
				    })
				    
				},
				desc: "Play"
			    }
			]))
		    return h;
		}))
		
	    }

	    return of(GamePhases.main.set(_gs))

		.map(clearactions)
//	    	.do(_ => console.log('setting main'))
		.mergeMap(updateUI(GamePhases.main.start(), true))
		.do(gs => _gs = gs)
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
	    return of(GamePhases.climax.set(_gs))
		.map(clearactions)
		.mergeMap(updateUI(GamePhases.climax.start(), true))
		.map(selectclimax)
		.mergeMap(updateUI({evt:"climax"}))
		.mergeMap(gs => {
		    _gs = gs;
		    return of(gs);
		})
	    
	},
	attack() {

	    return of(GamePhases.attack.set(_gs))
		.map(clearactions)
		.mergeMap(updateUI(GamePhases.attack.start()))
		.mergeMap(gs => {
		    _gs = gs;
		    const a = AttackPhase(gs, _ui, this)
		    return a.resolve()
			.mergeMap(gs => {
			    _gs = gs
			    return of(gs)
			})
		})
	}
    }
}


export { ControllerFactory as default }
