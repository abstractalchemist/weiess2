import brainstorm, { search } from '../../src/actions/brainstorm'

import { mount } from 'enzyme'
import { expect } from 'chai'

import { init, createprompt, basecard, addcards } from '../utils'
import { currentplayer } from '../../src/game_pos'
import { payment } from '../../src/utils'

describe('brainstorm action test', function() {
    
    it('init it', function(done) {
	let [gs, controller] = init('main', 0)

	controller.updategamestate(gs = gs.updateIn([currentplayer(gs), 'stock'], addcards(4))
				   .updateIn([currentplayer(gs), 'deck'], addcards(5)))
	
	let action = brainstorm(payment(1),  search())
	action(gs, {
	    prompt:createprompt(obj => {
		obj.find('#deckselector-ok').simulate('click')
	    })
	})
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(gs.getIn([currentplayer(gs), 'stock']).size).to.equal(3)
		    expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(1)
		    expect(gs.getIn([currentplayer(gs), 'waiting_room']).size).to.equal(5)
		    expect(gs.getIn([currentplayer(gs), 'hand']).size).to.equal(0)
		    done()
		})
    })

    it('brainstrom with refresh', function(done) {
	let [gs, controller] = init('main', 0)

	controller.updategamestate(gs = gs.updateIn([currentplayer(gs), 'stock'], addcards(4))
				   .updateIn([currentplayer(gs), 'deck'], addcards(4)))
	
	let action = brainstorm(payment(1),  search())
	action(gs, {
	    prompt:createprompt(obj => {
		obj.find('#deckselector-ok').simulate('click')
	    })
	})
	    .subscribe(
		g => {
		    gs = g
		},
		err => {
		    done(err)
		},
		_ => {
		    expect(gs.getIn([currentplayer(gs), 'stock']).size).to.equal(3)

		    // there supposed to be 5, cause card goes from stock => waiting_room, then 4 deck => waiting_room
		    expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(5)
		    expect(gs.getIn([currentplayer(gs), 'waiting_room']).size).to.equal(0)
		    expect(gs.getIn([currentplayer(gs), 'hand']).size).to.equal(0)
		    done()
		})
    })
   
})
