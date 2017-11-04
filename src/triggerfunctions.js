import React from 'react'

function CommonFunc({id, onok, oncancel, children}) {
    return (<dialog id={id}>
	    <div className='mdl-dialog__content'>
	    {children}
	    </div>
	    <div className='mdl-dialog__actions'>
	    <button id='trigger-func-ok' className="mdl-button mdl-js-button" onClick={onok}>
	    OK
	    </button>
	    <button id='trigger-func-cancel' className="mdl-button mdl-js-button" onClick={oncancel}>
	    Cancel
	    </button>
	    </div>
	    </dialog>)

}

function PoolFunction({onok,oncancel}) {
    return (<CommonFunc id='pool-function' onok={onok} oncancel={oncancel} >
	    You May put the Top Card of your deck into your stock
	    </CommonFunc>)
}

function DrawFunction({onok,oncancel}) {
    return (<CommonFunc id='draw-function' onok={onok} oncancel={oncancel} >
	    You May draw the top card of your deck
	    </CommonFunc>)
}

function TreasureFunction({onok,oncancel}) {
    return (<CommonFunc id='treasure-function' onok={onok} oncancel={oncancel} >
	    Return the revealed card to your hand.  Put the top card of your deck into your stock.
	    </CommonFunc>)
}


export { PoolFunction, DrawFunction, TreasureFunction }
