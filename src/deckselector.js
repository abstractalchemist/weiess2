import React from 'react'


/*
 Display all cards from a list
- properties
  - cards - list of cards to select from
  - selectupto -  number of cards before this component is disabled
  - clickhandler - called each time with a card id identifying the card chosen
*/
class CardDisplay extends React.Component {
    constructor(props) {
	super(props)
	this.state = { i : 0, selected:0 }
    }

    componentDidUpdate() {
	componentHandler.upgradeDom();
    }

    render() {
	return (<div className='mdl-dialog__content' style={
	    ( _ => {
		if(this.props.cards && this.props.cards.length > 0)
		    return {background:`no-repeat center/80% url(${this.props.cards[this.state.i].info.image})`, display:"flex", minHeight:"290px"}
		return {}
	    })()
	}><div style={{alignSelf:"flex-end",backgroundColor:"white"}}>
		<button id='select-card' className="mdl-button mdl-js-button mdl-button--icon" onClick={
		    evt => {
			console.log(`found ${this.props.cards[this.state.i]} from ${this.state.i}`)
			this.props.clickhandler(this.props.cards[this.state.i].info.id)
			this.setState({selected:this.state.selected + 1})
		    }
		} enabled={"" + (this.state.selected <= this.props.selectupto)}>
		<i className="material-icons">plus</i>
		</button>
		<input className="mdl-slider mdl-js-slider" type="range" value={this.state.i} onChange={
		    evt => {
			this.setState({i:evt.currentTarget.value})
		    }
		}
		min="0" max={this.props.cards.length - 1} tabIndex="0"></input>
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
    let ids = []
    return (<dialog className="mdl-dialog" id="deck-selector">
	    <CardDisplay cards={game_state.getIn([player].concat(field)).filter(filter).toJS()} clickhandler={
		id => {
		    console.log(`selected ${id}`)
		    ids.push(id)
		}
	    } selectupto={selectcount}/>
	    <div className="mdl-dialog__actions">
	    <button id='deckselector-ok' className="mdl-button mdl-js-button" enabled={"" + (ids.length <= selectcount)} onClick={
		evt => {
		    if(document.querySelector('#deck-selector'))
 			document.querySelector('#deck-selector').close()
		    onselect(ids)
		}
		
	    }>
	    Cancel
	    </button>
	    </div>
	    </dialog>)
}

export { DeckSelector as default, CardDisplay }
