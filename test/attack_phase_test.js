import AttackPhase from '../src/attack_phase'
import { expect } from 'chai'
import { init, basecard, basestack } from './utils'
import { currentplayer, inactiveplayer } from '../src/utils'

const populate_stage = (gs, trigger_action = 'come_back') => {
    return gs
	.updateIn([currentplayer(gs), 'stage', 'center'], center => {
	    return center
		.updateIn(['left'], left => {
		    return basestack()
		})
		.updateIn(['middle'], middle => {
		    return basestack()
		})
		.updateIn(['right'], right => {
		    return basestack()
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
		    return basestack()
		})
		.updateIn(['middle'], middle => {
		    return basestack()
		})
		.updateIn(['right'], right => {
		    return basestack()
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
		
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs), ui)
	expect(a).to.not.be.null;
	a.declare(gs)
	    .subscribe(
		g => {
		    gs = g;
		},
		err => {
		    done(err)
		},
		_ => {
		    done()
		})
    })

    it('attack_trigger come_back', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		
	    },
	    prompt(promptfunc) {
		
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs, 'come_back'), ui)
	expect(a).to.not.be.null;
	a.trigger(gs)
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
    
    it('attack_trigger treasure', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		
	    },
	    prompt(promptfunc) {
		
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs, 'treasure'), ui)
	expect(a).to.not.be.null;
	a.trigger(gs)
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

    it('attack_counter', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		
	    }
	})
	const a = AttackPhase(gs = populate_stage(gs), ui)
	expect(a).to.not.be.null;
	a.counter_attack(gs)
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
		
	    }
	})
	const a = AttackPhase(gs, ui)
	expect(a).to.not.be.null;
	a.damage(gs, basecard())
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
		
	    }
	})
	const a = AttackPhase(gs, ui)
	expect(a).to.not.be.null;
	a.setpos(['center','left'])
	a.battle_step(gs, basecard())
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
		obs.next(gs)
		obs.complete()
	    }
	})
	const a = AttackPhase(gs, ui)
	expect(a).to.not.be.null;
	a.encore(gs, basecard())
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
