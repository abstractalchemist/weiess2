// a set of functions to apply modifiers to attributes

function power_calc(card, gs) {
    let base = card.getIn(['active','power'])
    if(typeof base === 'function')
	base = base(gs)
    return base
}

function soul_calc(card, gs) {
    let base = card.getIn(['active','soul'])
    if(typeof base === 'function')
	base = base(gs)
    return base

}

function level_calc(card, gs) {
}

function cost_calc(card, gs) {
}

export { power_calc, soul_calc, level_calc, cost_calc }
