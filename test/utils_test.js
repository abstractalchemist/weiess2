import { expect } from 'chai'
import { applyActions ,debug, iscard, findopenpositions, isevent, isclimax, canplay, payment, findcardonstage, findstageposition, G, dealdamage, clockDamage, hasavailableactions, clearactions, reset, applyAutomaticAbilities  } from '../src/utils'
import { validatefield } from '../src/field_utils'
import GameStateFactory from '../src/game_state'
import { basecard, basestack, init } from './utils'
import GamePositions, { currentplayer, inactiveplayer } from '../src/game_pos'
import { Map, fromJS, List } from 'immutable'

import { Observable } from 'rxjs'
const { create } = Observable;
import { mount } from 'enzyme'
import React from 'react'
describe('utils test', function() {
    it('init', function() {
	let obj = GameStateFactory()
	obj = clearactions(obj)
	expect(hasavailableactions(obj)).to.be.false
    })

    it('test has actions', function() {
	let obj = GameStateFactory()
	obj = obj.updateIn(GamePositions.stage_cl(obj), _ => basestack().update(0, c => {
	    return c.updateIn(['actions'],
			      _ => {
				  return fromJS([
				      {
					  exec() {
					  },
					  desc:"it"
				      }])
				  
			      })
	    
	}))
	expect(hasavailableactions(obj)).to.be.true;
	
    })

    it('test clear actions', function() {
	let obj = GameStateFactory()
	obj = obj.updateIn(GamePositions.stage_cl(obj), _ => basestack().update(0, c => {
	    return c.updateIn(['actions'],
			      _ => {
				  return fromJS([
				      {
					  exec() {
					  },
					  desc:"it"
				      }])
				  
			      })
	    
	}))
	expect(hasavailableactions(obj)).to.be.true;
	obj = clearactions(obj)
	expect(obj).to.not.be.null;
	expect(hasavailableactions(obj)).to.be.false;
    })

    it('applyActions', function() {
	let ui;
	let [gs, c] = init('main', 0, ui = {
	})
	gs = applyActions(gs, {}, ui)
	expect(gs).to.not.be.null;
	validatefield(gs)
    })
    
    xit('debug', function() {
	let [gs, c] = init('main', 0)
	
	expect(debug('clock', gs)).to.equal('')
	expect(debug('level', gs)).to.equal('')
	expect(debug('memory', gs)).to.equal('')
	expect(debug('hand', gs)).to.equal('')
	validatefield(gs)
    })
    
    it('iscard', function() {
	let [gs, c] = init('main', 0)
	expect(iscard(basecard())).to.be.true;
	expect(iscard(Map())).to.be.false;
	expect(iscard(List())).to.be.false;
	expect(iscard(undefined)).to.be.false
	
    })
    
    it('findopenpositions', function() {
	let [gs, c] = init('main', 0)
	const open = findopenpositions(gs);
	expect(open).to.not.be.null
	expect(open).to.have.lengthOf(5)
	validatefield(gs)
    })
    
    it('test isevent', function() {
	let [gs, c] = init('main', 0)
	expect(isevent(basecard())).to.be.true;
    })
    
    it('test isclimax', function() {
	let [gs, c] = init('main', 0)
	expect(isclimax(basecard())).to.be.true;
    })
    
    it('test canplay', function() {
	let [gs, c] = init('main', 0)
	expect(canplay(gs, basecard().updateIn(['active','level'], _ => 0))).to.be.true;
    })
    
    it('test payment', function() {
	let [gs, c] = init('main', 0)
	gs = payment(3)(gs.updateIn([currentplayer(gs), 'stock'], deck => {
	    return deck.unshift(basecard(), basecard(), basecard())
	}));
	expect(gs.getIn([currentplayer(gs), 'waiting_room']).size).to.equal(3)
	validatefield(gs)
    })
    
    it('test findcardonstage', function() {
	let [gs, c] = init('main', 0)
 	let card = basecard()
	gs = gs.updateIn([currentplayer(gs), 'stage', 'center','left'], s => s.push(card))
	let [c0, pos] = findcardonstage(gs, card)
	expect(c0).to.not.be.null;
	expect(pos[0]).to.equal('center')
	expect(pos[1]).to.equal('left')
	validatefield(gs)
    })
    
    it('test findstageposition', function() {
	let [gs, c] = init('main', 0)
	let card = basecard()
	gs = gs.updateIn([currentplayer(gs), 'stage', 'center','left'], s => s.push(card))
	let pos = findstageposition(gs, card.getIn(['info','id']))
	expect(pos[0]).to.equal('center')
	expect(pos[1]).to.equal('left')
	validatefield(gs)
    })
    
    it('test dealdamage', function() {
	let [gs, c] = init('main', 0)
	let deck_base;
	
	/// deals damage to the inactive player
	gs = dealdamage(3, gs.updateIn([inactiveplayer(gs), 'deck'], deck => {
	    return deck_base = deck.unshift(basecard(1000), basecard(1000), basecard(1000))
	}))
	expect(gs.getIn([inactiveplayer(gs), 'clock']).size).to.equal(3)
	expect(gs.getIn([inactiveplayer(gs), 'deck']).size).to.equal(deck_base.size - 3)
	
	validatefield(gs)

	// as a reversed check, inactive deals damage to deck
	gs = dealdamage(3, gs.updateIn([inactiveplayer(gs), 'deck'], deck => {
	    return deck_base = deck.unshift(basecard(1000), basecard(1000), basecard(1000))
	}), inactiveplayer(gs))
	expect(gs.getIn([currentplayer(gs), 'clock']).size).to.equal(3)
	expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(deck_base.size - 3)
	
	validatefield(gs)
	
    })
    
    xit('test clockDamage', function(done) {
	let ui;
	let [gs, c] = init('main', 0, ui = {
	    prompt(func) {
		return create(obs => {
		    let { prompt, id } = func(gs => {
			obs.next(gs)
			obs.complete()
		    })
		    let p = mount(prompt)
		    p.find('#ok').simulate('click')
		})
		
	    }
	})

	let obs = clockDamage(ui)(gs)
	obs.subscribe(gs => {
	    expect(gs).to.not.be.null
	    validatefield(gs)
	    
	    obs = clockDamage(ui)(gs.updateIn([currentplayer(gs), 'clock'], clock => {
		return clock.unshift(basecard(),basecard(),basecard(),basecard(),basecard(),basecard(),basecard(),basecard(),basecard())
	    }))
	    obs.subscribe(
		gs => {
		    expect(gs).to.not.be.null
		    validatefield(gs)
		    
		},
		err => done(err),
		_ => done())
	    
	    
	})
	
    })
    
    it('test reset', function() {
	let [gs, c] = init('main', 0)
    })

    it('test validatefield', function() {
	let [gs, c] = init('main', 0)
	validatefield(gs)

	try {
	    validatefield(gs.updateIn([currentplayer(gs), 'deck'], _=> undefined))
	    expect(false).to.be.true
	}
	catch(e) {
	}
	try {
	    validatefield(gs.updateIn([currentplayer(gs), 'deck'], _=> Map()))
	    expect(false).to.be.true
	}
	catch(e) {
	}
	try {
	    validatefield(gs.updateIn([currentplayer(gs), 'deck'], deck => deck.push("")))
	    expect(false).to.be.true
	}
	catch(e) {
	}

	validatefield(gs.updateIn([currentplayer(gs), 'deck'], deck => deck.push(basecard())))
    })
    
    xit('test undefined', function() {
	const l = List()
	console.log(l.concat(List()))
	l.concat(List().push(undefined)).forEach(T => {
	    console.log(T)
	})
    })

    it('test applyAutomaticAbilities', function(done) {
	let ui;
	let [gs, c] = init('main', 0, ui = {
	    prompt(func) {
		return create(obs => {
		    let {prompt, id} = func(gs => {
			obs.next(gs)
			obs.complete()
		    })
		    mount(prompt).find('#ok').simulate('click')
		})
	    }
	})
	let card = basecard(1000).updateIn(['auto_abilities'],
					   _ => {
					       return (evt, gs) => {
						   if(evt.evt === 'play' && evt.id == card.getIn(['info','id'])) {
						       console.log("condition met, activating event")
						       return fromJS([
							   (evt, gs) => {
							       return func => {
								   return {
								       prompt:(<dialog id='test-dialog'>
									       <div className="mdl-dialog__actions">
									       <button id="ok" className="mdl-button mdl-js-button" onClick={
										   
										   evt => {
										       console.log('invoking func')
										       func(gs)
										   }
									       }>
									       OK
									       </button>
									       </div>
									       </dialog>),
								       id:'test-dialog'
								   }
							       }
							   }
						       ])
						   }
						   return fromJS([])
					       }
					       
					   })
	let card2 = basecard(1000).updateIn(['auto_abilities'],
					    _ => {
						return (evt, gs) => {
						    if(evt.evt === 'play') {
							console.log(`condition met, activating event in response to ${evt.id}`)
							return fromJS([
							    (evt, gs) => {
								return func => {
								    return {
									prompt:(<dialog id='test-dialog'>
										<div className="mdl-dialog__actions">
										<button id="ok" className="mdl-button mdl-js-button" onClick={
										    
										    evt => {
											console.log('invoking func')
											func(gs)
										    }
										}>
										OK
										</button>
										</div>
										</dialog>),
									id:'test-dialog'
								    }
								}
							    }
							])
						    }
						    return fromJS([])
						}
						
					    })
	gs = gs.updateIn([currentplayer(gs), 'stage', 'center','left'], stage => stage.push(card)).updateIn([currentplayer(gs), 'stage','center','right'], stage => stage.push(card2))
	applyAutomaticAbilities({evt:'play', id:card.getIn(['info','id'])}, ui, gs)
	    .subscribe(
		g => {
		    gs = g
		},
		err => done(err),
		_ => {
		    done()
		})
    })

    it('applyAutomaticAbilities passthrough', function(done) {
	let ui;
	let [gs, c] = init('main', 0, ui = {
	})
	applyAutomaticAbilities({evt:'reversed'}, ui, gs)
	    .subscribe(
		g => {
		    gs = g
		},
		err => done(err),
		_ => {
		    done()
		})
    })

})
