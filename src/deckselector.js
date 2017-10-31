import React from 'react'


// select cards from the deck, or anywhere else
// onselect - function to pass card ids that were selected
// selectcount - number of allowable cards to select
// filter - an optional filter that reduces the number of cards to select
function DeckSelector({game_state, field, player, onselect, selectcount, filter}) {
    console.log(`looking at ${field} at player ${player}`)
    if(!Array.isArray(field))
	field = [field]
    return (<dialog className="mdl-dialog" id="deck-selector">
	    <div className="mdl-dialog__content">
	    <div className="mdl-grid">
	    {( _ => {
		let loc = game_state.getIn([player]).getIn(field);

		return loc.toJS().filter(filter).map(c => c.info.id).map(id => <div className="mdl-cell mdl-cell--1-col">{id}</div>)
	    })()
	    }
	    </div>
	    </div>
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
	   

    
