export default {
    not_started: {
	label: "Not Started",
	id: "not_started",
	set(gs) {
	    return gs.updateIn(['phase'],_ => this.id)
	},
	start(obj) {
	    return Object.assign({},{evt:this.id,when:"start"},obj)
	}
    },
    standup: {
	label: "Standup",
	id: "standup",
	set(gs) {
	    return gs.updateIn(['phase'],_ => this.id)
	},
	start(obj) {
	    return Object.assign({},{evt:this.id,when:"start"},obj)
	}
	
    },
    draw: {
	label:"Draw",
	id:"draw",
	set(gs) {
	    return gs.updateIn(['phase'],_ => this.id)
	},
	start(obj) {
	    return Object.assign({},{evt:this.id,when:"start"},obj)
	}
	
    },
    clock: {
	label:"Clock",
	id:"clock",
	set(gs) {
	    return gs.updateIn(['phase'],_ => this.id)
	},
	start(obj) {
	    return Object.assign({},{evt:this.id,when:"start"},obj)
	}

    },
    main: {
	label:"Main",
	id:"main",
	set(gs) {
	    return gs.updateIn(['phase'],_ => this.id)
	},
	start(obj) {
	    return Object.assign({},{evt:this.id,when:"start"},obj)
	}

    },
    climax: {
	label:"Climax",
	id:"climax",
	set(gs) {
	    return gs.updateIn(['phase'],_ => this.id)
	},
	start(obj) {
	    return Object.assign({},{evt:this.id,when:"start"},obj)
	}

    },
    attack: {
	label:"Attack",
	id:"attack",
	set(gs) {
	    return gs.updateIn(['phase'],_ => this.id)
	},
	start(obj) {
	    return Object.assign({},{evt:this.id,when:"start"},obj)
	}

    },
    end: {
	label:"End Game",
	id:"end",
	set(gs) {
	    return gs.updateIn(['phase'],_ => this.id)
	},
	start(obj) {
	    return Object.assign({},{evt:this.id,when:"start"},obj)
	}

    }
    
}
