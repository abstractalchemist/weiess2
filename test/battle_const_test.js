import { Status } from '../src/battle_const'
import { expect } from 'chai'
import { basecard } from './utils'

describe('Battle Status', function() {
    it('stand', function() {
	let base = basecard(1000).updateIn(['status'], _ => Status.stand())
	expect(Status.stand(base)).to.be.true;
	base = base.updateIn(['status'], _ => Status.not_attack())
	expect(Status.stand(base)).to.be.true;
	expect(!Status.stand(base)).to.be.false;
	base = base.updateIn(['status'], _ => Status.rest())
	expect(!Status.stand(base)).to.be.true;
    })
})
