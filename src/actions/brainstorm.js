import React from 'react'
import DeckSelector from '../deckselector'
import StageSelector from '../stageselector'
import { Observable } from 'rxjs'

const { of, create } = Observable
import { currentplayer, isclimax, iscard } from '../utils'

// draw 4 cards from deck, then returns the number of climaxes, and the update game_state
function draw(gs) {
    let deck = gs.getIn([currentplayer(gs), 'deck'])
    let cards = deck.slice(0,4)
    return [cards.filter(isclimax).size,
	    gs.updateIn([currentplayer(gs), 'deck'], _ => deck.slice(4))
	    .updateIn([currentplayer(gs), 'waiting_room'], room => cards.concat(room))]
}

function charfilter(deck) {
    return deck.filter(c => c.getIn(['active', 'power']) !== undefined)
}

function findcardsonstage(gs) {
    let positions = [];
    let stage = gs.getIn([currentplayer(gs), 'stage'])
    if(iscard(stage.getIn(['center', 'left']).first()))
	positions.push(['center', 'left'])
    if(iscard(stage.getIn(['center', 'middle']).first()))
	positions.push(['center', 'middle'])
    if(iscard(stage.getIn(['center', 'right']).first()))
	positions.push(['center', 'right'])
    if(iscard(stage.getIn(['back','left']).first()))
	positions.push(['back', 'left'])
    if(iscard(stage.getIn(['back', 'right']).first()))
	positions.push(['back', 'right'])
    return positions;
}

function updatepowers(by) {
    return (ui, cardcount, game_state) => {
	return ui.prompt(func => {
	    return {
		id:'stage-selector',
		prompt: <StageSelector onselect={
		    positions => {
			if(positions.length <= cardcount) {

			    // update all selected positions
			    let stage = game_state.getIn([currentplayer(game_state), 'stage'])
			    positions.forEach(pos => {

				stage = stage.updateIn(pos, card => card.updateIn(['active','power'], power =>
										  gs => {
										      return by + power(gs) 
										  }))
				
			    })

			    // update all cards powers, then run with it
			    func(gs.updateIn([currentplayer(gs), 'stage'], _ => stage))
			}
			
		    }
		}
		openpositions={findcardsonstage(game_state)}/>
		    
		
	    }
	})
    }
}
	
function searchdeck(filter = charfilter) {
    return (ui, cardcount, game_state) => {
	return ui.prompt(func => {
	    return {
		id:'deck-selector',
		prompt: <DeckSelector game_state={game_state} onselect={
		    ids => {
			console.log('recieved ids to check')
			// add ids to the hand, remove from deck
			let gs = game_state;
			// update game_state
			func(gs)
			
		    }
		} selectcount={cardcount} filter={filter}/>
		
	    }
	})
    }
}

// cost is a function which updates the state based on cost payment
// action is a function which takes the number of times to perform, and the current game state;
function brainstorm(cost, action) {
    return (gs, ui) => {
	return of(cost(gs))
	    .mergeMap(gs => {
		let [actions, gs2] = draw(gs)
		return action(ui, actions, gs2)

	    })
    }
}

export { searchdeck, brainstorm as default };
