function currentplayer(gs) {
    if(!gs)
	throw new Error("currentplayer(gs) parameter null")

    if(gs.getIn(['turn']) === undefined)
	throw new Error("invalid turn defined")
    return `player${gs.getIn(['turn']) % 2 + 1}`
}

function inactiveplayer(gs) {
    let p = currentplayer(gs)
    if(p === 'player1') return 'player2'
    if(p === 'player2') return 'player1'
}

const render = function(field, gs, player) {
    if(gs) {
	player = player || currentplayer(gs)
	return [player].concat(field)
    }
    return field
	
}

const GamePositions = {
    stock(gs, player) {
	return render(['stock'], gs, player)
    },
    clock(gs, player) {
	return render(['clock'], gs, player)
    },
    stage_cl(gs,player) {
	return render(['stage','center','left'], gs, player)
    },
    stage_cm(gs,player) {
	return render(['stage','center','middle'], gs, player)
    },
    stage_cr(gs,player) {
	return render(['stage','center','right'], gs, player)
    },
    stage_bl(gs,player) {
	return render(['stage','back','left'], gs, player)
    },
    stage_br(gs,player) {
	return render(['stage','back','right'], gs, player)
    },
    level(gs, player) {
	return render(['level'], gs, player)
    },
    hand(gs, player) {
	return render(['hand'], gs, player)
    },
    clock(gs, player) {
	return render(['clock'], gs, player)
    },
    waiting_room(gs, player) {
	return render(['waiting_room'], gs, player)
    }
}


export { currentplayer, inactiveplayer, GamePositions as default }
