import React from 'react'
import { Nav, Drawer, Body } from 'ui-utils';
import { field, fieldReverse, hand } from './field'
import StartDialog from './start_dialog'
import { Observable } from 'rxjs'
const { create } = Observable;

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
    
    componentDidUpdate() {
	componentHandler.upgradeDom();
	if(this.state.prompt) {
	}
    }
    
    render() {
	const title = "Weiss Game Simulator"
	return (<div className="mdl-layou mdl-js-layout">
		<Nav title={title} />
		<Drawer title={title} />
		<Body>
		
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
		{( _ => {
		    if(this.state.prompt) {
			return this.state.prompt;
		    }
		})()
		}
		<StartDialog />
		</Body>
		</div>)
    }
}

export default Main;
