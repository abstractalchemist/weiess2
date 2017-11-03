import AttackPhase from '../src/attack_phase'
import { expect } from 'chai'
import { init, basecard, basestack } from './utils'
import { hasavailableactions } from '../src/utils'
import { currentplayer, inactiveplayer } from '../src/game_pos'
import { Triggers, Status } from '../src/battle_const'

const populate_stage = (gs, trigger_action = 'come_back') => {
    return gs
	.updateIn([currentplayer(gs), 'stage', 'center'], center => {
	    return center
		.updateIn(['left'], left => {
		    return basestack(1000).update(0, c => c.updateIn(['status'], _ => Status.stand()))
		})
		.updateIn(['middle'], middle => {
		    return basestack(1000).update(0, c => c.updateIn(['status'], _ => Status.stand()))
		})
		.updateIn(['right'], right => {
		    return basestack(1000).update(0, c => c.updateIn(['status'], _ => Status.stand()))
		})
	    
	})
	.updateIn([currentplayer(gs), 'stage','back'], back => {
	    return back
		.updateIn(['left'], left => {
		    return basestack()
		})
		.updateIn(['right'], right => {
		    return basestack()
		})
	    
	})
	.updateIn([inactiveplayer(gs), 'stage', 'center'], center => {
	    return center
		.updateIn(['left'], left => {
		    return basestack(500).update(0, c => c.updateIn(['status'], _ => Status.stand()))
		})
		.updateIn(['middle'], middle => {
		    return basestack(500).update(0, c => c.updateIn(['status'], _ => Status.stand()))
		})
		.updateIn(['right'], right => {
		    return basestack(2000).update(0, c => c.updateIn(['status'], _ => Status.stand()))
		})
	    
	})
	.updateIn([inactiveplayer(gs), 'stage','back'], back => {
	    return back
		.updateIn(['left'], left => {
		    return basestack()
		})
		.updateIn(['right'], right => {
		    return basestack()
		})
	    
	})
	.updateIn([currentplayer(gs), 'deck'], deck => {
	    return deck
		.push(basecard().updateIn(['info','trigger_action'], _ => trigger_action))
		.push(basecard())
	    	.push(basecard())
	    	.push(basecard())
	})
    
}

describe('attack_phase', function() {
    it('declare', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs)) {
		    if(obs) {
			obs.next(gs)
			obs.complete()
		    }
		    
		}
		
		let out = gs.getIn([currentplayer(gs), 'stage', 'center','left'])
		//		console.log(out)
		let left_attack = out.first().getIn(['actions']).first().getIn(['exec'])
		left_attack()
		    .subscribe(gs => {
			obs.next(gs)
			obs.complete()
		    })
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs), ui)
	expect(a).to.not.be.null;
	a.declare(gs)
	    .mergeMap(a.updateUI({}))
	    .subscribe(
		g => {
		    gs = g;
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(a.attack_pos()[0]).to.equal('center')
		    expect(a.attack_pos()[1]).to.equal('left')
		    done()
		})
    })

    xit('attack_trigger come_back', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs)) {
		    if(obs) {
			obs.next(gs)
			obs.complete()
		    }
		    
		}

		
	    },
	    prompt(promptfunc) {
		
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs, Triggers.salvage), ui)
	expect(a).to.not.be.null;
	a.setpos(['center','left'])
	a.trigger(gs)
	    .mergeMap(a.updateUI({}))
	    .subscribe(
		g => {
		    gs = g;
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(gs.getIn(['triggeraction'])).to.equal(Triggers.salvage)
		    expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(3)
		    done()
		})
    })
    
    xit('attack_trigger treasure', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs)) {
		    if(obs) {
			obs.next(gs)
			obs.complete()
		    }
		    
		}
		
	    },
	    prompt(promptfunc) {
		
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs, Triggers.treasure), ui)
	expect(a).to.not.be.null;
	a.setpos(['center','left'])
	a.trigger(gs)
	    .mergeMap(a.updateUI({}))
	    .subscribe(
		g => {
		    gs =g;
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(gs.getIn(['triggeraction'])).to.equal(Triggers.treasure)
		    expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(3)
		    done()
		})
    })

    // TODO
    it('attack_counter', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs)) {
		    if(obs) {
			obs.next(gs)
			obs.complete()
		    }
		    
		}

		obs.next(gs)
		obs.complete()
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs), ui)
	a.setpos(['center','left'])
	expect(a).to.not.be.null;
	a.counter_attack(gs)
	    .mergeMap(a.updateUI({}))
	    .subscribe(
		g => {
		},
		err => {
		    done(err)
		},
		_ => {
		    done()
		})
    })

    it('attack_damage', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs)) {
		    if(obs) {
			obs.next(gs)
			obs.complete()
		    }
		    
		}
		
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs), ui)
	expect(a).to.not.be.null;
	a.setpos(['center','left'])
	a.damage(gs)
	    .mergeMap(a.updateUI({}))
	    .subscribe(
		g => {
		},
		err => {
		    done(err)
		},
		_ => {
		    done()
		})
    })

    it('attack_battle', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs)) {
		    if(obs) {
			obs.next(gs)
			obs.complete()
		    }
		    
		}
		
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs), ui)
	expect(a).to.not.be.null;
	a.setpos(['center','left'])
	a.battle_step(gs, basecard())
	    .mergeMap(a.updateUI({}))
	    .subscribe(
		g => {
		},
		err => {
		    done(err)
		},
		_ => {
		    done()
		})
    })

    it('attack_encore', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		if(!hasavailableactions(gs)) {
		    if(obs) {
			obs.next(gs)
			obs.complete()
		    }
		    
		}

		obs.next(gs)
		obs.complete()
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs), ui)
	expect(a).to.not.be.null;
	a.setpos(['center','left'])
	a.encore(gs, basecard())
	    .mergeMap(a.updateUI({}))
	    .subscribe(
		g => {
		},
		err => {
		    done(err)
		},
		_ => {
		    done()
		})
    })
})
