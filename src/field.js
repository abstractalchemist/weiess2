import React from 'react'
import { inactiveplayer, currentplayer } from './utils'


function text({active,info}) {
    	return `Level ${active.lvl || info.lvl}, Power ${active.power || info.power}`
}

function Card({obs,card}) {
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
					action.exec().subscribe(
					    gs => {
						obs.next(gs)
						obs.complete()
					    })
				    }
				}>{action.desc}</button>)
			    
		    })
		}
	    })()
	    }
	    </div>
	    </div>)
    
    
}

function StageCard({controller,obs,gs,cards}) {
    cards = cards || [];
    let card = cards[0] || {active:{},info:{}};
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title">
	    </div>
	    <div className="mdl-card__supporting-text">
	    {text(card)}
	    </div>
	    <div className="mdl-card__actions">
	    {( _ => {
		if(card.cardactions && card.cardactions.length) {
		    return card.cardactions.map(({exec, desc, shortdesc}) => {
			return (<button className="mdl-button mdl-js-button"
				onClick={
				    evt => {
					exec().subscribe(
					    ({game_state:gs, evt}) => {
						controller.updateUI(evt)(gs).subscribe(
						    gs => {
							obs.next(gs)
							obs.complete()
						    })
					    })
				    }
				}>
				{shortdesc}
				</button>)
		    })
		}
	    })()
	    }
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

function fieldReverse({game_state,obs, controller}) {
    
    let gs = game_state.getIn([inactiveplayer(game_state)]).toJS();
//    console.log(gs)
    let center= [ <SpacerSlot key='spacer-1' id='spacer-1' width={2} />,  // spacer
		  
		  <CardSlot id='left-center-player2' key='left-center-player2'>
		  <StageCard controller={controller} obs={obs} cards={gs.stage.center[0]}/>
		  </CardSlot>,  // left center
		  
		  <CardSlot id='middle-center-player2' key='middle-center-player2' >
		  <StageCard controller={controller} obs={obs} cards={gs.stage.center[1]}/>
		  </CardSlot>,  // middle center
		  
		  <CardSlot id='right-center-player2' key='right-center-player2' >
		  <StageCard controller={controller} obs={obs} cards={gs.stage.center[2]}/>
		  </CardSlot>,  // right center
		  
		  <SpacerSlot key='spacer-2' id='spacer-2' width={2} />,  // spacer
		  
		  <CardSlot id='memory-player2' key='memory-player2'>
		  <MemoryCard />
		  </CardSlot>]  // memory
	
    let back = [ <CardSlot id='climax-player2' key='climax-player2' >
		 <Card />
		 </CardSlot>, // climax
		 
		 <SpacerSlot key='spacer-3' id='spacer-3' width={1} />, //spacer
		 
		 <CardSlot id='back-left-player2' key='back-left-player2' >
		 <StageCard controller={controller} obs={obs} cards={gs.stage.back[0]}/>
		 </CardSlot>, // back left
		 
		 <CardSlot id='back-right-player2' key='back-right-player2' >
		 <StageCard controller={controller} obs={obs} cards={gs.stage.back[1]}/>
		 </CardSlot>, // back right
		 
		 <SpacerSlot key='spacer-4' id='spacer-4' width={3} />,  // spacer
		 
		 <CardSlot id='deck-player2' key='deck-player2' >
		 <DeckCard {...gs}/>
		 </CardSlot>] // deck
	
    let behind = [ <CardSlot id='stock-player2' key='stock-player2' >
		   <StockCard {...gs}/>
		   </CardSlot>,
		   
		   <SpacerSlot key='spacer-5' id='spacer-5' width={1} />,
		   
		   <CardSlot id='clock-player2' key='clock-player2' >
		   <ClockCard />
		   </CardSlot>,
		   
		   <CardSlot id='level-player2' key='level-player2' >
		   <LevelCard />
		   </CardSlot>,
		   
		   <SpacerSlot key='spacker-12' id='spacer-12' width={3} />,
		   
		   <CardSlot id='waiting-player2' key='waiting-player2' >
		   <WaitingCard cards={gs.waiting_room}/>
		   </CardSlot>]
    
    return [].concat(behind.reverse(),back.reverse(),center.reverse())
    
}

function field({game_state,obs,controller}) {
    let gs = game_state.getIn([currentplayer(game_state)]).toJS();
//    console.log(gs.waiting_room)
    let center= [ <SpacerSlot key='spacer-6' id='spacer-6' width={2} />,  // spacer
		  <CardSlot id='left-center-player1' key='left-center-player1' >
		  <StageCard controller={controller} obs={obs} cards={gs.stage.center[0]}/>
		  </CardSlot>,  // left center
		  
		  <CardSlot id='middle-center-player1' key='middle-center-player1' >
		  <StageCard controller={controller} obs={obs} cards={gs.stage.center[1]}/>
		  </CardSlot>,  // middle center
		  
		  <CardSlot id='right-center-player1' key='right-center-player1' >
		  <StageCard controller={controller} obs={obs} cards={gs.stage.center[2]}/>
		  </CardSlot>,  // right center
		  
		  <SpacerSlot key='spacer-12' id='spacer-7' width={2} />,  // spacer
		  
		  <CardSlot id='memory-player1' key='memory-player1' >
		  <MemoryCard />
		  </CardSlot>]  // memory
	
    let back = [ <CardSlot id='climax-player1' key='climax-player1' >
		 <Card />
		 </CardSlot>, // climax
		 
		 <SpacerSlot key='spacer-8' id='spacer-8' width={1} />, //spacer
		 
		 <CardSlot id='back-left-player1' key='back-left-player1' >
		 <StageCard controller={controller} obs={obs} cards={gs.stage.back[0]}/>
		 </CardSlot>, // back left
		 
		 <CardSlot id='back-right-player1' key='back-right-player1' >
		 <StageCard controller={controller} obs={obs} cards={gs.stage.back[1]}/>
		 </CardSlot>, // back right
		 
		 <SpacerSlot key='spacer-9' id='spacer-9' width={3} />,  // spacer
		 
		 <CardSlot id='deck-player1' key='deck-player1' >
		 <DeckCard {...gs}/>
		 </CardSlot>] // deck
	
    let behind = [ <CardSlot  id='stock-player1' key='stock-player1' >
		   <StockCard {...gs}/>
		   </CardSlot>,
		   
		   <SpacerSlot key='spacer-10' id='spacer-10'  width={1} />,
		   
		   <CardSlot id='clock-player1' key='clock-player1' >
		   <ClockCard />
		   </CardSlot>,
		   
		   <CardSlot id='level-player1' key='level-player1' >
		   <LevelCard />
		   </CardSlot>,
		   
		   <SpacerSlot key='spacer-11' id='spacer-11' width={3} />,
		   
		   <CardSlot id='waiting-player1' key='waiting-player1' >
		   <WaitingCard cards={gs.waiting_room}/>
		   </CardSlot>]
    return [].concat(center,back,behind)
}

function hand({game_state,player,obs}) {
    player = player || currentplayer(game_state)
    let hand = game_state.getIn([player,'hand'])
    return hand.toJS().map((v,i) => {
	return (<CardSlot id={'h' + i} key={'h' + i}>
		<Card card={v} obs={obs}/>
		</CardSlot>)
    });

}

export { field, fieldReverse, hand }
