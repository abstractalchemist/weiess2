import { expect } from 'chai'
import { checkbattleconditions } from '../src/battle_utils'
import { init, basecard } from './utils'
import { Observable } from 'rxjs'
const { create, of } = Observable;
import { Status } from '../src/battle_const'

describe('battle utils', function() {
    it('check battle conditions', function(done) {
	let [gs, c ] = init('attack',0)
	let not_resting = true;
	checkbattleconditions(_ => {
	    not_resting = false;
	    return of("")
	})(gs
	   .updateIn(['player1','stage','center','left'], stage => stage.push(basecard(1000).updateIn(['status'], _ => Status.not_attack())))
	   .updateIn(['player1','stage','center','middle'], stage => stage.push(basecard(1000).updateIn(['status'], _ => Status.rest())))
	   .updateIn(['player1','stage','center','right'], stage => stage.push(basecard(1000).updateIn(['status'], _ => Status.reversed()))))
	    .subscribe(
		g => {
		    gs = g
		},
		err => done(err),
		_ => {
		    expect(not_resting).to.be.true;
		    done()
		})
		
    })
})
