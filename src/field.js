import React from 'react'
import { inactiveplayer, currentplayer } from './utils'

/*
cards are expected to have the following format
{  
   availableactions: function(gs) {
   },
   actions: {
   },
   active: {
      lvl: <active lvl>,
      power: <active power>,
      soul: <active soul>
   },
   info: {
      lvl: <base lvl>,
      power: <base power>,
      soul: <base soul>,
      cost: <cost to play the card>,
      color: <color of the card>,
      triggerAction: <trigger action>,
      triggerIcon: <the trigger icon of this card>
   }    
}

actions are arbitary action that any component of the game can map to the card.
This field should be cleared at the end of each phase and/or at the end of the action, depending on the type of action

avaiableactions is a function which returns a list
[
   { 
     action: < a function which takes two arguments, the card and gamestate, and returns a function which is called when the action is activated
     title: < name of the action to display >
   },
]

available actions should be mapped to activated abilities

all actions in the list are actions that are currently takenable based on the current game state
the list has the form 
[
   {
      exec:< action to execute, must call Dispatcher.updateGS, takes the card as an argument >,
      desc: < A human readable description >
   }
]
*/

// returns all available actions
function displayactiveactions(card) {
    if(card.availableactions) {
	return card.availableactions(gs).map( ({ title, action }) => {
	    return (<button className="mdl-button mdl-js-button" onClick={action(card, gs)}>
		    {title}
		    </button>)
	})
    }

}

function text({active,info}) {
    	return `Level ${active.lvl || info.lvl}, Power ${active.power || info.power}`
}

function Card({card}) {
    card = card || { active: {}, info: {} }
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    {card.info.title}
	    </div>
	    <div className="mdl-card__supporting-text">
	    Level {card.active.lvl || card.info.lvl}
	    </div>
	    <div className="mdl-card__actions">
	    {( _ => {
		if(card.actions) {
		    return card.actions.map(action => {
			return (<button className="mdl-button mdl-js-button"
				onClick={
				    _ => {
					action.exec(card)
				    }
				}>{action.desc}</button>)
			    
		    })
		}
	    })()
	    }
	    </div>
	    </div>)
    
    
}

function StageCard({gs,cards}) {
    cards = cards || [];
    let card = cards[0] || {active:{},info:{}};
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    </div>
	    <div className="mdl-card__supporting-text">
	    {text(card)}
	    </div>
	    <div className="mdl-card__actions">
	    {displayactiveactions(card)}
	    </div>
	    </div>)
}

