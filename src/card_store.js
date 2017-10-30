import Http from 'utils';
import { Observable } from 'rxjs'

export default (function() {

    const internalmapper = card => {
	return {
	    info:Object.assign({},card,{ title:card.name }),
	    active:{
		power:0,
		level:card.level
	    }
	}
    }

    
    const mapper = card_id => {
	return Observable.fromPromise(Http({method:"GET",url:"/api/cardmapping/mapping"}))
	    .map(JSON.parse)
	    .map(({mapping}) => {
		//		    let db = mapping.find(({prefix}) => card_id.startsWith(prefix));
		let matching_dbs = mapping.filter( ({ prefix }) => card_id.startsWith(prefix));
		let max = -1
		let max_index = -1;
		
		matching_dbs.forEach(({prefix},j) => {
		    if(prefix.length > max) {
			max = prefix.length;
			max_index = j;
		    }
		})
		return matching_dbs[max_index];
	    })

    }
    
    const cardmapper = card_id => {
	return mapper(card_id)
	    .mergeMap(db => Observable
		      .fromPromise(Http({method:"GET",url:"/api/" + db.db + "/" + card_id}))
		      .map(JSON.parse)
		      .map(obj => Object.assign({},obj, {id:obj._id}))
		      .map(internalmapper));
	
    }

    
    return {
	internalmapper:internalmapper,

	// get a card based on id
	getcard(card_id) {
	    return cardmapper(card_id);
	},

	// get all cards from a card set id
	getcardsfromset(id) {
	    //	    if(id === 'VS') {
	    //		return Rx.Observable.from(testing);
	    //	    }
	    //	    selecteddb = id;
	    return Observable.fromPromise(Http({method:"GET",url:"/api/" + id + "/_design/view/_list/all/all"}))
		.map(JSON.parse)
		.mergeMap(data => {
		    return Observable.from(data)
		})
		.map(obj => Object.assign({},obj,{id:obj._id}));
	},

	// get all known card sets
	getcardsets() {
	    //	    return Rx.Observable.from([{id:"VS",label:"Vivid Strke"}]).toArray();
	    return Observable.fromPromise(Http({method:"GET",url:"/api/cardsets/sets"})).map(JSON.parse).pluck('sets');
	}
    };
})()
