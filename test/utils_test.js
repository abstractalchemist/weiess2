import { expect } from 'chai'
import { clearactions, hasavailableactions } from '../src/utils'
import GameStateFactory from '../src/game_state'
import { basecard, basestack } from './utils'
import GamePositions, { currentplayer } from '../src/game_pos'
import { fromJS } from 'immutable'

describe('utils test', function() {
    it('init', function() {
	let obj = GameStateFactory()
	obj = clearactions(obj)
	expect(hasavailableactions(obj)).to.be.false
    })

    it('test has actions', function() {
	let obj = GameStateFactory()
	obj = obj.updateIn(GamePositions.stage_cl(obj), _ => basestack().update(0, c => {
	    return c.updateIn(['actions'],
			      _ => {
				  return fromJS([
				      {
					  exec() {
					  },
					  desc:"it"
				      }])
				  
			      })
	    
	}))
	expect(hasavailableactions(obj)).to.be.true;
	
    })

    it('test clear actions', function() {
	let obj = GameStateFactory()
	obj = obj.updateIn(GamePositions.stage_cl(obj), _ => basestack().update(0, c => {
	    return c.updateIn(['actions'],
			      _ => {
				  return fromJS([
				      {
					  exec() {
					  },
					  desc:"it"
				      }])
				  
			      })
	    
	}))
	expect(hasavailableactions(obj)).to.be.true;
	obj = clearactions(obj)
	expect(obj).to.not.be.null;
	expect(hasavailableactions(obj)).to.be.false;
    })

})