function MemoryCard({}) {
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    </div>
	    <div className="mdl-card__supporting-text">
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function DeckCard({deck}) {
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    </div>
	    <div className="mdl-card__supporting-text">
	    Deck currently has {deck.length} cards
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function StockCard({stock}) {
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    </div>
	    <div className="mdl-card__supporting-text">
	    Stock currently has {stock.length} cards
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function LevelCard({}) {
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    </div>
	    <div className="mdl-card__supporting-text">
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function WaitingCard({cards}) {
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    </div>
	    <div className="mdl-card__supporting-text">
	    Waiting room contains {cards.length}
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
    
}

function ClockCard({}) {
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    </div>
	    <div className="mdl-card__supporting-text">
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function SpacerSlot({id, width}) {
    return (<div id={id}  className={"mdl-cell mdl-cell--" + width + "-col spacer"} />) 
}

function CardSlot({id, children}) {
    return (<div id={id} className="mdl-cell mdl-cell--2-col card" >
	    {children}
	    </div>)
}

function fieldReverse({game_state}) {
    
    let gs = game_state.getIn([inactiveplayer(game_state)]).toJS();
//    console.log(gs)
    let center= [ <SpacerSlot key='spacer-1' id='spacer-1' width={2} />,  // spacer
		  
		  <CardSlot id='left-center-player2'>
		  <StageCard cards={gs.stage.center[0]}/>
		  </CardSlot>,  // left center
		  
		  <CardSlot id='middle-center-player2' >
		  <StageCard cards={gs.stage.center[1]}/>
		  </CardSlot>,  // middle center
		  
		  <CardSlot id='right-center-player2' >
		  <StageCard cards={gs.stage.center[2]}/>
		  </CardSlot>,  // right center
		  
		  <SpacerSlot key='spacer-2' id='spacer-2' width={2} />,  // spacer
		  
		  <CardSlot id='memory-player2'>
		  <MemoryCard />
		  </CardSlot>]  // memory
	
    let back = [ <CardSlot id='climax-player2' >
		 <Card />
		 </CardSlot>, // climax
		 
		 <SpacerSlot key='spacer-3' id='spacer-3' width={1} />, //spacer
		 
		 <CardSlot id='back-left-player2' >
		 <StageCard cards={gs.stage.back[0]}/>
		 </CardSlot>, // back left
		 
		 <CardSlot id='back-right-player2' >
		 <StageCard cards={gs.stage.back[1]}/>
		 </CardSlot>, // back right
		 
		 <SpacerSlot key='spacer-4' id='spacer-4' width={3} />,  // spacer
		 
		 <CardSlot id='deck-player2' >
		 <DeckCard {...gs}/>
		 </CardSlot>] // deck
	
    let behind = [ <CardSlot id='stock-player2' >
		   <StockCard {...gs}/>
		   </CardSlot>,
		   
		   <SpacerSlot key='spacer-5' id='spacer-5' width={1} />,
		   
		   <CardSlot id='clock-player2' >
		   <ClockCard />
		   </CardSlot>,
		   
		   <CardSlot id='level-player2' >
		   <LevelCard />
		   </CardSlot>,
		   
		   <SpacerSlot key='spacker-12' id='spacer-12' width={3} />,
		   
		   <CardSlot id='waiting-player2' >
		   <WaitingCard cards={gs.waiting_room}/>
		   </CardSlot>]
    
    return [].concat(behind.reverse(),back.reverse(),center.reverse())
    
}

function field({game_state}) {
    let gs = game_state.getIn([currentplayer(game_state)]).toJS();
    console.log(gs.waiting_room)
    let center= [ <SpacerSlot key='spacer-6' id='spacer-6' width={2} />,  // spacer
		  <CardSlot id='left-center-player1' >
		  <StageCard cards={gs.stage.center[0]}/>
		  </CardSlot>,  // left center
		  
		  <CardSlot id='middle-center-player1' >
		  <StageCard cards={gs.stage.center[1]}/>
		  </CardSlot>,  // middle center
		  
		  <CardSlot id='right-center-player1' >
		  <StageCard cards={gs.stage.center[2]}/>
		  </CardSlot>,  // right center
		  
		  <SpacerSlot key='spacer-12' id='spacer-7' width={2} />,  // spacer
		  
		  <CardSlot id='memory-player1' >
		  <MemoryCard />
		  </CardSlot>]  // memory
	
    let back = [ <CardSlot id='climax-player1' >
		 <Card />
		 </CardSlot>, // climax
		 
		 <SpacerSlot key='spacer-8' id='spacer-8' width={1} />, //spacer
		 
		 <CardSlot id='back-left-player1' >
		 <StageCard cards={gs.stage.back[0]}/>
		 </CardSlot>, // back left
		 
		 <CardSlot id='back-right-player1' >
		 <StageCard cards={gs.stage.back[1]}/>
		 </CardSlot>, // back right
		 
		 <SpacerSlot key='spacer-9' id='spacer-9' width={3} />,  // spacer
		 
		 <CardSlot id='deck-player1' >
		 <DeckCard {...gs}/>
		 </CardSlot>] // deck
	
    let behind = [ <CardSlot id='stock-player1' >
		   <StockCard {...gs}/>
		   </CardSlot>,
		   
		   <SpacerSlot key='spacer-10' id='spacer-10'  width={1} />,
		   
		   <CardSlot id='clock-player1' >
		   <ClockCard />
		   </CardSlot>,
		   
		   <CardSlot id='level-player1' >
		   <LevelCard />
		   </CardSlot>,
		   
		   <SpacerSlot key='spacer-11' id='spacer-11' width={3} />,
		   
		   <CardSlot id='waiting-player1' >
		   <WaitingCard cards={gs.waiting_room}/>
		   </CardSlot>]
    return [].concat(center,back,behind)
}

function hand({game_state,player}) {
    player = player || currentplayer(game_state)
    let hand = game_state.getIn([player,'hand'])
    return hand.toJS().map((v,i) => {
	return (<CardSlot id={'h' + i} key={'h' + i}>
		<Card card={v}/>
		</CardSlot>)
    });

}

export { field, fieldReverse, hand }
