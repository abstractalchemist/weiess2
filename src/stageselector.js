import React from 'react'

/*
select cards from the stage;  
onselect is called with parameters the selected position
openpositions is the stage positions to select
*/
function StageSelector({onselect, openpositions, selectioncount}) {

    let click = evt => {
	onselect(openpositions[0])
    }

    // we default to selecting a single position or update selection count position
    selectioncount = selectioncount || 1;
    
    return (<dialog id="stage-select" className="mdl-dialog">
	    <div className="mdl-dialog__content">
	    <table className="mdl-table">
	    <thead>
	    </thead>
	    <tbody>
	    </tbody>
	    </table>
	    </div>
	    <div className="mdl-dialog__actions">
	    <button id="ok" className="mdl-button mdl-js-button" onClick={click}>
	    Ok
	    </button>
	    <button id="cancel" className="mdl-button mdl-js-button">
	    Cancel
	    </button>
	    </div>
	    </dialog>)
}

export default StageSelector;
