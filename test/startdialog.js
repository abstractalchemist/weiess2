import React from 'react'
import { mount } from 'enzyme'
import { expect } from 'chai'
import StartDialog from '../src/start_dialog'

describe("<StartDialog />", function() {
    it("init", function() {
	const obj = mount(<StartDialog />)
	expect(obj).to.not.be.null;
    })
})
