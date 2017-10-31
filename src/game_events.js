import GamePhases from './game_phases'

export default {
    stand(pos, obj) {
	return Object.assign({}, {evt:"stand", pos}, obj)
    }
}
