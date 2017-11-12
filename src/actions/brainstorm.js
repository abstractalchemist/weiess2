import React from 'react'
import DeckSelector from '../deckselector'
import StageSelector from '../stageselector'
import { Observable } from 'rxjs'
import { drawfromdeck, searchdeck, searchwaitingroom } from '../deck_utils'
const { of, create } = Observable
import { currentplayer, isclimax, iscard } from '../utils'
import { Map } from 'immutable'
// draw 4 cards from deck, then returns the number of climaxes, and the update game_state
// function draw(gs) {
//     let deck = gs.getIn([currentplayer(gs), 'deck'])
//     let cards = deck.slice(0,4)
//     return [cards.filter(isclimax).size,
// 	    gs.updateIn([currentplayer(gs), 'deck'], _ => deck.slice(4))
// 	    .updateIn([currentplayer(gs), 'waiting_room'], room => cards.concat(room))]
// }

function charfilter(card) {
    
    //return deck.filter(c => c.getIn(['active', 'power']) !== undefined)
    if(Map.isMap(card))
	return card.getIn(['active', 'power']) !== undefined
    return card.active.power !== undefined;
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
		id:'stage-select',
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
			    func(gs.updateIn([currentplayer(game_state), 'stage'], _ => stage))
			}
			
		    }
		}
		openpositions={findcardsonstage(game_state)}/>
		    
		
	    }
	})
    }
}
	
function search(filter = charfilter) {
    return (ui, cardcount, game_state) => {
	if(!game_state) throw "search must be passed game_state"
	return ui.prompt(searchdeck(cardcount, 'hand', filter, game_state))
    }
}

function searchwr(filter = charfilter) {

    return (ui, cardcount, game_state) => {
	if(!game_state) throw "search must be passed game_state"
	return ui.prompt(searchwaitingroom(cardcount, 'hand', filter, game_state))
    }
}


// cost is a function which updates the state based on cost payment
// action is a function which takes the number of times to perform, and the current game state;
function brainstorm(cost, action) {
    return (gs, ui, id) => {
	return of(gs)
	    .map(cost)
	    .mergeMap(gs => {
		let numclimaxes = 0
		let gs2 = drawfromdeck(4, 'waiting_room', gs, c => {
		    if(isclimax(c)) numclimaxes++
		})
		if(numclimaxes > 0)
		    return action(ui, numclimaxes, gs2)
		return of(gs2)

	    })
    }
}

export { brainstorm as default, search, searchwr };
