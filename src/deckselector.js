import React from 'react'

import { shuffle } from './utils'


// select cards from the deck, or anywhere else
function DeckSelector({game_state, field, player, onselect, selectcount, filter}) {
    
    return (<dialog className="mdl-dialog" id="deck-selector">
	    <div className="mdl-dialog__content">
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
	   

    
