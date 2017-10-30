import React from 'react'
import { Nav, Drawer, Body } from 'ui-utils';
import { field, fieldReverse, hand } from './field'
import StartDialog from './start_dialog'
import { Observable } from 'rxjs'
const { create } = Observable;
import { buildCardSet } from 'weiss-utils'
import CardStore from './card_store'
import { hasavailableactions } from './utils'

class Main extends React.Component {
    
    constructor(props) {
//	super()
	super(props)
	props.controller.registerUI(this)
	this.state = { game_state: props.game_state,
		       show_inactive_hand: false}
	
    }
 
    updateUI(gs, obs, evt) {
	
	this.setState({game_state:gs, obs, evt})
	if(!hasavailableactions(gs) && !this.state.prompt) {
	    obs.next(gs)
	    obs.complete()
	}
    }

    prompt(promptfunc) {
	return create(obs => {
	    let { id, prompt } = promptfunc(gs => {
		obs.next(gs)
		obs.complete()
	    })
	    
	    this.setState({prompt:{id,prompt}})
	})
    }
    
    componentDidMount() {
	CardStore.getcardsets().subscribe(
	    data => {
		this.setState({cardsets:data})
	    }
	);

    }

    componentDidUpdate() {
	
	if(this.state.prompt) {
	    document.querySelector('#'+ this.state.prompt.id).showModal();
	}
	componentHandler.upgradeDom();
    }

    loadDecks() {
	this.setState({load_mode:'load_decks'})
    }

    placeCards() {
	let close = _ => {
	    this.setState({prompt:undefined})
	    document.querySelector('#populate-dialog').close()
	}
	this.setState({load_mode:'place_cards',
		       prompt:
		       {
			   prompt:(<dialog className="mdl-dialog" id='populate-dialog'>
				   <div className="mdl-dialog__content">
				   </div>
				   <div className="mdl-dialog_actions">
				   <button className="mdl-button mdl-js-button" onClick={
				       evt => {
					   close()
				       }
				   }>
				   Populate
				   </button>
				   <button className="mdl-button mdl-js-button" onClick={close}>
				   Cancel
				   </button>
				   </div>
				   </dialog>),
			   id:"populate-dialog"
		       }})
    }

    loadScenario() {
	this.setState({load_mode:'load_scenario'})
    }

    updateCardView() {
	let selected = document.querySelectorAll("#cardset-selector tr.is-selected td:nth-child(2)");
	let targets = [];
	if(selected) {
	    for(let i = 0; i < selected.length; ++i) {
		let item = selected.item(i);
		if(item.dataset.id)
		    targets.push(item.dataset.id);
	    }
	}
	//	let target = targets[0];
	let observable = Observable.merge.apply(undefined, targets.map(CardStore.getcardsfromset));
//	let observable = Cards.getcardsfromset(target);
	let buffer = [];
	if(this.cardViewRetrieveHandle) {
	    this.cardViewRetrieveHandle.unsubscribe();
	}
	if(this.ownershipRetrieveHandle) {
	    this.ownershipRetrieveHandle.unsubscribe();
	}
	
	this.cardViewRetrieveHandle = observable.subscribe(
	    data => {
		buffer.push(data)
	    },
	    err => {
		console.log(`error ${err}`);
	    },
	    _ => {
//		console.log('update card view');
		this.setState({cardset:targets,cardset_coll:buffer,is_building:true});
		let buffer2 = [];
		this.ownershipRetrieveHandle = Observable.from(buffer)
		    .subscribe(
			data => {
			    buffer2.push(data);
			},
			err => {
			    console.log(`error ${err}`);
			},
			_ => {
			    
			    this.setState({is_building:undefined,cardset_coll:buffer2});
			})
 	    })
    }

