import { mount } from 'enzyme'
import { expect } from 'chai'
import { init, basecard } from '../utils'
import React from 'react'
import { attributecurrentturn, selectforpowerandsoul, findAndRemoveCard, DrawSelect } from '../../src/mappings/utils'

describe('mapping utils test', function() {

    it(' attributecurrentturn ', function() {
	let [gs, _ ] = init('main',1)
	let c = basecard(1000)
	c = c.updateIn(['active', 'power'], attributecurrentturn(1, 1000))
	expect(c.getIn(['active', 'power'])(gs)).to.equal(2000)
	gs = gs.updateIn(['turn'], _ => 2)
	expect(c.getIn(['active', 'power'])(gs)).to.equal(1000)
    })

    it(' selectforpowerandsoul', function() {
	let [gs, _ ] = init('main',0)
	gs = gs
	    .updateIn(['player1', 'stage', 'center', 'left'], stage => stage.push(basecard(1000).updateIn(['active','soul'], _ => 1)))
	    .updateIn(['player1', 'stage', 'center', 'middle'], stage => stage.push(basecard(2000).updateIn(['active','soul'], _ => 1)))
	gs = selectforpowerandsoul(gs, 2000, 1)([['center','left'],['center','middle']])
	expect(gs).to.not.be.null
	expect(gs.getIn(['player1','stage','center','left']).first().getIn(['active', 'power'])(gs)).to.equal(3000)
	expect(gs.getIn(['player1','stage','center','left']).first().getIn(['active', 'soul'])(gs)).to.equal(2)
	expect(gs.getIn(['player1','stage','center','middle']).first().getIn(['active', 'power'])(gs)).to.equal(4000)
	gs = gs.updateIn(['turn'], _ => 3)
	expect(gs.getIn(['player1','stage','center','left']).first().getIn(['active', 'power'])(gs)).to.equal(1000)
	expect(gs.getIn(['player1','stage','center','left']).first().getIn(['active', 'soul'])(gs)).to.equal(1)
	expect(gs.getIn(['player1','stage','center','middle']).first().getIn(['active', 'power'])(gs)).to.equal(2000)
	
    })

    it(' findRemoveCard', function() {
	let [gs, _] = init('main', 0)
	const c = basecard()
	gs = gs.updateIn(['player1', 'hand'], hand => hand.push(c))
	let id;
	let [card, gs2] = findAndRemoveCard(id = c.getIn(['info','id']), 'hand', gs)
	
	expect(card.getIn(['info','id'])).to.equal(id)
	expect(gs2.getIn(['player1','hand']).size).to.equal(0)
    })
    
    it(' <DrawSelect />', function() {
	let [gs, c ] = init('attack_select', 0)
	gs = gs.updateIn(['player1','deck'], deck => deck.push(basecard()).push(basecard()).push(basecard()))
	const obj = mount(<DrawSelect draw_count={2} game_state={gs} onend={
	    gs => {
	    }
	}/>)
	expect(obj).to.not.be.null;
	obj.find('#action').simulate('click')
	let currentGs = obj.state('game_state')
	expect(currentGs.getIn(['player1', 'deck']).size).to.equal(1)
	expect(currentGs.getIn(['player1', 'waiting_room']).size).to.equal(2)
	expect(obj.state('current_action')).to.equal('Pay')
    })

    
})
