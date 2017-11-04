import { Observable } from 'rxjs';
import Http from 'utils';

const { from } = Observable

export default (function() {
    let selecteddeck, selectedrev;
    return {

	getdecks() {
	    return from(Http({method:"GET",url:"/api/decks/_design/view/_list/all/all"}))
		.map(JSON.parse)
		.mergeMap(from)
		.map(obj => Object.assign({},obj,{ id: obj._id }))
		.toArray();
	},
	getdeck(id) {
	    selecteddeck = id;
	    return from(Http({method:"GET",url:"/api/decks/" + id}))
		.map(JSON.parse)
		.map(obj => Object.assign({},obj,{id:obj._id}))
	}
	
    };
})()
