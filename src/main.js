import React from 'react'
import { Nav, Drawer, Body } from 'ui-utils';
import { field, fieldReverse, hand } from './field'
import StartDialog from './start_dialog'
import { Observable } from 'rxjs'
const { create, of } = Observable;
import { buildCardSet, CardSetNameView } from 'weiss-utils'
import CardStore from './card_store'
import { hasavailableactions, currentplayer, inactiveplayer } from './utils'
import { fromJS } from 'immutable'

function TextField({id, label, value, changehandler}) {
    return (<div className="mdl-textfield mdl-js-textfield">
	    <input className="mdl-textfield__input" type="text" id={id} value={value} onChange={changehandler}></input>
	    <label className="mdl-textfield__label" htmlFor={id}></label>
	    </div>)
}

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
	    let p = document.querySelector('#'+ this.state.prompt.id)
	    if(!p.open)
		p.showModal();
	    
	}
	componentHandler.upgradeDom();
	this.props.controller.updategamestate(this.state.game_state)
    }

    loadDecks() {
	this.setState({load_mode:'load_decks'})
    }

    selectRandomCards() {
	let targetSets = this.state.selected_sets;
	let targetLevel = undefined;
	try {
	    
	    if(isNaN(targetLevel = parseInt(this.state.oppos_level)))
		targetLevel = 3;
	    
	}
	catch(e) {
	    targetLevel = 3;
	}

	let cards = []
	of(targetSets)
	    .mergeMap(CardStore.getcardsfromset)
	    .subscribe(
		c => {
		    cards.push(CardStore.internalmapper(c))
		},
		err => {
		},
		_ => {
		    let avail = cards.filter(({info}) => {
			if(info.level)
			    return parseInt(info.level) <= targetLevel
		    })
		    
		    let player = inactiveplayer(this.state.game_state)

		    this.setState({game_state:this.state.game_state
				   .updateIn([player, 'stage', 'center','left'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))
				   .updateIn([player, 'stage', 'center','middle'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))
				   .updateIn([player, 'stage', 'center','right'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))
				   .updateIn([player, 'stage', 'back','left'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))
				   .updateIn([player, 'stage', 'back','right'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))})
		    
		})
	
    }

    changelevelhandler(evt) {
	this.setState({oppos_level:evt.currentTarget.value})   
    }

    changeclockhandler(evt) {
	this.setState({oppos_clock:evt.currentTarget.value})   
    }

    
    placeCards() {

	
	let close = _ => {
	    this.setState({prompt:undefined})
	    document.querySelector('#populate-dialog').close()
	}
	let close_oppos = _ => {
	    this.setState({prompt:undefined})
	    document.querySelector('#configure-oppos').close();
	}

	this.setState({load_mode:'place_cards',
		       prompt:
		       {
			   prompt:(<dialog className="mdl-dialog" id='populate-dialog' style={{width:"fit-content"}}>
				   <div className="mdl-dialog__content">
				   <h5>Select Card Set to Populate Opposing</h5>
				   <CardSetNameView cardsets={this.state.cardsets}/>
				   
				   </div>
				   <div className="mdl-dialog_actions">
				   <button className="mdl-button mdl-js-button" onClick={
				       evt => {
					   let selected = document.querySelectorAll('#populate-dialog table tr.is-selected td:nth-child(2)')
					   let targets = []
					   for(let i = 0; i < selected.length; ++i) {
					       targets.push(selected.item(i).dataset.id)
					   }

					   close()
					   this.setState({
					       selected_sets:targets,
					       prompt: {
					  	   id:'configure-oppos',
						   prompt:
						       <dialog id='configure-oppos' className="mdl-dialog">
						       <div className="mdl-dialog__contents">
						       <TextField id="level-input" label="Level...." changehandler={this.changelevelhandler.bind(this)} value={this.state.oppos_level}/>
						       <TextField id="clock-input" label="Clock..." changehandler={this.changeclockhandler.bind(this)} value={this.state.oppos_clock}/>
						       </div>
						       <div className="mdl-dialog__actions">
						       <button className="mdl-button mdl-js-button" onClick={
							   evt => {
							       
							       close_oppos()
							       this.selectRandomCards();
							   }
						       }>
						       Ok
						   </button>
						       <button className="mdl-button mdl-js-button" onClick={close_oppos}>
						       Cancel
						       </button>
						       </div>
						       </dialog>} })
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
	let target = evt.currentTarget.dataset.id;
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
				    {label:'Center Left', id:'stage-center-left'},
				    {label:'Center Middle', id:'stage-center-middle'},
				    {label:'Center Right', id:'stage center-right'},
				    {label:'Back Left', id:'stage-back-left'},
				    {label:'Back Right', id:'stage-back-right'},
				    {label:'Deck', id:'deck'},
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
				    this.addCardToField(selected.id, target)
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

    addCardToField(selected_field, cardid) {
	CardStore.getcard(cardid).subscribe(
	    card => {
		let field = selected_field.split('-')
		this.setState({game_state:this.state.game_state.updateIn([currentplayer(this.state.game_state)], f => {
		    return f.updateIn(field, loc => {
			return loc.push(fromJS(card))
		    })
		})})
	    })
	
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
