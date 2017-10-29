import brainstorm, { searchdeck } from '../../src/actions/brainstorm'

import { mount } from 'enzyme'
import { expect } from 'chai'

import { init, createprompt, basecard, addcards } from '../utils'
import { currentplayer } from '../../src/utils'
import { payment } from '../../src/utils'

describe('brainstorm action test', function() {
    
    it('init it', function(done) {
	let [gs, controller] = init('main', 0)

	controller.updategamestate(gs = gs.updateIn([currentplayer(gs), 'stock'], addcards(4))
				   .updateIn([currentplayer(gs), 'deck'], addcards(4)))
	
	let action = brainstorm(payment(1),  searchdeck())
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
		    expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(0)
		    expect(gs.getIn([currentplayer(gs), 'waiting_room']).size).to.equal(5)
		    expect(gs.getIn([currentplayer(gs), 'hand']).size).to.equal(0)
		    done()
		})
    })
})
