import React from 'react'

function CommonFunc({id, onok, oncancel, children}) {
    return (<dialog id={id}>
	    <div className='mdl-dialog__content'>
	    {children}
	    </div>
	    <div className='mdl-dialog__actions'>
	    <button className="mdl-button mdl-js-button" onClick={onok}>
	    OK
	    </button>
	    <button className="mdl-button mdl-js-button" onClick={oncancel}>
	    Cancel
	    </button>
	    </div>
	    </dialog>)

}

function PoolFunction({onok,oncancel}) {
    return (<CommonFunc id='pool-function' onok={onok} oncancel={oncancel} >
	    </CommonFunc>)
}

function DrawFunction({onok,oncancel}) {
    return (<CommonFunc id='draw-function' onok={onok} oncancel={oncancel} >
	    </CommonFunc>)
}

function TreasureFunction({onok,oncancel}) {
        return (<CommonFunc id='treasure-function' onok={onok} oncancel={oncancel} >
		</CommonFunc>)
}


export { PoolFunction, DrawFunction, TreasureFunction }