    addFromSetToField(evt) {
	let close = _ => {
	    this.setState({prompt:undefined})
	    document.querySelector('#add-to-field').close()
	    
	}
	this.setState({prompt: {
	    id:'add-to-field',
	    prompt:
	    (_ => {
		return (<dialog className="mdl-dialog" id="add-to-field">
			<div className="mdl-dialog__content">
			<table className="mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp">
			<thead>
			<tr>
			<th>Location</th>
			</tr>
			</thead>
			<tbody>
			{( _ => {
			    return [{label:'Hand',id:'hand'},
				    {label:'Center Left', id:'center-left'},
				    {label:'Center Middle', id:'center-middle'},
				    {label:'Center Right', id:'center-right'},
				    {label:'Back Left', id:'back-left'},
				    {label:'Back Right', id:'back-right'},
				    {label:'Waiting Room', id:'waiting_room'}].map(o => {
					return (<tr id={o.id}>
						<td>{o.label}</td>
						</tr>)
				    })
			})()
			}
			</tbody>
			</table>
			</div>
			<div className="mdl-dialog__actions">
			<button className="mdl-button mdl-js-button" onClick={
			    evt => {
				let selected = document.querySelector('#add-to-field table tr.is-selected');
				if(selected) {
				    console.log(selected.id)
				}
				close()
			    }
			}>
			Ok
			</button>
			<button className="mdl-button mdl-js-button" onClick={close} >
			Cancel
			</button>
			</div>
			</dialog>)
	    })()
	}})
    }
    
    buildSetObj() {
	return {
	    cardset:this.state.cardset,
	    cardsets:this.state.cardsets,
	    updateCardView:this.updateCardView.bind(this),
	    is_building:this.state.is_building,
	    cardset_coll:this.state.cardset_coll,
	    addhandler2:(this.state.load_mode === 'place_cards' ? this.addFromSetToField.bind(this) : undefined)
	}
    }
    
    render() {
	const title = "Weiss Game Simulator"
	return (<div className="mdl-layout mdl-js-layout">
		<Nav title={title} tabs={[{id:"fixed-tab-2",label:"Game Field"},{id:"fixed-tab-1",label:"Card Set View"}]}/>
		<Drawer title={title} />
		<Body>


		<section className="mdl-layout__tab-panel is-active" id="fixed-tab-2">
		<div className="page-content">

		<div className="mdl-grid">
		<div className="mdl-cell--2-col">
		<button className="mdl-button mdl-js-button" onClick={this.loadDecks.bind(this)}>
		Load Decks
		</button>
		</div>
		<div className="mdl-cell--2-col">
		<button className="mdl-button mdl-js-button" onClick={this.placeCards.bind(this)}>
		Place Cards
		</button>
		</div>
		<div className="mdl-cell--2-col">
		<button className="mdl-button mdl-js-button" onClick={this.loadScenario.bind(this)}>
		Load Scenario
		</button>
		</div>
		<div className="mdl-cell--2-col">
		<button className="mdl-button mdl-js-button">
		End Phase
		</button>
		</div>
		<div className="mdl-cell--2-col">
		<label className="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" htmlFor="checkbox-1">
		<input type="checkbox" id="checkbox-1" className="mdl-checkbox__input" value={this.state.show_inacive_hand} onChange={
		    evt => {
			this.setState({ show_inactive_hand: evt.currentTarget.value })
		    }
		}></input>
		<span className="mdl-checkbox__label">Show Inactive Player Hand</span>
		</label>
		</div>
		<div className="mdl-cell--2-col">
		</div>
		{( _ => {
		    if(this.state.show_inactive_hand) {
			let cardsinhand = this.state.game_state.getIn([inactiveplayer(this.state.game_state), 'hand']);
			let space = 12 - ((2*cardsinhand.size) % 12);
			
			return hand({game_state:this.state.game_state, player:inactiveplayer(this.state.game_state)}).concat([<div className={"mdl-cell mdl-cell--" + space + "-col"}/>,<div className={"mdl-cell mdl-cell--12-col spacer"} />]);
			
		    }
		})()}
		{fieldReverse(this.state)}

		<div className="mdl-cell mdl-cell--12-col spacer"/>
		{field(this.state)}
		<div className="mdl-cell mdl-cell--12-col spacer"/>
		{hand(this.state)}
		</div>

		</div>
		</section>

		<section className="mdl-layout__tab-panel is-active" id="fixed-tab-1">
		<div className="page-content">
		{buildCardSet(this.buildSetObj())}
		</div>
		</section>
		{( _ => {
		    if(this.state.prompt) {
			return this.state.prompt.prompt;
		    }
		})()
		}
		
		<StartDialog />		
		</Body>
		
		</div>)
    }
}

export default Main;
