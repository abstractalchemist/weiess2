import React from 'react'

function CardSelector({onselect,selection}) {
    return (<dialog id='card-selector'>
	    <div className="mdl-dialog__content">
	    </div>
	    <div className="mdl-dialog__actions">
	    <button id="ok" className="mdl-button mdl-js-button" onClick={
		evt => {
		    onselect()
		}
	    }>
	    Ok
	    </button>
	    </div>
	    </dialog>)
}

export { CardSelector as default }
