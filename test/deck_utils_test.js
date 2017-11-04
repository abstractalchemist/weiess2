import { refresh, applyrefreshdamage, drawfromdeck, searchdeck, shuffle, searchwaitingroom }  from '../src/deck_utils'
import { expect } from 'chai'
import { init, basecard } from './utils'
import { G, validatefield } from '../src/field_utils'
import { List } from 'immutable'
import { currentplayer } from '../src/game_pos'
import { Observable } from 'rxjs'
import { mount } from 'enzyme'
const { create } = Observable;

describe('deck_utils test', function() {
    it('refresh', function() {
	let [gs,controller] = init('main', 0)
	gs = gs.updateIn([currentplayer(gs), 'waiting_room'], deck => {
	    return deck.unshift(
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard())
	})

	gs = refresh(gs)
	expect(G.waiting_room(gs).size).to.equal(0)
	expect(G.deck(gs).size).to.equal(11)
	validatefield(gs)
	expect(gs.getIn(['applyrefreshdamage'])).to.be.true;
	
    })

    it('applyrefreshdamage', function() {
	
	let [gs,controller] = init('main', 0)
	gs = gs.updateIn([currentplayer(gs), 'waiting_room'], deck => {
	    return deck.unshift(
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard())
	})

	gs = refresh(gs)
	gs = applyrefreshdamage(gs)
	expect(G.waiting_room(gs).size).to.equal(0)
	expect(G.deck(gs).size).to.equal(10)
	expect(G.clock(gs).size).to.equal(1)
	validatefield(gs)
	expect(gs.getIn(['applyrefreshdamage'])).to.be.false;
    })

    it('drawfromdeck', function() {
	let [gs,controller] = init('main', 0)
	let topcard;
	gs = gs
	    .updateIn([currentplayer(gs), 'deck'], deck => {
		return deck.unshift(
		    topcard = basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard())
	    })
	    .updateIn([currentplayer(gs), 'hand'], hand => {
		return hand.push(basecard())
	    })
	gs = drawfromdeck(1, 'hand', gs)
	let hand;
	expect(gs.getIn([currentplayer(gs), 'deck']).size).to.equal(10)
	expect((hand = gs.getIn([currentplayer(gs), 'hand'])).size).to.equal(2)
	expect(hand.find(c => c.getIn(['info','id']) === topcard.getIn(['info','id']))).to.not.be.null
    })

    it('searchdeck', function(done) {
	let ui;
	let [gs,controller] = init('main', 0, ui = {
	    prompt(f) {
		return create(obs => {
		    let {prompt,id} = f(gs => {
			obs.next(gs)
			obs.complete()
		    })

		    let p = mount(prompt)
		    p.find('#deckselector-ok').simulate('click')
		})
	    }
	})
	let topcard;
	gs = gs
	    .updateIn([currentplayer(gs), 'deck'], deck => {
		return deck.unshift(
		    topcard = basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard(),
		    basecard())
	    })
	    .updateIn([currentplayer(gs), 'hand'], hand => {
		return hand.push(basecard())
	    })
	let obs = ui.prompt(searchdeck(1, 'hand', _ => true, gs))
	obs.subscribe(
	    gs => {
	    },
	    err => done(err),
	    _ => done())
    })


    it('shuffle', function() {
	let [gs,controller] = init('main', 0)
	let deck = G.deck(gs.updateIn([currentplayer(gs), 'deck'], deck => {
	    return deck.unshift(
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard(),
		basecard())
	}))
	let shuffled = shuffle(deck)
	expect(shuffled).to.not.be.null
	expect(List.isList(shuffled)).to.be.true
	expect(shuffled.size).to.equal(deck.size)
    })


    it('searchwaitingroom',  function() {
	let [gs,controller] = init('main', 0)
    })
})
