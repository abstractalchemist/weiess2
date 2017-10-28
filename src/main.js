import React from 'react'
import { Nav, Drawer, Body } from 'ui-utils'

class Main extends React.Components {
    constructor(props) {
	super(props)
	props.controller.registerUI(this)
    }

    render() {
	const title = "Weiss Game Simulator"
	return (<div className="mdl-layou mdl-js-layout">
		<Nav title={title}/>
		<Drawer title={title}/>
		<Body>
		</Body>
		</div>)
    }
}

export default Main;
