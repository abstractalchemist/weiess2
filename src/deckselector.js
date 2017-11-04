import React from 'react'


class CardDisplay extends React.Component {
    constructor(props) {
	super(props)
	this.state = { i : 0 }
    }

    render() {
	return (<div className='mdl-dialog__content' style={
	    ( _ => {
		if(this.props.cards && this.props.cards.length > 0)
		    return {background:`no-repeat center/80% url(${this.props.cards[this.state.i].info.image})`, display:"flex", minHeight:"290px"}
		return {}
	    })()
	}><div style={{alignSelf:"flex-end"}}>
		<button className="mdl-button mdl-js-button mdl-button--icon">
		<i className="material-icons">plus</i>
		</button>
		<input className="mdl-slider mdl-js-slider" type="range" value={this.state.i} onChange={
		    evt => {
			this.setState({i:evt.currentTarget.value})
		    }
		}
		min="0" max={this.props.cards.length - 1} tabindex="0"></input>
		</div>
		</div>)
	
    }
}


// select cards from the deck, or anywhere else
// onselect - function to pass card ids that were selected
// selectcount - number of allowable cards to select
// filter - an optional filter that reduces the number of cards to select
function DeckSelector({game_state, field, player, onselect, selectcount, filter}) {
    console.log(`looking at ${field} at player ${player}`)
    if(!Array.isArray(field))
	field = [field]
    filter = filter || (_ => true)
    return (<dialog className="mdl-dialog" id="deck-selector">
	    <CardDisplay cards={game_state.getIn([player].concat(field)).filter(filter).toJS()} />
	    <div className="mdl-dialog__actions">
	    <button id='deckselector-ok' className="mdl-button mdl-js-button" onClick={
		evt => {
		    let ids = [];  // TODO: decide how show the ids to be selected
		    if(document.querySelector('#deck-selector'))
			document.querySelector('#deck-selector').close()
		    onselect(ids)
		}
	    }>
	    Ok
	    </button>
	    </div>
	    </dialog>)
}

export default DeckSelector;



