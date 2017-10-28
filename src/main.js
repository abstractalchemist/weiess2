import React from 'react'
import { Nav, Drawer, Body } from 'ui-utils';

class Main extends React.Component {
    
    constructor(props) {
//	super()
	super(props)
	props.controller.registerUI(this)
	this.state = { game_state: props.game_state }
    }
 
    updateUI(gs, obs, evt) {
	this.setState({game_state:gs})
	this.obs = obs;
    }
    
    render() {
	const title = "Weiss Game Simulator"
	return (<div className="mdl-layou mdl-js-layout">
		<Nav title={title} />
		<Drawer title={title} />
		<Body>
		</Body>
		</div>)
    }
}

export default Main;
