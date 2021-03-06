import React from 'react'

/*
select cards from the stage;  
onselect is called with parameters the selected position
openpositions is the stage positions to select
*/
function StageSelector({onselect, openpositions, selectioncount}) {

    let click = evt => {

	//	onselect(openpositions[0])
	let d = document.querySelectorAll('#stage-select table tr.is-selected')
	
	let dialog = document.querySelector('#stage-select');
	if(dialog)
	    dialog.close()
	if(d.length === selectioncount) {

	    let positions = []
	    for(let item of d) {
		let stage = item.dataset.stage
		let pos = item.dataset.pos
		positions.push([stage,pos])
	    }
	    console.log(`************************************ processing stage select ${positions} ********************************************`)
	    onselect(positions)
	}
	else if(selectioncount === 1) {
	    onselect([openpositions[0]])
	}

    }

    // we default to selecting a single position or update selection count position
    selectioncount = selectioncount || 1;
    
    return (<dialog id="stage-select" className="mdl-dialog">
	    <div className="mdl-dialog__content">
	    <table className="mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp">
	    <thead>
	    <tr>
	    <th>Stage</th>
	    <th>Position</th>
	    </tr>
	    </thead>
	    <tbody>
	    {( _ => {
		if(openpositions) {
		    return openpositions.map( ([s,p], i) => {
			return (<tr key={`pos-${i}`} data-stage={s} data-pos={p}>
				<td>{s}</td><td>{p}</td>
				</tr>)
		    })
		    
		}
	    })()
	    }
	    </tbody>
	    </table>
	    </div>
	    <div className="mdl-dialog__actions">
	    <button id="ok" className="mdl-button mdl-js-button" onClick={click}>
	    Ok
	    </button>
	    <button id="cancel" className="mdl-button mdl-js-button"
	    onClick={
		_ => {
		    document.querySelector('#stage-select').close()
		}
	    }>
	    Cancel
	    </button>
	    </div>
	    </dialog>)
}

export default StageSelector;
