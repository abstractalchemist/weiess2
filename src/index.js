import React from 'react'
import ReactDOM from 'react-dom'
import Main from './main'
import ControllerFactory from './controller'
import GameStateFactory from './game_state'

document.addEventListener('DOMContentLoaded', _ => {
    
    ReactDOM.render(<Main controller={ControllerStateFactory(GameStateFactory())}/>, document.querySelector('#content'))
})
