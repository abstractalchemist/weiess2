import { expect } from 'chai'
import ControllerFactory from '../src/controller'
import GameStateFactory from '../src/game_state'
import GamePositions, { currentplayer } from '../src/game_pos'
import {  findcardonstage, debug, hasavailableactions, payment } from '../src/utils'
import { List, fromJS } from 'immutable'
import { iscard } from '../src/field_utils'
import { init, basecard, basestack, createprompt } from './utils'
import { Observable } from 'rxjs'
const { create,of }  = Observable;
import { mount } from 'enzyme'
import brainstorm, { search } from '../src/actions/brainstorm'

import G, { C } from '../src/getter'

describe('ControllerFactory', function() {
    it('standup', function(done) {
	let [gf, controller] = init('standup', 0)
	controller.updategamestate(gf.setIn(['phase'], 'standup')
				   .updateIn([currentplayer(gf), 'stage', 'center'], center => {
				       return center.setIn(['left'], basestack())
					   .setIn(['middle'],basestack())
					   .setIn(['right'], basestack())
 				   }));

	controller.standup()
	    .subscribe(
		gs => {
		    gf = gs;
		},
		err => {
		    done(err)
		},
		_ => {
		    //console.log(gf)
		    
		    expect(C.status(gf.getIn([currentplayer(gf), 'stage','center','left']))).to.equal('stand')
		    expect(C.status(gf.getIn([currentplayer(gf), 'stage','center','middle']))).to.equal('stand')
		    expect(C.status(gf.getIn([currentplayer(gf), 'stage','center','right']))).to.equal('stand')
		    done()
		})
    })
    it('standup no stage cards', function(done) {
	//	let gs, controller;
	let ui;
	let [gs, controller ] = init('standup', 0)

	controller.standup()
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    done()
		})
    })
    it('draw no cards', function(done) {
	let ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs)) {
		    obs.next(gs)
		    obs.complete()
		}
	    },

	    prompt(func) {
		return create(obs => {
		    let {prompt, id} = func(gs => {
			obs.next(gs)
			obs.complete()
		    })
		    const p = mount(prompt)
		    p.find('#card-viewer-ok').simulate('click')
		})
	    },

	    closeCurrentPrompt() {
	    }
	}

	let [gs, controller] = init('draw', 0, ui)
	
	expect(G.hand(gs).size).to.equal(0)
	expect(G.deck(gs).size).to.equal(0)
	controller.draw()
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(G.hand(gs).size).to.equal(0)
		    done()
		})
	
    })

    it('draw', function(done) {
	let ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs) && obs) {
		    obs.next(gs)
		    obs.complete()
		}
	    },

	    prompt(func) {
		return create(obs => {
		    let {prompt, id} = func(gs => {
			obs.next(gs)
			obs.complete()
		    })
		    const p = mount(prompt)
		    p.find('#card-viewer-ok').simulate('click')
		})
	    },

	    closeCurrentPrompt() {
	    }
	}

	let [gs, controller] = init('draw', 0, ui);
	controller.updategamestate(gs = gs.updateIn([currentplayer(gs), 'deck'], deck => deck.push(basecard(), basecard())))
	
	expect(G.deck(gs).size).to.equal(2)
	expect(G.hand(gs).size).to.equal(0)
	controller.draw()
	    .subscribe(
		g => {
		    gs = g;
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(G.deck(gs).size).to.equal(1)
		    expect(G.hand(gs).size).to.equal(1)
		    done()
		})

    })

    it('clock no cards', function(done) {
	let [gs, controller] = init('clock', 0)
	controller.clock()
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(G.clock(gs).size).to.equal(0)
		    done()
		})
    })
    
    it('clock', function(done) {
	let card = basecard()
	let [gs, controller] = init('clock', 0, {
	    updateUI(gs, obs, evt) {
		//		console.log(` has gs ${gs !== gs}, obs ${obs}, evt ${evt}`)
		if(hasavailableactions(gs)) {
//		    console.log('looking at available actions')
		    let hand = gs.getIn([currentplayer(gs),'hand'])
		    let action = C.firstaction(hand)
		    if(action) {
			console.log("******************************************** Running clock action ************************************")
			action().subscribe(gs => {
			    obs.next(gs)
			    obs.complete()
			})
		    }
		}
		else {
//		    console.log(` no available actions`)
		    if(obs) {
			obs.next(gs)
			obs.complete()
		    }
		}
	    }
	})
	controller.updategamestate(gs = gs.updateIn([currentplayer(gs), 'hand'], hand => hand.push(card)))

	controller.clock()
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(gs.getIn([currentplayer(gs), 'clock']).size).to.equal(1)
		    done()
		})
    })

    xit('main - play a card', function(done) {
	//	let passes = 0;
	let [gs, controller] = init('main', 0, {
	    updateUI(gs, obs, evt) {
		
		let hand = G.hand(gs)
		let hasavail;
		if(hasavail  = hasavailableactions(gs, 'hand')) {
//		    console.log('process actions')
		    let card = hand.first();
		    
		    let exec = undefined;
		    if(exec = C.firstaction(card)) {
		 	//bconsole.log(`execing ${exec}`)
		// 	// exec called means this card is played
		 	exec().subscribe(gs => {
		 	    obs.next(gs)
		 	    obs.complete();
		 	})
		    }
		//     else if(obs) {
			
		// 	obs.next(gs)
		// 	obs.complete()
		//     }
		}

		// // the test empties the hand, so we quite
 		else if(obs) {
//		    console.log(`has actions: ${hasavail}`)
		    obs.next(gs.setIn(['endmainphase'], true))
		    obs.complete()
		}
	    },
	    prompt(promptfunc) {
		return create(obs => {
 		    let { prompt, id } = promptfunc(gs => {
			obs.next(gs)
			obs.complete()
		    })
		    mount(prompt).find('#ok').simulate('click')
		})
	    },
	    closeCurrentPrompt() {
	    }
	})
	controller.updategamestate(gs = gs.updateIn([currentplayer(gs), 'hand'],
						    hand => hand.push(basecard(1000, 0)
								      .updateIn(['info','level'], _ => 0)
								      .updateIn(['active','level'], _ => 0)
								      .updateIn(['passiveactions'], _ => {
							return (gs, evt) => {
//							    console.log(`************************************* running ${evt.evt}`)
							    if(evt.evt === 'main' && evt.id === 0) {
								
								let [card, pos] = findcardonstage(gs, evt.id)
								
								if(iscard(card)) {
								
								    return gs.updateIn([currentplayer(gs), 'stage'], stage => {
									return stage.updateIn(pos, c => {
									    return c.update(0, card => {
										return card.updateIn(['active','power'], power => {
										    return gs => {
											if(typeof power === 'function')
											    return power(gs) + 1000
											return power + 1000
										    }
										})
									    })
									})
								    })
								}
								else {}
//								    console.log(`passive actions not applied ont ${evt.evt}, ${evt.id}`)
							    
								
							    }
							    return gs;
							}
						    }))))

	controller.main()
	    .subscribe(
		g => {
		    if(g) {
			gs = g
		    }
		    
		},
		err => {
		    done(err)
		},
		_ => {
		    let c = undefined;
		    expect(iscard(c = gs.getIn([currentplayer(gs), 'stage', 'center','left']).first())).to.be.true;
		    
		    expect(c.getIn(['active', 'power'])).to.be.equal(1000)
		    done()
		})
	
    })

    xit('main - move a card', function(done) {
	let [gs, controller] = init('main', 0, {
	    updateUI(gs, obs, evt) {
		if(hasavailableactions(gs)) {
		    let stage = gs.getIn([currentplayer(gs), 'stage','center','middle'])
		    let card = stage.first();
		    if(iscard(card)) {
			let exec = C.firstaction(card)

			// exec called means we move this card
			if(exec)
			    exec().subscribe(gs => {
				obs.next(gs)
				obs.complete()
			    })
		    }
		    
		    // since the test is to move a single card, we just quit here
		    else {
			obs.next(gs.setIn(['endmainphase'], true))
			
			obs.complete()
		    }
		}
		else if(obs) {
		    obs.next(gs)
		    obs.complete()
		}
	    },
	    prompt:createprompt()
	})
	controller.updategamestate(gs = gs.updateIn([currentplayer(gs), 'stage', 'center', 'middle'], stage => stage.push(basecard().updateIn(['info','level'], _ => 0))))

	controller.main()
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    // can't really check anything..........
		    done()
		})
	
    })
    xit('main - activated ability ( brainstorm )', function(done) {
	let [gs, controller] = init('main', 0, {
	    updateUI(gs, obs, evt) {
		//		console.log(`entering update with gs? ${gs !== undefined}, ${obs}, ${evt}`)
		let stage = gs.getIn([currentplayer(gs), 'stage','center','middle'])
		let card = stage.first();
		if(hasavailableactions(gs)) {// && evt.when !== "start") {
		    
		    let cardactions = card.getIn(['cardactions'])
		    if(List.isList(cardactions) && cardactions.size > 0) {

			let cardaction = cardactions.first()
			
			expect(cardaction.getIn(['shortdesc'])).to.equal("Brainstorm")
			let stock = G.stock(gs)
			if(stock.size >= 1) {
			    let exec = cardaction.getIn(['exec'])
			    //			    console.log(cardaction)
			    let d = exec(gs, {})
			    d
				.subscribe(
				    gs => {
					obs.next(gs)
					obs.complete()
				    })
			}
			else {
			    obs.next(gs)
			    obs.complete()
			}
		    }
		    else {
			//			console.log(`no card actions`)
			obs.next(gs)
			obs.complete()
		    }
		    
		}
		

		// since the test is to move a single card, we just quit here
		else if(obs) {
		    //		    console.log(`no available actions`)
		    obs.next(gs)
		    obs.complete()
		}
		else {
//		    console.log(`no obs`)
		}
	    },
	    prompt:createprompt()
	})
	controller.updategamestate(gs = gs
				   .updateIn([currentplayer(gs), 'stock'], stock => stock.push(basecard()))
				   .updateIn([currentplayer(gs), 'stage', 'center', 'middle'],
					     stage => stage.push(basecard()
								 .updateIn(['info','level'], _ => 0)
								 .updateIn(['availablecardactions'], _ =>
									   (gs,evt) => {
									       
									       //									    throw "stacktrace"
									       let stock = G.stock(gs)
									       if(stock.size >= 1 && (evt && evt.evt === 'main' && evt.when !== 'start')) {
										   return fromJS([
										       {
											   exec(gs,ui) {
											       return brainstorm(payment(1), search())(gs, ui)
											   },
											   desc:"Pay 1 from Stock, Draw 4 cards; for each climax, search deck for character card;  4 cards to waiting room",
											   shortdesc:"Brainstorm"
										       }
										   ])
									       }
									       return List()
									   }))))

	controller.main()
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    done()
		})
	
    })

    
    it('climax', function(done) {
	let [gs, controller] = init('climax', 0,  {
	    updateUI(gs, obs, evt) {
		let hasactions = hasavailableactions(gs)
		//		console.log(`has actions ${hasactions}`)
		if(hasactions) {
		    let hand;
		    let climax;
		    let exec;
		    
		    if((hand = G.hand(gs)) && (climax = hand.first()) && (exec = C.firstaction(climax))) {
			//			expect(evt.evt).to.equal('climax')
			
			// we exec this to 'play' the card
			exec().subscribe(gs => {
			    obs.next(gs)
			    obs.complete()
			})
			
		    }
		    else {
			obs.next(gs)
			obs.complete()
		    }
		}
		if(obs) {
		    obs.next(gs)
		    obs.complete()
		}
	    }	    
	})
	controller.updategamestate(gs.updateIn([currentplayer(gs), 'hand'], hand => hand.push(basecard())))
	
	controller.climax()
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    //		    console.log(gs)
		    let climaxarea = G.climax(gs)
		    expect(climaxarea.size).to.equal(1)
		    done()
		})
	
    })
})
