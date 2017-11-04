import React from 'react'
import { Nav, Drawer, Body } from 'ui-utils';
import { field, fieldReverse, hand } from './field'
import StartDialog from './start_dialog'
import { Observable } from 'rxjs'
const { create, of } = Observable;
import { buildCardSet, CardSetNameView } from 'weiss-utils'
import GameStateFactory from './game_state'
import CardStore from './card_store'
import { hasavailableactions } from './utils'
import { currentplayer, inactiveplayer } from './game_pos'
import { fromJS } from 'immutable'
import GamePhases from './game_phases'
import DeckStore from './deck_store'

function TextField({id, label, value, changehandler}) {


    return(<div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
	   <input className="mdl-textfield__input" type="text" pattern="-?[0-9]*(\.[0-9]+)?" id={id} value={value} onChange={changehandler}></input>
	   <label className="mdl-textfield__label" htmlFor={id}>{label}</label>
	   <span className="mdl-textfield__error">Input is not a number!</span>
	   </div>)
}

class Main extends React.Component {
    
    constructor(props) {
	//	super()
	super(props)
	this.props.controller.registerUI(this)
	this.state = { game_state: props.game_state,
		       show_inactive_hand: false}

	
    }

    closeCurrentPrompt() {
	if(this.state.prompt) {
	    try {

		// it's usually ok if this failse
		document.querySelector('#' + this.state.prompt.id).close()
	    }
	    catch(e) {
	    }
	    this.setState({prompt:undefined})
	}
    }
    
    // ignoreprompts is a hack which calling implies ignoring the promt
    updateUI(gs, obs, evt, ignoreprompts) {
	
	this.setState({game_state:gs, obs, evt})
	if(obs) {
//	    console.log(`observing ${evt.evt}`)
	    let a, b;
	    if(!(a = hasavailableactions(gs)) && (ignoreprompts || !(b = this.state.prompt))) {
//		console.log(`no available actions, leaving`)
		obs.next(gs)
		obs.complete()
		//		setTimeout(this.turn.bind(this), 2000)
	    }
	    else {
//		console.log(`actions? ${a}, prompts ${b}`)
	    }
	}
	else {
//	    console.log(`no obs, evt ${evt}`)
	}
    }

    prompt(promptfunc) {
	if(promptfunc) {
	    return create(obs => {
		let { id, prompt } = promptfunc(gs => {
		    obs.next(gs)
		    obs.complete()
		})
		
		this.setState({prompt:{id,prompt}})
	    })
	}
	else
	    this.setState({prompt:undefined})
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
	//this.props.controller.updategamestate(this.state.game_state)
    }

