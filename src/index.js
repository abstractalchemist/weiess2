import React from 'react'
import ReactDOM from 'react-dom'
import Main from './main'
import ControllerFactory from './controller'
import GameStateFactory from './game_state'

document.addEventListener('DOMContentLoaded', _ => {
    let gs = undefined
    ReactDOM.render(<Main controller={ControllerStateFactory(gs = GameStateFactory())} game_state={gs}/>, document.querySelector('#content'))
})
