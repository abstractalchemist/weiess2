import { expect } from 'chai'
import { collectactivateablecards, power_calc, soul_calc, level_calc, cost_calc } from '../src/modifiers'
import { init, basecard } from './utils'
import { currentplayer } from '../src/game_pos'

describe('modifiers', function() {
    
    it('collectactivateablecards', function() {
	let [gs, c] = init('main', 0)
	let activecards = collectactivateablecards(gs)
	expect(activecards.size).to.equal(0)

    })

    it('power_calc', function() {
	let [gs, c] = init('main', 0)
	let bs = basecard(1000)

	gs = gs.updateIn([currentplayer(gs), 'stage','center','left'], stagepos => stagepos.push(bs))
	let originalpower = bs.getIn(['active','power'])
	console.log(`original power: ${originalpower}`)
	let power = power_calc(bs, gs)
 	expect(power).to.equal(bs.getIn(['info','power']))


	power = power_calc(bs.getIn(['info','id']), gs)
	expect(power).to.equal(bs.getIn(['info','power']))
    })
    
    it('soul_calc', function() {
	let [gs, c] = init('main', 0)
	let bs = basecard(1000).updateIn(['info','soul'], _ => 1).updateIn(['active','soul'], _ => 1)
	gs = gs.updateIn([currentplayer(gs), 'stage','center','left'], stagepos => stagepos.push(bs))
	let power = soul_calc(bs, gs)
 	expect(power).to.equal(bs.getIn(['info','soul']))


	power = soul_calc(bs.getIn(['info','id']), gs)
	expect(power).to.equal(bs.getIn(['info','soul']))
    })

})
