import { Observable } from 'rxjs'
import { currentplayer, G, findcardonstage, findstageposition, iscard, refresh } from './utils'
import StageSelector from './stageselector'
import DeckSelector from './deckselector'
const { of } = Observable;
import { fromJS } from 'immutable'

const AttackPhase = function(gs, ui) {

    let _attacking_card = undefined
    let _pos = undefined;
    let _ui = ui;
    let _gs = gs;

    // check whether the card in the pos is standing
    const isstanding = (pos, player)  => {
	player = player || currentplayer(_gs)
	let c = undefined;
	return iscard(c= stage.getIn(pos).first()) && c.getIn(['status']) === 'stand'
    }

    const isempty = (pos, player) => {
	player = player || currentplayer(_gs);
	let c = undefined;
	return iscard(c= stage.getIn(pos).first())
    }

    const applyattackoption = (pos, gs) => {
	if(isstanding(pos)) {
	    gs = gs.updateIn([currentplayer(gs), 'stage'], stage => {
		return stage.updateIn(center_left, pos => {
		    return pos.update(0, card => {
			return card.updateIn(['actions'], _ => fromJS([
			    {
				exec() {
				    _pos = pos
				    _attacking_card = card;
				    
				    // no stage changes occur, just go
				    return of(gs)
				},
				desc: "Attack"
			    }
			]))
			
		    })
		})
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
	gs = applyattackoption(center_midde, gs)
	gs = applyattackoption(center_right,gs)
	return gs
	
    }   
    
    return {


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
			    .mergeMap(ui.updateUI({evt:"attack_counter"}))
			    .mergeMap(gs  => this.counter_attack(gs, _attacking_card))
			    .mergeMap(ui.updateUI({evt:"attack_damage"}))
			    .mergeMap(gs => this.damage(gs, _attacking_card))
			    .mergeMap(ui.updateUI({evt:"attack_battle"}))
			    .mergeMap(gs => this.battle_step(gs, _attacking_card))
			    .mergeMap(ui.updateUI({evt:"attack_encore"}))
			    .mergeMap(gs => this.encore(gs, _attacking_card))
			
			
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
		gs = gs.updateIn([currentplayer(gs), 'waiting_room'], wr => {
		    return wr.update(0, card => {
			return card.updateIn(['actions'], _ => {
			    return fromJS([
				{
				    exec() {
					return ui.prompt(func => {
					    return { id:'deck-selector',
						     prompt:<DeckSelector />
						   }
					})
				    },
				    desc: "Search"
				}
			    ])
			})
		    })
		})
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
		    })
		break;
	    }
	    gs = gs.updateIn(['trigger'], _ => trigger_action)
	    return of(gs)
	},
	
	counter_attack(gs, attacking_card) {
	},

	damage(gs, attacking_card) {
	},

	battle_step(gs, attacking_card) {
	},

	encore(gs, attacking_card) {
	}
    }
}

export { AttackPhase as default }
