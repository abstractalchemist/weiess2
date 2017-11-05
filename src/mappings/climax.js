const ClimaxEffects = {
    power1000_soul1 : {
	continous: {
	    power(card, gs) {
		return 1000
	    },
	    soul(card, gs) {
		return 1
	    }
 	}

    }
}

export { ClimaxEffects }
