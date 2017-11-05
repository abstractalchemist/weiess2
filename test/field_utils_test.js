import { iscard } from '../src/field_utils'
import { expect } from 'chai'
import { init, basecard } from './utils'
import { Map, List } from 'immutable'

describe('field utils test', function() {
    it('iscard', function() {
	let [gs, c] = init('main', 0)
	expect(iscard(basecard())).to.be.true;
	expect(iscard(Map())).to.be.false;
	expect(iscard(List())).to.be.false;
	expect(iscard(undefined)).to.be.false
	
    })

})
