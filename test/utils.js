import GameStateFactory from '../src/game_state'
import ControllerFactory from '../src/controller'
import { fromJS } from 'immutable'
import { Observable } from 'rxjs'
import { hasavailableactions } from '../src/utils'
const { create } = Observable;

import { mount } from 'enzyme'

function init(phase, turn, ui = {
    updateUI(gs, obs, evt) {
	//	console.log(`auto pushing through ui`)
	if(obs) {
	    if(!hasavailableactions(gs)) {
		obs.next(gs)
		obs.complete();
	    }
	}
	
    },

    prompt(prompt) {
	return create(obs => {
	    return prompt(gs => {
		obs.next(gs)
		obs.complete()
	    })
	})
    }
}) {
    let gs = GameStateFactory();
    gs = gs.setIn(['turn'], turn).setIn(['phase'], phase)
    let controller = ControllerFactory(gs)
    controller.registerUI(ui)
    return [gs, controller]
}

function randId() {
    return Math.floor(Math.random() * 1000)
}

function basecard(power, id = randId()) {
    return fromJS({
	active:{ power },
	info:{ id, power }})
}

function basestack(power, id = randId()) {
    return fromJS([
	{
	    active:{ power },
	    info:{ id, power }
	}
    ])
}

function createprompt(simulateit = function(obj) {
    obj.find('#ok').simulate('click', {})
}) {
    return prompt => {

	return create(obs => {
	    let {id, prompt:promptUI} = prompt(gs => {
		obs.next(gs)
		obs.complete()
	    })
	    const obj = mount(promptUI)
	    console.log('clicking.....')
	    simulateit(obj)
	})
    }
}

function addcards(count) {
    return location => {
	let i = 0;
	while(i < count) {
	    location = location.push(basecard())
	    i++;
	}
	return location;
    }
}

export { init, randId, basecard, basestack, createprompt, addcards }
