import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { field, fieldReverse, hand } from '../src/field'
import { currentplayer } from '../src/utils'

import { init } from './utils'


describe('<Field />', function() {
    it('field', function() {
	let [gs, controller] = init('standup', 0)
	
	const fieldinfo = mount(<div>{field({game_state:gs})}</div>)
	expect(fieldinfo).to.not.be.null;
    })

    it('reverse', function() {
	let [gs, controller] = init('standup', 0)
	const fieldinfo = mount(<div>{fieldReverse({game_state:gs})}</div>)
	expect(fieldinfo).to.not.be.null;
    })

    it('hand', function() {
	let [gs, controller] = init('standup', 0)
	const handInfo = mount(<div>{hand({game_state:gs})}</div>)
	expect(handInfo).to.not.be.null;
    })
})
