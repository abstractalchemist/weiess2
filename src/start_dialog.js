import React from 'react'

function Button({id, title, clickhandler, noshow}) {
    let className = "mdl-button mdl-js-button"
    if(!noshow)
	className += " mdl-button--raised"
    return (<button className={className} onClick={clickhandler}>
	    {title}
	    </button>)
}

function Dialog({id, title, children, actions, open}) {
    return (<dialog className="mdl-dialog" id={id} style={{width:"fit-content"}} open={open}>
	    <h4 className="mdl-dialog__title">{title}</h4>
	    <div className="mdl-dialog__content">
	    {children}
	    </div>
	    <div className="mdl-dialog__actions">
	    {actions}
	    </div>
	    </dialog>)
}


function StartDialog({decks, starthandler}) {

    let close = _ => {
	document.querySelector('#game-start').close()
    }
    return (<Dialog id='game-start'
	    title="Start Game"
	    actions={[<Button noshow key="start" title="Start" clickhandler={starthandler}/>,
		      <Button noshow key="cancel" title="Cancel" clickhandler={close}/>]}>
	    <table className="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
	    <thead>
	    <tr>
	    <th>Deck Name</th>
	    <th>Player 1</th>
	    <th>Player 2</th>
	    </tr>
	    </thead>
	    <tbody>
	    {decks}
	    
	    </tbody>
	    
	    </table>
	    
	    </Dialog>)
}

export default StartDialog;
