import { Observable } from 'rxjs'
import { clearactions, hasavailableactions, collectactivateablecards, isclimax, inactiveplayer, currentplayer, G, findcardonstage, findstageposition, iscard, dealdamage, clockDamage } from './utils'
import { refresh, applyrefreshdamage, searchwaitingroom } from './deck_utils'
import StageSelector from './stageselector'
//import DeckSelector from './deckselector'
const { of, create } = Observable;
import { fromJS, List } from 'immutable'

const AttackPhase = function(gs, ui) {

    let _attacking_card = undefined
    let _pos = undefined;
    let _attack_type = undefined;
    let _ui = ui;
    let _gs = gs;

    // check whether the card in the pos is standing
    const isstanding = (pos, player)  => {
	player = player || currentplayer(_gs)
	let stage = G.stage(gs, player)
	let c = undefined;
	return iscard( c= stage.getIn(pos).first()) && c.getIn(['status']) === 'stand'
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
	if(isstanding(pos1)) {
	    gs = gs.updateIn([currentplayer(gs), 'stage'], stage => {
		return stage.updateIn(pos1, pos => {
 		    return pos.update(0, card => {
			let oppos = findoppos(pos1)
			let actions = undefined
			if(iscard(G.stage(gs, inactiveplayer(gs)).getIn(oppos).first())) {
			    actions = [
				{
				    exec() {
					_attacking_card = card
					_attack_type = 'front'
					_pos = pos1;
					return of(gs)
				    },
				    desc:"Front"
				},
				{
				    exec() {
					_attacking_card = card
					_attack_type = 'side'
					_pos = pos1;
					return of(gs)
				    },
				    desc:"Side" 
				}
			    ]
			}
			else {
			    actions = [
				{
				    exec() {
					_attacking_card = card
					_attack_type = 'direct'
					_pos = pos1;
					return of(gs)
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

	    // here is where things like 'disallow side attacks' should be implemented
	    collectactivateablecards(gs).forEach( T => {
		let f = undefined;
		if(f = T.getIn(['passiveactions'])) {
		    gs = f(gs,evt)
		}
	    })
	}
	return gs;

    }

    const fromdeckblind = (dest, desc) => {
	return gs => {
	    return gs.updateIn([currentplayer(gs), 'deck'], deck => {
		return deck.update(0, card => {
		    return card.getupdateIn(['actions'], _ => {
			return fromJS([
			    {
				exec() {
				    return of(gs)
					.map(gs => {
					    let deck = G.deck(gs)
					    let card = deck.first()
					    return refresh(gs.updateIn([currentplayer(gs),'deck'], deck => deck.shift())).updateIn([currentplayer(gs), dest], stock => stock.push(card))
					})
				},
				desc:desc
			    }
			])
		    })
		})
	    })
	}
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
	    console.log(`in update, hasavailableactions ${hasavailableactions(gs1)}`)
	    
	    return create(obs => {
		console.log(`in update, hasavailableactions ${hasavailableactions(gs1)}`)
		_ui.updateUI(gs1, obs, evt, ignoreprompt)
	    })
	}
    }

    
    return {
	setpos(pos) {
	    _pos = pos
	},

	// runs through each phase
	resolve() {
	    return of(gs)

	    // select to card to attack with attack
		.mergeMap(updateUI({evt:"attack_declare"}, true))
		.mergeMap(this.declare.bind(this))
		.mergeMap(updateUI({evt:"attack_select"}, true))
		.map(clearactions)
		.mergeMap(gs => {
		    let attacking_card = _attacking_card
		    if(attacking_card) {
			return of(gs)
			    .mergeMap(updateUI({evt:"attack_trigger"}, true))
			    .mergeMap(gs => this.trigger(gs, _attacking_card))
			    .map(applyrefreshdamage)
			    .mergeMap(clockDamage(ui))
			    .mergeMap(updateUI({evt:"attack_counter"}, true))
			    .mergeMap(gs  => this.counter_attack(gs, _attacking_card))
			    .mergeMap(updateUI({evt:"attack_damage"}, true))
			    .mergeMap(gs => this.damage(gs, _attacking_card))
			    .map(applyrefreshdamage)
			    .mergeMap(clockDamage(ui))
			    .mergeMap(clockDamage(ui, inactiveplayer(gs)))
			    .mergeMap(gs => {
				if(_attack_type === 'direct')
				    return of(gs)
				return of(gs)
				    .mergeMap(updateUI({evt:"attack_battle"}, true))
				    .mergeMap(gs => this.battle_step(gs, _attacking_card))
				    .mergeMap(updateUI({evt:"attack_encore"}, true))
				    .mergeMap(gs => this.encore(gs, _attacking_card))
			    })
			
			
		    }
		    return of(gs)
		})

	    
	},
	
	// selects the attacking card, and attack type
	declare(gs) {
	    return of(addattackoptions(gs))
	},
	
	trigger(gs, attacking_card) {
	    let deck = G.deck(gs)
	    let trigger_card = deck.first();
	    gs = refresh(gs.updateIn([currentplayer(gs), 'deck'], deck => deck.shift()))
	    let prompt = undefined;
	    if(iscard(trigger_card)) {
		let trigger_action = trigger_card.getIn(['info', 'trigger_action'])
		switch(trigger_action) {
		case "soul +1": {
		    attacking_card = attacking_card.updateIn(['active', 'soul'], soul => {
			return gs => {
			    if(typeof soul === 'function')
				return 1 + soul(gs)
			    return 1 + soul
			}
		    })
		}
		    break;
		case "soul +2":{
		    attacking_card = attacking_card.updateIn(['active', 'soul'], soul => {
			return gs => {
			    if(typeof soul === 'function')
				return 2 + soul(gs)
			    return 2 + soul
			}
		    })

		}
		    break;
		case "pool":{
		    gs = fromdeckblind('stock', 'Pool')(gs)
		}
		    break;
		case "come_back":{
		    prompt = ui.prompt(searchwaitingroom)

		}
		    break;
		case "draw":{
		    gs = fromdeckblind('hand', 'Draw')(gs)
		}
		    break;
		case "shot":{
		    
		}
		    break;
		case "treasure":{
		}
		    gs = gs.updateIn([currentplayer(gs), 'hand'], hand => hand.push(trigger_card))
			.updateIn([currentplayer(gs), 'deck'], deck => {
			    if(deck.size > 0) {
				return deck.update(0, card => {
				    return card.getIn(['actions'], _ => {
					return fromJS([
					    {
						exec() {
						    let deck = G.deck(gs)
						    let card = deck.first()
						    return  of(refresh(gs.updateIn([currentplayer(gs), 'deck'], deck => deck.shift()))
							       .updateIn([currentplayer(gs), 'stock'], stock => stock.push(card)))
						    
						},
						desc: "Treasure"
					    }
					])
				    })
				})
			    }
			    return deck;
			})
		    break;
		}
		gs = gs.updateIn(['trigger'], _ => trigger_action)
	    }
	    return of(gs)
	},
	
	counter_attack(gs, attacking_card) {
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

	damage(gs, attacking_card) {
	    let soul = attacking_card.getIn(['active','soul'])
	    let soulcount = soul;
	    if(typeof soul === 'function')
		soulcount = soul(gs)
	    if(_attack_type === 'direct')
		soulcount ++;
	    gs = dealdamage(soulcount, gs, inactiveplayer(gs))
	    if(gs.getIn(['trigger']) === 'shot')
		gs = dealdamage(soulcount, gs, inactiveplayer(gs), false)
	    return of(gs);
	    
	},


	battle_step(gs, attacking_card) {
	    let oppos = findoppos(_pos)
	    let defending_card = G.stage(gs, inactiveplayer(gs)).getIn(oppos)
	    if(List.isList(defending_card) && iscard(defending_card = defending_card.first())) {
		let attack_power = attacking_card.getIn(['active', 'power'])
		
		let defending_power = defending_card.getIn(['active', 'power'])

		let apow = typeof attack_power === 'function' ? attack_power(gs) : attack_power;
		let dpow = typeof defending_power === 'function' ? defending_power(gs) : defending_power;
		if(apow >= dpow) {
		    defending_card = defending_card.updateIn(['status'], _ => 'reversed')
		}
		if(dpow >= apow) {
		    attacking_card = attacking_card.updateIn(['status'], _ => 'reversed')
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

	encore(gs, attacking_card) {

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
	 	    if(iscard(card) && card.getIn(['status']) === 'reversed') {
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
		return List.isList(card) && iscard(card.first()) && card.first().getIn(['status']) === 'reversed'
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
		    return this.encore(gs, attacking_card)
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
