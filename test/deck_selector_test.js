import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import DeckSelector from '../src/deckselector'
import { init, basecard } from './utils'
describe('<DeckSelector />', function() {
    
    it('init', function(done) {
	let [gs, c ] = init('main', 0)
	gs = gs.updateIn(['player1', 'waiting_room'], wr => wr.push(basecard(1000)))
	const obj = mount(<DeckSelector game_state={gs} field='waiting_room' player='player1' onselect={
	    ids => {
		console.log(`******************************************** selected ${ids}`)
		expect(ids).to.have.lengthOf(1)
		done()
	    }
	}/>)
	
	expect(obj).to.not.be.null;
	obj.find('#select-card').simulate('click')
	obj.find('#deckselector-ok').simulate('click')
    })
})
