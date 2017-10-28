import { expect } from 'chai'
import ControllerFactory from '../src/controller'
import GameStateFactory from '../src/game_state'

import { currentplayer } from '../src/utils'
import { fromJS } from 'immutable'
import { init, basecard, basestack } from './utils'

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
		    
		    expect(gf.getIn([currentplayer(gf), 'stage','center','left']).first().getIn(['status'])).to.equal('stand')
		    expect(gf.getIn([currentplayer(gf), 'stage','center','middle']).first().getIn(['status'])).to.equal('stand')
		    expect(gf.getIn([currentplayer(gf), 'stage','center','right']).first().getIn(['status'])).to.equal('stand')
		    done()
		})
    })
    it('standup no stage cards', function(done) {
	//	let gs, controller;
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
	let [gs, controller] = init('draw', 0)
	
	expect(gs.getIn([currentplayer(gs), 'hand']).size).to.equal(0)
	expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(0)
	controller.draw()
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(gs.getIn([currentplayer(gs), 'hand']).size).to.equal(0)
		    done()
		})
	
    })

    it('draw', function(done) {
	let [gs, controller] = init('draw', 0);
	controller.updategamestate(gs = gs.updateIn([currentplayer(gs), 'deck'], deck => deck.push(basecard(), basecard())))
	
	expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(2)
	expect(gs.getIn([currentplayer(gs), 'hand']).size).to.equal(0)
	controller.draw()
	    .subscribe(
		g => {
		    gs = g;
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(1)
		    expect(gs.getIn([currentplayer(gs), 'hand']).size).to.equal(1)
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
		    expect(gs.getIn([currentplayer(gs), 'clock']).size).to.equal(0)
		    done()
		})
    })
    
    it('clock', function(done) {
	let card = basecard()
	let [gs, controller] = init('clock', 0, {
	    updateUI(gs, obs, evt) {
		let hand = gs.getIn([currentplayer(gs),'hand'])
		//		console.log(hand.first())
		hand.first().getIn(['actions']).first().getIn(['exec'])().subscribe(gs => {
		    obs.next(gs)
		    obs.complete()
		})
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

    xit('main', function(done) {
	let [gs, controller] = init('main', 0)

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
		
		if(evt.when !== 'begin') {
		    expect(evt.evt).to.equal('climax')
		    let hand = gs.getIn([currentplayer(gs), 'hand'])
		    let climax = hand.first();
		    let exec = climax.getIn(['actions']).first().getIn(['exec']);
		    // we exec this
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
		    let climaxarea = gs.getIn([currentplayer(gs), 'climax']);
		    expect(climaxarea.size).to.equal(1)
		    done()
		})
		       
    })
})