    loadDecks() {
	DeckStore.getdecks()
	    .subscribe(
		decks => {
		    this.setState({load_mode:'load_decks', prompt: {
			prompt: (<dialog id='deck-loader' className="mdl-dialog">
				 <div className="mdl-dialog__content">
				 <table className="mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp">
				 <thead>
				 <tr className="mdl-data-table__cell--non-numeric">
				 <th>DeckName</th>
				 </tr>
				 </thead>
				 <tbody>
				 {( _ => {
				     if(decks && decks.length) {
					 return decks.map(d => {
					     return (<tr data-id={d.id}>
						     <td>{d.label}</td>
						     </tr>)
					 })
				     }
				 })()
				 }
				 </tbody>
				 </table>
				 </div>
				 <div className="mdl-dialog__actions">
				 <button className="mdl-button mdl-js-button" onClick={
				     _ => {
					 let selected = document.querySelectorAll('#deck-loader table tr.is-selected')
					 if(selected) {
					     this.closeCurrentPrompt()
					     if(selected.length !== 2) {
						 alert("Please select two decks")
						 return;
					     }
					     
					     let deck1;
					     Deck.getdeck(selected.item(0).dataset.id)
						 .mergeMap(({id}) => Card.getcard(id))
						 .toArray()
						 .do(deck => {
						     deck1 = deck;
						 })
						 .mergeMap(_ => {
						     Deck.getdeck(selected.item(1).dataset.id)
						 })
						 .mergeMap(({id}) => Card.getcard(id))
						 .toArray()
						 .subscribe(
						     deck => {
							 this.props.controller.updategamestate(GameStateFactory()
											       .updateIn(['player1', 'deck'], _ => fromJS(deck1))
											       .updateIn(['player2', 'deck'], _ => fromJS(deck2)))
						     },
						     err => {
							 throw new Error(err)
						     },
						     _ => {})
					     
					 }
				     }
				 }>
				 Load
				 </button>
				 <button className="mdl-button mdl-js-button" onClick= {
				     _ => {
					 this.closeCurrentPrompt()
				     }
				 }>
				 Cancel
				 </button>
				 </div>
				 </dialog> ),
			id:'deck-loader'
		    }})
		},
		err => {
		    throw new Error(err)
		},
		_ => {})
	
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
			if(info.level && info.power > 0)
			    return parseInt(info.level) <= targetLevel
		    })
		    
		    let player = inactiveplayer(this.state.game_state)

		    this.props.controller.updategamestate(GameStateFactory()
							  .updateIn(['turn'], _ => 0)
							  .updateIn(['phase'], _ => 'start')
							  .updateIn([player, 'level'], level => {
							      let i = 0;
							      while(i++ < targetLevel)
								  level = level.push(fromJS(avail[Math.floor(Math.random() * avail.length)]))
							      return level
							  })
							  .updateIn([player, 'deck'], deck => {
							      for(let i = 0; i < 10; ++i) {
								  deck = deck.push(fromJS(avail[Math.floor(Math.random() * avail.length)]))
							      }
							      return deck
							  })
							  .updateIn([player, 'stage', 'center','left'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))
							  .updateIn([player, 'stage', 'center','middle'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))
							  .updateIn([player, 'stage', 'center','right'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))
							  .updateIn([player, 'stage', 'back','left'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)])))
							  .updateIn([player, 'stage', 'back','right'], card => card.push(fromJS(avail[Math.floor(Math.random() * avail.length)]))))
		    
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
				    {label:'Center Right', id:'stage-center-right'},
				    {label:'Back Left', id:'stage-back-left'},
				    {label:'Back Right', id:'stage-back-right'},
				    {label:'Deck', id:'deck'},
				    {label:'Level', id:'level'},
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
//				    console.log(selected.id)
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
		this.props.controller.updategamestate(this.state.game_state.updateIn([currentplayer(this.state.game_state)], f => {
		    return f.updateIn(field, loc => {
			return loc.unshift(fromJS(card))
		    })
		}))
	    })
	
    }
    
    buildSetObj() {
	return {
	    cardset:this.state.cardset,
	    cardsets:this.state.cardsets,
	    updateCardView:this.updateCardView.bind(this),
	    is_building:this.state.is_building,
	    cardset_coll:this.state.cardset_coll,
	    addhandler2:(this.state.load_mode === 'place_cards' ? this.addFromSetToField.bind(this) : undefined),
	    addFilterOptions:[
		    <div style={{width:"100%"}}/>,
		    <TextField label="Stock Count" id="stock-count" value={this.state.stock_it} changehandler={this.stockIt.bind(this)}/>,
		    <button className="mdl-button mdl-js-button mdl-button--raised" onClick={this.stockItNow.bind(this)}>
		    Fill Stock
		</button>,
		    <TextField label="Deck Count" id="deck-count" value={this.state.deck_it} changehandler={this.deckIt.bind(this)}/>,
		    <button className="mdl-button mdl-js-button mdl-button--raised" onClick={this.deckItNow.bind(this)}>
		    Fill Deck
		</button>

	    ]
	}
    }


    fillIt(field, size) {
	if(!Array.isArray(field))
	    field = [field]
	let buffer = []
	let gs = this.state.game_state;
//	console.log(`${field}ing from ${this.state.cardset}`)
	CardStore.getcardsfromset(this.state.cardset)
	    .map(CardStore.internalmapper)
	    .toArray()
	    .map(fromJS)
	    .subscribe(
		data => {
		    let i = 0;
		    while(i++ < size) {
			let r = Math.floor(Math.random() * data.size)
			let card = data.get(r)
//			console.log(`pushing ${card}`)
			gs = gs.updateIn([currentplayer(gs)], f => {
			    return f.updateIn(field, deck => deck.push(card))
			})
		    }
		},
		err => {
		},
		_ => {
		    this.props.controller.updategamestate(gs)
		})
	

    }
    
    stockItNow() {
//	console.log(`stocking from ${this.state.cardset}`)
	this.fillIt('stock', this.state.stock_it)
	this.setState({stock_it:0})
    }

    deckItNow(evt) {
	this.fillIt('deck', this.state.deck_it)
	this.setState({deck_it:0})

    }

    stockIt(evt) {
	this.setState({stock_it:evt.currentTarget.value})
    }

    deckIt(evt) {
	this.setState({deck_it:evt.currentTarget.value})
    }

    turn() {
	if(this.state.obs) {
	    this.state.obs.next(this.state.game_state)
	    this.state.obs.complete();
	    this.setState({obs:undefined})
	}
	this.props.controller.next()

    }
    
    render() {
	const title = "Weiss Game Simulator"
	return (<div className="mdl-layout mdl-js-layout">
		<Nav title={title} tabs={[{id:"fixed-tab-2",label:"Game Field"},{id:"fixed-tab-1",label:"Card Set View"}]}/>
		<Drawer title={title} />
		<Body>


		<section className="mdl-layout__tab-panel" id="fixed-tab-2">
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
		</div>
		<div className="mdl-cell--2-col">
		<label className="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" htmlFor="checkbox-1">
		<input type="checkbox" id="checkbox-1" className="mdl-checkbox__input" value={this.state.show_inacive_hand} onChange={
		    evt => {
			this.setState({ show_inactive_hand: evt.currentTarget.checked })
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
			
			return hand({game_state:this.state.game_state, player:inactiveplayer(this.state.game_state)}, this).concat([<div className={"mdl-cell mdl-cell--" + space + "-col"}/>,<div className={"mdl-cell mdl-cell--12-col spacer"} />]);
			
		    }
		})()}
		{fieldReverse(this.state, this)}

		<div className="mdl-cell mdl-cell--12-col spacer">
		<button className="mdl-button mdl-js-button" onClick={this.turn.bind(this)} disabled={!this.state.load_mode}>
		{( _ => {
		    let phase = this.state.game_state.getIn(['phase'])
		    if(phase === GamePhases.not_started.id)
			return "Start Game"
		    else {
			switch(phase) {
			case GamePhases.standup.id:
			    return "End " + GamePhases.standup.label
			    
			case GamePhases.draw.id:
			    return "End " + GamePhases.draw.label
			    
			    
			case GamePhases.clock.id:
			    return "End " + GamePhases.clock.label
			    
			    
			case GamePhases.main.id:
			    return "End " + GamePhases.main.label
			case GamePhases.climax.id:
			    return "End " + GamePhases.climax.label
			case GamePhases.attack.id:
			    return "End " + GamePhases.attack.label
			default:
			    return "Unknown Game Phase; Restart"
			}
		    }
		    
		})()
		 
		 
		}
		</button>

		</div>
		{field(this.state, this)}
		<div className="mdl-cell mdl-cell--12-col spacer">

		</div>
		{hand(this.state, this)}
		</div>

		</div>
		</section>

		<section className="mdl-layout__tab-panel" id="fixed-tab-1">
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
