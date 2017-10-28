import React from 'react'
import { mount } from 'enzyme'
import { expect } from 'chai'
import  ControllerFactory  from '../src/controller'
import  GameStateFactory  from '../src/game_state'
import Main from '../src/main'
import { init } from './utils'

describe('<Main />', function() {
    it('init', function() {
	let [gs, controller] = init('standup', '0')
	const main = mount(<Main controller={controller} game_state={gs} />)
	expect(main).to.not.be.null;
    })
})
