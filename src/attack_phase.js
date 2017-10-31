import { Observable } from 'rxjs'
import { isclimax, inactiveplayer, currentplayer, G, findcardonstage, findstageposition, iscard, dealdamage, clockDamage } from './utils'
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

    const applyattackoption = (pos, gs) => {
	if(isstanding(pos)) {
	    gs = gs.updateIn([currentplayer(gs), 'stage'], stage => {
		return stage.updateIn(center_left, pos => {
 		    return pos.update(0, card => {
			let oppos = findoppos(pos)
			let actions = undefined
			if(iscard(G.stage(gs, inactiveplayer(gs)).getIn(oppos).first())) {
			    actions = [
				{
				    exec() {
					_attacking_card = card
					_attack_type = 'front'
					_pos = pos;
					return of(gs)
				    },
				    desc:"Front"
				},
				{
				    exec() {
					_attacking_card = card
					_attack_type = 'side'
					_pos = pos;
					return of(gs)
				    },
				    desc:"Side" 
				}
			    ]
			}
			else
			    actions = [
				{
				    exec() {
					_attacking_card = card
					_attack_type = 'direct'
					_pos = pos;
					return of(gs)
				    },
				    desc:"Direct"
				}
			    ]
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
    
    return {
	setpos(pos) {
	    _pos = pos
	},

	// runs through each phase
	resolve() {
	    return of(gs)

	    // select to card to attack with attack
		.mergeMap(ui.updateUI({evt:"attack_declare"}))
		.mergeMap(this.declare.bind(this))
		.mergeMap(ui.updateUI({evt:"attack_select"}))
		.mergeMap(gs => {
		    let attacking_card = _attacking_card
		    if(attacking_card) {
			return of(gs)
			    .mergeMap(ui.updateUI({evt:"attack_trigger"}))
			    .mergeMap(gs => this.trigger(gs, _attacking_card))
			    .map(applyrefreshdamage)
			    .mergeMap(clockDamage(ui))
			    .mergeMap(ui.updateUI({evt:"attack_counter"}))
			    .mergeMap(gs  => this.counter_attack(gs, _attacking_card))
			    .mergeMap(ui.updateUI({evt:"attack_damage"}))
			    .mergeMap(gs => this.damage(gs, _attacking_card))
			    .map(applyrefreshdamage)
			    .mergeMap(clockDamage(ui))
			    .mergeMap(clockDamage(ui, inactiveplayer(gs)))
			    .mergeMap(gs => {
				if(_attack_type === 'direct')
				    return of(gs)
				return of(gs)
				    .mergeMap(ui.updateUI({evt:"attack_battle"}))
				    .mergeMap(gs => this.battle_step(gs, _attacking_card))
				    .mergeMap(ui.updateUI({evt:"attack_encore"}))
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
		    attacking_card = attack_card.updateIn(['active', 'soul'], soul => {
			return gs => {
			    if(typeof soul === 'function')
				return 1 + soul(gs)
			    return 1 + soul
			}
		    })
		}
		    break;
		case "soul +2":{
		    attacking_card = attack_card.updateIn(['active', 'soul'], soul => {
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
	    gs = dealdamage(soulcount, gs)
	    if(gs.getIn(['trigger']) === 'shot')
		gs = dealdamage(soulcount, gs, false)
	    return of(gs);
	    
	},


	battle_step(gs, attacking_card) {
	    let oppos = findoppos(_pos)
	    let defending_card = G.stage(gs, inactiveplayer(gs)).getIn(oppos)
	    if(iscard(defending_card)) {
		let attack_power = attacking_card.getIn(['active', 'power'])
		
		let defending_power = defending_card.getIn(['active', 'power'])

		let apow = typeof attack_power === 'function' ? attack_power(gs) : attack_power;
		let dpow = typeof defending_power === 'function' ? defending_power(gs) : defending_power;
		if(apow >= dpow) {
		    defending_card = defending_card.getIn(['status', 'reversed'])
		}
		if(dpow >= apow) {
		    attcack_card = attack_card.getIn(['status', 'reversed'])
		}
	    }
	    return of(gs.updateIn([currentplayer(gs), 'stage'], stage => {
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

	    const applyEncoreActions = (obs, player, pos) => {
		return card => {
		    return card.updateIn(['actions'], _ => {
			return fromJS([
			    {
				exec() {
				    
				},
				desc: "3 Encore"
			    },
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
			    
			])
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
		    if(iscard(card) && card.getIn(['status','reversed'])) {
			return of(gs)
			    .mergeMap(gs => {
				return gs.updateIn([player, 'stage'], stage => {
				    return stage.updateIn(pos, p => {
					return p.update(0, applyEncoreActions(obs, player, pos))
				    })
				})
				
			    })
			    .mergeMap(ui.updateUI({evt:"encore"}))
			    .subscribe(gs => {
				//
			    })
			
		    }
		    return of(gs)

		}
	    }
	    
	    const updateUI = evt => {
		return gs => {
		    return create(obs => {
			ui.updateUI(gs, obs, evt)
		    })
		    
		}
	    }
	    
	    return of(gs)
		.mergeMap(applyifreversed(['center','left']))
		.mergeMap(updateUI({evt:'encore',pos:['center','left']}))
		.mergeMap(applyifreversed(['center','middle']))
		.mergeMap(updateUI({evt:'encore',pos:['center','middle']}))
		.mergeMap(applyifreversed(['center','left']))
		.mergeMap(updateUI({evt:'encore',pos:['center','right']}))
		.mergeMap(applyifreversed(['back','left']))
		.mergeMap(updateUI({evt:'encore',pos:['back','left']}))
		.mergeMap(applyifreversed(['back','right']))
		.mergeMap(updateUI({evt:'encore',pos:['back','right']}))
	    
	    	.mergeMap(applyifreversed(['center','left'], inactiveplayer(gs)))
		.mergeMap(updateUI({evt:'encore',pos:['center','left']}))
		.mergeMap(applyifreversed(['center','middle'], inactiveplayer(gs)))
		.mergeMap(updateUI({evt:'encore',pos:['center','middle']}))
		.mergeMap(applyifreversed(['center','left'], inactiveplayer(gs)))
		.mergeMap(updateUI({evt:'encore',pos:['center','right']}))
		.mergeMap(applyifreversed(['back','left'], inactiveplayer(gs)))
		.mergeMap(updateUI({evt:'encore',pos:['back','left']}))
		.mergeMap(applyifreversed(['back','right'], inactiveplayer(gs)))
		.mergeMap(updateUI({evt:'encore',pos:['back','right']}))
	    
	}
    }
}

export { AttackPhase as default }
