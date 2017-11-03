import { Observable } from 'rxjs'
import { applyActions, clearactions, hasavailableactions, collectactivateablecards, isclimax, inactiveplayer, currentplayer, G, findcardonstage, findstageposition, iscard, dealdamage, clockDamage } from './utils'
import { drawfromdeck, refresh, applyrefreshdamage, searchwaitingroom } from './deck_utils'
import StageSelector from './stageselector'
//import DeckSelector from './deckselector'
const { of, create } = Observable;
import { Map, fromJS, List } from 'immutable'
import { Triggers, Status } from './battle_const'
import { PoolFunction, DrawFunction, TreasureFunction } from './triggerfunctions'

const AttackPhase = function(gs, ui, controller) {

//    let _attacking_card = undefined
    let _pos = undefined;
    let _attack_type = undefined;
    let _ui = ui;
    let _gs = gs;

    // check whether the card in the pos is standing
    const isstanding = (pos, gs, player)  => {
	player = player || currentplayer(gs)
	let stage = G.stage(gs, player)
	let c = undefined;
	return iscard( c= stage.getIn(pos).first()) && Status.stand(c)
    }

    const isempty = (pos, player) => {
	player = player || currentplayer(_gs);
	let c = undefined;
	return iscard(c= stage.getIn(pos).first())
    }

    const findoppos = function(pos) {
	let oppos;
	if(pos[1] === 'left')
	    oppos = ['center', 'right']
	if(pos[1] === 'middle')
	    oppos = pos
	if(pos[1] === 'right')
	    oppos = ['center', 'left']

	return oppos
    }

    const applyattackoption = (pos1, gs) => {
	if(isstanding(pos1, gs)) {
	    gs = gs.updateIn([currentplayer(gs), 'stage'], stage => {
		return stage.updateIn(pos1, pos => {
 		    return pos.update(0, card => {
			let oppos = findoppos(pos1)
			let actions ;
			let c;
			if(iscard(c = G.stage(gs, inactiveplayer(gs)).getIn(oppos).first())) {
			    
			    actions = [
				{
				    exec() {
					_attack_type = 'front'
					_pos = pos1
					return of(gs.updateIn([currentplayer(gs), 'stage'].concat(pos1), cards => cards.update(0, card => card.updateIn(['status'], _ => Status.rest()))))
					
					
				    },
				    desc:"Front"
				},
				{
				    exec() {

					_attack_type = 'side'
					_pos = pos1;
					return of(gs
						  .updateIn([currentplayer(gs), 'stage'].concat(pos1),
							    cards =>
							    cards.update(0,
									 card => card.updateIn(['status'], _ => Status.rest()).updateIn(['active','soul'], s => {
									     let o = gs.getIn([inactiveplayer(gs), 'stage'].concat(oppos))
									     if(List.isList(o) && iscard(o = o.first())) {
										 
										 let level = o.getIn(['active','level'])
										 if(typeof level === 'function')
										     level = level(gs)
										 return gs => {
										     if(typeof s === 'function') {
											 return s(gs) - level
										     }
										     return s - level;
										 }
									     }
									     return s
									 }))))


				    },
				    desc:"Side" 
				}
			    ]
			}
			else {
			    actions = [
				{
				    exec() {

					_attack_type = 'direct'
					_pos = pos1;
					return of(gs.updateIn([currentplayer(gs), 'stage'].concat(pos1), cards => cards.update(0, card => card.updateIn(['status'], _ => Status.rest()))))
				    },
				    desc:"Direct"
				}
			    ]
			}
			actions.push({
			    exec() {
				
				return of(gs)
			    },
			    desc: "pass"
			})
		    
			return card.updateIn(['actions'], _ => fromJS(actions))
		    })
		    
		})
				     
	    })
	    
	}
	// here is where things like 'disallow side attacks' should be implemented
//	let T = collectactivateablecards(gs);

	collectactivateablecards(gs).forEach( T => {
	    let f = undefined;
	    
	    if(Map.isMap(T) && (f = T.getIn(['passiveactions']))) {
		gs = f(gs,evt)
	    }
	})
	
	return gs;

    }


    const addattackoptions = function(gs) {
	let stage = G.stage(gs)
	
	let center_left = ['center','left']
	let center_middle = ['center','middle']
	let center_right = ['center', 'right']
	gs = applyattackoption(center_left, gs)
	gs = applyattackoption(center_middle, gs)
	gs = applyattackoption(center_right,gs)
	return gs
	
    }

    
    // update ui with the given event
    // evt - the event that occurred
    // func - a function to be executed by any activated action; or force the stream to continue
    const updateUI= (evt, ignoreprompt, func) => {
	return gs1 => {

	    let f = func || (o => (gs => {
		o.next(gs)
		o.complete()
	    }))
	    //	    console.log(`in update, hasavailableactions ${hasavailableactions(gs1)}`)
	    if(controller)
		controller.updategamestate(gs1)
	    return create(obs => {
		//		console.log(`in update, hasavailableactions ${hasavailableactions(gs1)}`)
		
		_ui.updateUI(applyActions(gs1, evt, _ui, f(obs)), obs, evt, ignoreprompt)
	    })
	}
    }

    
    return {
	setpos(pos) {
	    _pos = pos
	},
	attack_pos() {
	    return _pos
	},
	updateUI:updateUI,
	// runs through each phase
	resolve() {
	    return of(_gs)

	    // select to card to attack with attack
		.mergeMap(updateUI({evt:"attack_declare"}, true))
		.mergeMap(this.declare.bind(this))
		.mergeMap(updateUI({evt:"attack_select"}, true))
		.map(clearactions)
		.mergeMap(gs => {
//		    let attacking_card = _attacking_card
		    if(_pos) {
			return of(gs)
			    .mergeMap(updateUI({evt:"attack_trigger"}, true))
			    .mergeMap(gs => this.trigger(gs))
			    .map(applyrefreshdamage)
			    .mergeMap(clockDamage(ui))
			    .mergeMap(gs => {
				if(_attack_type === 'front')
				    return of(gs).mergeMap(updateUI({evt:"attack_counter"}, true))
				    .mergeMap(gs  => this.counter_attack(gs))
				return of(gs)
			    })
			    .mergeMap(updateUI({evt:"attack_damage"}, true))
			    .mergeMap(gs => this.damage(gs))
			    .map(applyrefreshdamage)
			    .mergeMap(clockDamage(ui))
			    .mergeMap(clockDamage(ui, inactiveplayer(gs)))
			    .mergeMap(gs => {
				if(_attack_type === 'direct' || _attack_type === 'side')
				    return of(gs)
				return of(gs)
				    .mergeMap(updateUI({evt:"attack_battle"}, true))
				    .mergeMap(gs => this.battle_step(gs))
			    })
			
			
		    }
		    return of(gs)
		})
 		.mergeMap(gs => {
		    
		    // true if there is no card, or the card is actually resting
		    const is_stage_resting = stack => {
			let c;
			if(List.isList(stack) && stack.size > 0 && iscard(c = stack.first())) {
			    return !Status.stand(c)
			}
			return true
		    }
		    
		    let stage_cl = gs.getIn([currentplayer(gs), 'stage', 'center','left'])
		    let stage_cm = gs.getIn([currentplayer(gs), 'stage', 'center','middle'])
		    let stage_cr = gs.getIn([currentplayer(gs), 'stage', 'center','right'])
		    _gs = gs
		    if(!(is_stage_resting(stage_cl) && is_stage_resting(stage_cm) && is_stage_resting(stage_cr))) {
			
			return this.resolve()
		    }
		    else {
			
			return of(_gs)
		    }
		})
		.mergeMap(updateUI({evt:"attack_encore"}, true))
		.mergeMap(gs => this.encore(gs))
	    
	},
	
	// selects the attacking card, and attack type
	declare(gs) {
	    return of(addattackoptions(gs))
	},
	
	trigger(gs) {
	    if(!_pos)
		return of(gs)
	    let deck = G.deck(gs)
	    
	    let attacking_card = gs.getIn([currentplayer(gs), 'stage'].concat(_pos)).first()
	    let trigger_card = deck.first();
	    gs = refresh(gs.updateIn([currentplayer(gs), 'deck'], deck => deck.shift()))
	    let prompt = undefined;
	    const stock_trigger = gs => {
		return gs.updateIn([currentplayer(gs), 'stock'], stock => stock.unshift(trigger_card))
	    }
	    if(iscard(trigger_card)) {
		let trigger_action = trigger_card.getIn(['info', 'trigger_action'])
		switch(trigger_action) {
		case Triggers.soul : {
		    attacking_card = attacking_card.updateIn(['active', 'soul'], soul => {
			return gs => {
			    if(typeof soul === 'function')
				return 1 + soul(gs)
			    return 1 + soul
			}
		    })
		    gs = stock_trigger(gs)
		}
		    break;
		case Triggers.soul2 : {
		    attacking_card = attacking_card.updateIn(['active', 'soul'], soul => {
			return gs => {
			    if(typeof soul === 'function')
				return 2 + soul(gs)
			    return 2 + soul
			}
		    })
		    gs = stock_trigger(gs)

		}
		    break;
		case Triggers.pool : {
		    //gs = fromdeckblind('stock', 'Pool')(gs)
		    prompt = ui.prompt(func => {
			return {
			    prompt:<PoolFunction onok={
				evt => {
				    
				    func(drawfromdeck(1, 'stock', gs))
				}
			    }
			    oncancel={
				evt => {
				    func(gs)
				}
			    }/>,
			    id:'pool-function'
			}
		    })
		    gs = stock_trigger(gs)
		}
		    break;
		case Triggers.salvage : {
		    prompt = ui.prompt(searchwaitingroom);
		    gs = stock_trigger(gs)

		}
		    break;
		case Triggers.draw : {
		    prompt = ui.prompt(func => {
			return {
			    id:'draw-function',
			    prompt:<DrawFunction onok={
				evet => {
				    func(drawfromdeck(1,'hand',gs))
				}
			    }
			    oncancel= {
				evt => {
				    func(gs)
				}
			    }/>
			}
		    })
		    gs = stock_trigger(gs)
		    
		}
		    break;
		case Triggers.shot :{
		    gs = stock_trigger(gs)
		}
		    break;
		case Triggers.treasure: {
		    prompt = ui.prompt(func => {
			return {
			    prompt:<TreasureFunction onok={
				evt => {
				    
				    gs = drawfromdeck(1, 'stock', gs)

				    func(gs = gs.updateIn([currentplayer(gs), 'hand'], hand => hand.push(trigger_card)))
				}
			    }
			    oncancel={
				evt => {
				    func(gs)
				}
			    }/>,
			    id:'treasure-function'
			}
		    });
		    
		    // gs = gs.updateIn([currentplayer(gs), 'hand'], hand => hand.push(trigger_card))
		    // 	.updateIn([currentplayer(gs), 'deck'], deck => {
		    // 	    if(deck.size > 0) {
		    // 		return deck.update(0, card => {
		    // 		    return card.updateIn(['actions'], _ => {
		    // 			return fromJS([
		    // 			    {
		    // 				exec() {
		    // 				    let deck = G.deck(gs)
		    // 				    let card = deck.first()
		    // 				    return  of(refresh(gs.updateIn([currentplayer(gs), 'deck'], deck => deck.shift()))
		    // 					       .updateIn([currentplayer(gs), 'stock'], stock => stock.push(card)))
						    
		    // 				},
		    // 				desc: "Treasure"
		    // 			    }
		    // 			])
		    // 		    })
		    // 		})
		    // 	    }
		    // 	    return deck;
		    // 	})
		}
		    break;
		default:
		    gs = stock_trigger(gs)
		    break;
		}
		
		gs = gs.updateIn(['triggeraction'], _ => trigger_action)
		    
	    }

	    //	    console.log(`looking at ${pos}`)
	    if(prompt)
		return prompt;
	    if(_pos)
		return of(gs.updateIn([currentplayer(gs), 'stage'].concat(_pos), cards => cards.update(0, _ => attacking_card)))
	    return of(gs)
	},
	
	counter_attack(gs) {
	    return of(gs.updateIn([inactiveplayer(gs), 'hand'], hand => {
		return hand.map(c => {
		    if(c.getIn(['info', 'counter'])) {
			return c.updateIn(['cardactions'], _ => {
			    let f = c.getIn(['availablecardactions'])
			    if(f) {

				// get the counter action
				return f(gs, {evt:"attack_counter_avail"}).map( action => {
				    return action.updateIn(['exec'], exec => {
					_ => {
					    return exec(gs, ui)
						.mergeMap(ui.updateUI({evt:"attack_counter_avail"}))
					}
				    })
				})
			    }
			    
			    
			})
		    }
		    return c
		})
	    }))
	},

	damage(gs) {
	    if(!_pos)
		return of(gs)
	    let attacking_card = gs.getIn([currentplayer(gs), 'stage'].concat(_pos)).first();
	    let soul = attacking_card.getIn(['active','soul'])
//	    let pos = findstageposition(gs, attacking_card)
	    let soulcount = soul;
	    if(typeof soul === 'function')
		soulcount = soul(gs)
	    if(_attack_type === 'direct')
		soulcount ++;
	    if(soulcount < 0) soulcount = 0
	    gs = dealdamage(soulcount, gs, inactiveplayer(gs))
	    if(gs.getIn(['trigger']) === 'shot')
		gs = dealdamage(soulcount, gs, inactiveplayer(gs), false)
	    // if(pos)
	    // 	_attacking_card = gs.getIn([currentplayer(gs), 'stage'].concat(pos)).first();
	    return of(gs);
	    
	},


	battle_step(gs) {
	    if(!_pos)
		return of(gs)
	    let attacking_card = gs.getIn([currentplayer(gs), 'stage'].concat(_pos)).first()
	    let oppos = findoppos(_pos)
	    let defending_card = G.stage(gs, inactiveplayer(gs)).getIn(oppos)
	    if(List.isList(defending_card) && iscard(defending_card = defending_card.first())) {
		let attack_power = attacking_card.getIn(['active', 'power'])
		
		let defending_power = defending_card.getIn(['active', 'power'])

		let apow = typeof attack_power === 'function' ? attack_power(gs) : attack_power;
		let dpow = typeof defending_power === 'function' ? defending_power(gs) : defending_power;
		if(apow >= dpow) {
		    defending_card = defending_card.updateIn(['status'], _ => Status.reversed())
		}
		if(dpow >= apow) {
		    attacking_card = attacking_card.updateIn(['status'], _ => Status.reversed())
		}
	    }
	    return of(gs
		      .updateIn([currentplayer(gs), 'stage'], stage => {
			  return stage.updateIn(_pos, pos => {
			      return pos.update(0, _ => attacking_card)
			  })
		      })
		      .updateIn([inactiveplayer(gs), 'stage'], stage => {
			  return stage.updateIn(oppos, pos => {
			      return pos.update(0, _ => defending_card)
			  })
		      }))
	},

	encore(gs) {

	    const applyEncoreActions = (gs, player, pos) => {
		let stock = G.stock(gs, player)
		return card => {
		    let actions = [
			{
			    exec() {
				let stage = G.stage(gs, player)
				let cards = stage.getIn(pos)
				return of(gs.updateIn([player, 'stage'], stage => {
				    return stage.updateIn(pos, _ => List())
				})
					  .updateIn([player, 'waiting_room'], wr => {
					      return cards.concat(wr)
					  }))
				
				
			    },
			    desc: "Retire"
			}
			
		    ]
		    if(stock.size > 3) {
			actions.push({
			    exec() {
			    },
			    desc: "Encore 3"
			})
		    }
		    return card.updateIn(['actions'], _ => {
			return fromJS(actions)
		    }).
			updateIn(['cardactions'], _ => {
			    let f = card.getIn(['availablecardactions'])
			    if(f) {
				return f(gs, {evt:"encore"}).map(action => {
				    return action.updateIn(['exec'], exec => {
					return _ => {
					    // TODO apply and continue
					    return exec()
					}
				    })
				})
			    }
			    return List()
			})
		    
		    
		}
	    }

	    const applyifreversed = (pos, player) => {
		player = player || currentplayer(gs)
		return gs => {
		    let cards = G.stage(gs, player).getIn(pos);
		    let card = cards.first()
	 	    if(iscard(card) && Status.reversed(card)) {
			return gs.updateIn([player, 'stage'], stage => {
			    return stage.updateIn(pos, p => {
				return p.update(0, applyEncoreActions(gs, player, pos))
			    })
			})
			
		    }
		    return gs

		}
	    }
	    
	    const updateUI = (evt) => {
		return gs => {
		    return create(obs => {
			return ui.updateUI(gs, obs, evt)
		    })
		}
		
	    }

	    const checkisreversed = (gs, player, pos) => {
		let card = gs.getIn([player, 'stage'].concat(pos))
		return List.isList(card) && iscard(card.first()) && Status.reversed(card.first())
	    }
	    
	    const hasreversed = gs => {
		let c = currentplayer(gs), o = inactiveplayer(gs)
		if(checkisreversed(gs, c, ['center', 'left']) ||
		   checkisreversed(gs, c, ['center', 'middle']) ||
		   checkisreversed(gs, c, ['center', 'right']) ||
		   checkisreversed(gs, c, ['back', 'left']) || 
		   checkisreversed(gs, c, ['back', 'right']) || 
		   checkisreversed(gs, o, ['center', 'left']) || 
		   checkisreversed(gs, o, ['center', 'middle']) ||
		   checkisreversed(gs, o, ['center', 'right']) || 
		   checkisreversed(gs, o, ['back', 'left']) ||
		   checkisreversed(gs, o, ['back', 'right'])) {
		    return this.encore(gs)
		}
		return of(gs)
	    }
	    
	    return of(gs)
		.map(applyifreversed(['center','left']))
	    	.map(applyifreversed(['center','middle']))
	    	.map(applyifreversed(['center','right']))
	    	.map(applyifreversed(['back', 'left']))
	    	.map(applyifreversed(['back','right']))
		.map(applyifreversed(['center','left'], inactiveplayer(gs)))
	    	.map(applyifreversed(['center','middle'], inactiveplayer(gs)))
	    	.map(applyifreversed(['center','right'], inactiveplayer(gs)))
	    	.map(applyifreversed(['back', 'left'], inactiveplayer(gs)))
	    	.map(applyifreversed(['back','right'], inactiveplayer(gs)))
		.mergeMap(updateUI({evt:'encore'}))
		.mergeMap(hasreversed)
	    
	    
	    
	}
    }
}

export { AttackPhase as default }
