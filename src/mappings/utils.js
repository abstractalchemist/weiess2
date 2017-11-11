import React from 'react';
import { List } from 'immutable'
import { findcardonstage, findstageposition, isclimax } from '../utils'
import { drawfromdeck } from '../deck_utils'
import { CardDisplay } from '../deckselector'
import { currentplayer } from '../game_pos'
import { iscard } from '../field_utils'

function isinfront([p0,p1], [o0,o1]) {
    if(p0 === 'center' && o0 === 'back') {
	return p1 === o1 || p1 === 'center'
    }
    return false;
}


// applies attribute increase for only the current turn
function attributecurrentturn(turn, applied_value) {
    return attribute => {
	return gs => {
	   
	    if(gs.getIn(['turn']) === turn) {
		if(typeof attribute === 'function')
		    return attribute(gs) + applied_value
		return attribute + applied_value
	    }
	    else {
		if(typeof attribute === 'function')
		    return attribute(gs)
		return attribute
	    }
	}
    }
}

// applies a power and soul increates for the current turn 
function selectforpowerandsoul(gs, power, soul) {
    let turn = gs.getIn(['turn'])
    return (positions) => {
	positions.forEach( pos => {
//	    console.log(`*************************************** updating in ${pos}`)
	    gs = gs.updateIn([currentplayer(gs), 'stage'].concat(pos),
			     stage => stage.update(0,
				 		   card => {
						       console.log(card)
						       return card
							   .updateIn(['active', 'power'], attributecurrentturn(turn, power))
							   .updateIn(['active', 'soul'], attributecurrentturn(turn, soul))
						   }))
	})
	return gs;
    }
}

function findAndRemoveCard(id, field, gs, player) {
    player = player || currentplayer(gs)
    let fieldElements = gs.getIn([player, field])
    if(!List.isList(fieldElements))
	throw new Error("Can only search list fields")
    let index = fieldElements.findIndex(c => c.getIn(['info','id']) === id)
    let card = fieldElements.get(index)
    return [card, gs.updateIn([player, field], f => f.filter(c => c.getIn(['info','id']) !== id))]
}

/*
properties
- draw_count - number of cards to draw
- game_state - the current game_state
- onend - what to do after stuff is done
*/
class DrawSelect extends React.Component {

    constructor(props) {
	super(props)
	this.state = { current_action : "Draw", cards_drawn : 0, game_state: props.game_state, enable_ok: true, actionDesc:"Draw " + props.draw_count }
    }


    clickhandler() {
	console.log(`current action is ${this.state.current_action}`)
	switch(this.state.current_action) {
	    
	case "Draw": {
	    let deck = this.state.game_state.getIn([currentplayer(this.state.game_state), 'deck'])
	    let maxCount = this.props.draw_count;
	    let cards = []
	    let found = false;
	    for(let i = 0; i < maxCount; ++i) {
		let card = deck.first()
		found = isclimax(card) || found;
		deck = deck.shift()
		
	    }
			   
	    let gs = drawfromdeck(this.props.draw_count, 'waiting_room', this.state.game_state)
	    if(found)
		this.setState({ current_action: "Pay", game_state: gs, found, enable_ok:found, actionDesc:"Pay cost to select a character card from the waiting room", selected:[] })
	    else
		this.setState({ current_action: "End" })
	}
	    break;
	case "Pay": {

	    this.setState({actionDesc:[<p key="desc">Select A Card From Hand</p>,
				       <CardDisplay key="hand-display" selectupto={1} cards={this.state.game_state.getIn([currentplayer(this.state.game_state), 'hand']).toJS()}
				       clickhandler={
					   id => {
					       let [card, gs] = findAndRemoveCard(id, 'hand', this.state.game_state)
					       
					       this.setState({ current_action:"Select",
							       enable_ok:true,
							       game_state:gs
							       .updateIn([currentplayer(gs), 'waiting_room'], wr => wr.unshift(card))})				   
					   }}/>], current_action:"Pay", enable_ok:false})
	}
	    break;
	case "Select": {
	    this.setState({actionDesc:[<p key="desc">Select Card from Waiting Room</p>,
				       <CardDisplay key="waiting-room-display" selectupto={1} cards={this.state.game_state.getIn([currentplayer(this.state.game_state), 'waiting_room']).toJS()}
				       clickhandler={
					   id => {
					       let [card, gs] = findAndRemoveCard(id, 'waiting_room', this.state.game_state)
					       this.setState({game_state:gs
							      .updateIn([currentplayer(gs), 'hand'], hand => hand.push(card)),
							      current_action:"End"
							     })
					   }
				       } />]})
	}
	    break;
	case "End": {
	    document.querySelector("#draw-select").close()
	    this.props.onend(this.state.game_state)
	}
	    break;
	}
    }
    render() {
	return (<dialog id="draw-select">
		<div className="mdl-dialog_content">
		
		<span />
		{this.state.actionDesc}
		</div>
		<div className="mdl-dialog_actions">
		<button id='action' className="mdl-button mdl-js-button" onClick={this.clickhandler.bind(this)} enabled={`${this.state.enable_ok}`}>
		{this.state.current_action}
		</button>
		<button id='cancel' className="mdl-button mdl-js-button" 
		onClick={
		    evt => {
			this.props.cancelhandler()
		    }
		}>
		Cancel
		</button>
		</div>
		</dialog>)
    }
    
}

function findoccupiedpositions(gs, player) {
    player = player || currentplayer(gs)
    let positions = []
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'center', 'left']).first())) {
	positions.push(['center','left'])
    }
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'center', 'middle']).first())) {
	positions.push(['center','middle'])
    }
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'center', 'right']).first())) {
	positions.push(['center','right'])
    }
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'back', 'left']).first())) {
	positions.push(['back','left'])
    }
    if(iscard(gs.getIn([currentplayer(gs), 'stage', 'back', 'right']).first())) {
	positions.push(['back','left'])
    }
    return positions;
}

export { attributecurrentturn, selectforpowerandsoul, findAndRemoveCard, DrawSelect, isinfront, findoccupiedpositions }
