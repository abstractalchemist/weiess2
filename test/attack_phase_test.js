import AttackPhase from '../src/attack_phase'
import { expect } from 'chai'
import { init, basecard } from './utils'


describe('attack_phase', function() {
    it('declare', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		
	    }
	})
	const a = AttackPhase(gs, ui)
	expect(a).to.not.be.null;
	a.declare(gs)
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

    it('attack_trigger', function(done) {
	let ui;
	let [gs, controller ] = init('attack', '0', ui = {
	    updateUI(gs, obs, evt) {
		
	    }
	})
	const a = AttackPhase(gs, ui)
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
	const a = AttackPhase(gs, ui)
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
