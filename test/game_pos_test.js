import GamePositions, { currentplayer, inactiveplayer } from '../src/game_pos'
import { expect } from 'chai'
import GameStateFactory from '../src/game_state'

describe('GamePosition Utils', function() {
    it('test currentplayer', function() {
	let obj = GameStateFactory();
 	expect(currentplayer(obj)).to.equal('player1')

	obj = obj.updateIn(['turn'], turn => turn + 1)
	expect(currentplayer(obj)).to.equal('player2')
	
    })

    it('test inactiveplayer', function() {
	let obj = GameStateFactory();
	expect(inactiveplayer(obj)).to.equal('player2')
	obj = obj.updateIn(['turn'], turn => turn + 1)
	expect(inactiveplayer(obj)).to.equal('player1')
	
	
	
    })
    
})
