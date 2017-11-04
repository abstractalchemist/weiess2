import { expect } from 'chai'
import { collectactivateablecards } from '../src/modifiers'
import { init } from './utils'

describe('modifiers', function() {
    
    it('test collectactivateablecards', function() {
	let [gs, c] = init('main', 0)
	let activecards = collectactivateablecards(gs)
	expect(activecards.size).to.equal(0)

    })

})
