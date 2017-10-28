import GameStateFactory from '../src/game_state'
import ControllerFactory from '../src/controller'
import { fromJS } from 'immutable'

function init(phase, turn, ui = {
    updateUI(gs, obs, evt) {
	obs.next(gs)
	obs.complete();
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

function basecard(id = randId()) {
    return fromJS({
	active:{},
	info:{ id }})
}

function basestack(id = randId()) {
    return fromJS([
	{
	    active:{},
	    info:{ id }
	}
    ])
}

export { init, randId, basecard, basestack }
