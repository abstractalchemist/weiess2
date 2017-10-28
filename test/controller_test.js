import { expect } from 'chai'
import ControllerFactory from '../src/controller'
import GameStateFactory from '../src/game_state'

import { currentplayer } from '../src/utils'
import { fromJS } from 'immutable'

function init(phase, turn, ui = {
    updateUI(gs, obs, evt) {
	obs.next(gs)
	obs.complete();
    }
}) {
    let gs = GameStateFactory();
    gs = gs.setIn(['turn'], turn).setIn(['phase'], phase)
    let controller = ControllerFactory(gs)
    controller.registerUI(ui)
    return [gs, controller]
}

function randId() {
    return Math.floor(Math.random() * 1000)
}

function basecard(id = randId()) {
    return fromJS({
	active:{},
	info:{ id }})
}

function basestack(id = randId()) {
    return fromJS([
	{
	    active:{},
	    info:{ id }
	}
    ])
}

describe('ControllerFactory', function() {
    it('standup', function(done) {
	let gf = undefined;
	let controller = undefined;
	[gf, controller] = init('standup', 0)
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
	let gs, controller;
	[gs, controller ] = init('standup', 0)

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
	let gs = GameStateFactory().setIn(['turn'],0).setIn(['phase'],'draw')
	let controller = ControllerFactory(gs)
	let ui = {
	    updateUI(gs, obs, evt) {
		obs.next(gs)
		obs.complete()
	    }
	}
	controller.registerUI(ui)
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
	let gs = GameStateFactory().setIn(['turn'],0).setIn(['phase'],'draw');
	gs = gs.updateIn([currentplayer(gs), 'deck'], deck => deck.push(fromJS(
	    {
		info: {},
		active: {}
	    }),
									fromJS(
									    {
										info: {},
										active: {}
									    })))
	let controller = ControllerFactory(gs)
	let ui = {
	    updateUI(gs, obs, evt) {
		obs.next(gs)
		obs.complete()
	    }
	}
	controller.registerUI(ui)
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
	let gs = GameStateFactory().setIn(['turn'], 0);
	let controller = ControllerFactory(gs)
	let ui = {
	    updateUI(gs, obs, evt) {
		obs.next(gs)
		obs.complete()
	    }
	}
	controller.registerUI(ui)
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
	let gs = GameStateFactory().setIn(['turn'], 0)
	gs = gs.updateIn([currentplayer(gs), 'hand'], hand => hand.push(fromJS( {
	    info: { id: 0 },
	    active: {}
	})))
	let controller = ControllerFactory(gs)
	let ui = {
	    updateUI(gs, obs, evt) {
		let hand = gs.getIn([currentplayer(gs),'hand'])
		//		console.log(hand.first())
		hand.first().getIn(['actions']).first().getIn(['exec'])()
		obs.next(gs)
		obs.complete()
	    }
	}
	
	controller.registerUI(ui)
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
})
