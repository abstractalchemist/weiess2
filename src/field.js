import React from 'react'
import { inactiveplayer, currentplayer } from './utils'

const master = {height:"290px",background:"url(http://www.lilakihabara.com/wp-content/uploads/2016/06/ws_cardback_600px.png)", backgroundSize:"100%"};

function text({active,info}) {
    let level = active.level || info.level;
    let lvl = level
    if(typeof level === 'function') {
	lvl = level()
    }
    let clock = active.power || info.power;
    let cl = clock;
    if(typeof clock === 'function')
	cl = clock();
    return `Level ${lvl}, Power ${cl}`
}

function Card({ui,gs,obs,card}) {
    card = card || { active: {}, info: {} }
    let style = Object.assign({}, master);
    if(card.info.image) {
	style['background'] = "url(" + card.info.image + ")"
    }
    return (<div className="mdl-card game-card" > 
	    <div className="mdl-card__title" style={style}>
	    {card.info.title}
	    </div>
	    <div className="mdl-card__supporting-text">
	    Level {card.active.level || card.info.level}
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
	    })()}
	    {(_ => {
		if(card.cardactions) {
		    return card.cardactions.map(action => {
			return (<button className="mdl-button mdl-js-button"
				onClick={
				    evt => {
					action.exec(gs,ui).subscribe(
					    gs => {
						obs.next(gs)
						obs.complete()
 					    })
				    }
				}>
				
				{action.shortDesc}
				</button>)
		    })
		}
	    })()
	    }
	    </div>
	    </div>)
    
    
}

function StageCard({ui,obs,gs,cards}) {
    cards = cards || [];
    let card = cards[0] || {active:{},info:{}};
    let style = Object.assign({}, master)
    if(card.info.image) {
	style['background'] = "url(" + card.info.image + ")"
    }
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title" style={style}>
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
					exec(gs, ui).subscribe(
					    gs => {
						obs.next(gs)
						obs.complete()
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

function MemoryCard({cards}) {
    let style = master

    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title" style={style}>
	    </div>
	    <div className="mdl-card__supporting-text">
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function DeckCard({deck}) {
    let style = master

    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title" style={style}>
	    </div>
	    <div className="mdl-card__supporting-text">
	    Deck currently has {deck.length} cards
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function StockCard({stock}) {
    let style = master
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title" style={style}>
	    </div>
	    <div className="mdl-card__supporting-text">
	    Stock currently has {stock.length} cards
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function LevelCard({level}) {
    let card;
    
    let style = Object.assign({},master)
    if(level && level.length > 0) {
	card = level[0]
	if(card.info.image) {
	    style['background'] = "url(" + card.info.image + ")";
	}
    }
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title" style={style}> 
	    </div>
	    <div className="mdl-card__supporting-text">
	    Current Level {( _ => level ? level.length : 0)()}
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
}

function WaitingCard({cards}) {
    let style = master
    return (<div className="mdl-card game-card">
	    <div className="mdl-card__title" style={style}>
	    </div>
	    <div className="mdl-card__supporting-text">
	    Waiting room contains {cards.length}
	    </div>
	    <div className="mdl-card__actions">
	    </div>
	    </div>)
    
}

function ClockCard({}) {
    let style = master
    return (<div className="mdl-card game-card" style={style}>
	    <div className="mdl-card__title" style={style}>
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

function fieldReverse({game_state,obs}, controller) {
    
    let gs = game_state.getIn([inactiveplayer(game_state)]).toJS();
//    console.log(gs)
    let center= [ <SpacerSlot key='spacer-1' id='spacer-1' width={2} />,  // spacer
		  <SpacerSlot key='spacer-2' id='spacer-2' width={2} />,  // spacer		  
		  <CardSlot id='left-center-player2' key='left-center-player2'>
		  <StageCard ui={controller} obs={obs} cards={gs.stage.center.left}/>
		  </CardSlot>,  // left center
		  
		  <CardSlot id='middle-center-player2' key='middle-center-player2' >
		  <StageCard ui={controller} obs={obs} cards={gs.stage.center.middle}/>
		  </CardSlot>,  // middle center
		  
		  <CardSlot id='right-center-player2' key='right-center-player2' >
		  <StageCard ui={controller} obs={obs} cards={gs.stage.center.right}/>
		  </CardSlot>,  // right center
		  

		  <CardSlot id='memory-player2' key='memory-player2'>
		  <MemoryCard />
		  </CardSlot>]  // memory
	
    let back = [ <CardSlot id='climax-player2' key='climax-player2' >
		 <Card />
		 </CardSlot>, // climax
		 
		 <SpacerSlot key='spacer-3' id='spacer-3' width={3} />, //spacer
		 
		 <CardSlot id='back-left-player2' key='back-left-player2' >
		 <StageCard ui={controller} obs={obs} cards={gs.stage.back.left}/>
		 </CardSlot>, // back left
		 
		 <CardSlot id='back-right-player2' key='back-right-player2' >
		 <StageCard ui={controller} obs={obs} cards={gs.stage.back.right}/>
		 </CardSlot>, // back right
		 
		 <SpacerSlot key='spacer-4' id='spacer-4' width={1} />,  // spacer
		 
		 <CardSlot id='deck-player2' key='deck-player2' >
		 <DeckCard {...gs}/>
		 </CardSlot>] // deck
	
    let behind = [ <CardSlot id='stock-player2' key='stock-player2' >
		   <StockCard {...gs}/>
		   </CardSlot>,
		   
		   <SpacerSlot key='spacer-5' id='spacer-5' width={1} />,
		   
		   
		   <CardSlot id='level-player2' key='level-player2' >
		   <LevelCard {...gs}/>
		   </CardSlot>,

		   <CardSlot id='clock-player2' key='clock-player2' >
		   <ClockCard />
		   </CardSlot>,

		   
		   <SpacerSlot key='spacker-12' id='spacer-12' width={3} />,
		   
		   <CardSlot id='waiting-player2' key='waiting-player2' >
		   <WaitingCard cards={gs.waiting_room}/>
		   </CardSlot>]
    
    return [].concat(behind.reverse(),back.reverse(),center.reverse())
    
}

function field({game_state,obs}, controller) {
    let gs = game_state.getIn([currentplayer(game_state)]).toJS();
//    console.log(gs.waiting_room)
    let center= [ <SpacerSlot key='spacer-6' id='spacer-6' width={2} />,  // spacer
		  <CardSlot id='left-center-player1' key='left-center-player1' >
		  <StageCard ui={controller} obs={obs} cards={gs.stage.center.left}/>
		  </CardSlot>,  // left center
		  
		  <CardSlot id='middle-center-player1' key='middle-center-player1' >
		  <StageCard ui={controller} obs={obs} cards={gs.stage.center.middle}/>
		  </CardSlot>,  // middle center
		  
		  <CardSlot id='right-center-player1' key='right-center-player1' >
		  <StageCard ui={controller} obs={obs} cards={gs.stage.center.right}/>
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
		 <StageCard ui={controller} obs={obs} cards={gs.stage.back.left}/>
		 </CardSlot>, // back left
		 
		 <CardSlot id='back-right-player1' key='back-right-player1' >
		 <StageCard ui={controller} obs={obs} cards={gs.stage.back.right}/>
		 </CardSlot>, // back right
		 
		 <SpacerSlot key='spacer-9' id='spacer-9' width={3} />,  // spacer
		 
		 <CardSlot id='deck-player1' key='deck-player1' >
		 <DeckCard {...gs}/>
		 </CardSlot>] // deck
	
    let behind = [ <CardSlot  id='stock-player1' key='stock-player1' >
		   <StockCard {...gs}/>
		   </CardSlot>,
		   
		   <SpacerSlot key='spacer-10' id='spacer-10'  width={1} />,
		   
		   
		   <CardSlot id='level-player1' key='level-player1' >
		   <LevelCard {...gs}/>
		   </CardSlot>,

		   <CardSlot id='clock-player1' key='clock-player1' >
		   <ClockCard />
		   </CardSlot>,

		   <SpacerSlot key='spacer-11' id='spacer-11' width={3} />,
		   
		   <CardSlot id='waiting-player1' key='waiting-player1' >
		   <WaitingCard cards={gs.waiting_room}/>
		   </CardSlot>]
    return [].concat(center,back,behind)
}

function hand({game_state,player,obs}, ui) {
    player = player || currentplayer(game_state)
    let hand = game_state.getIn([player,'hand'])
    return hand.toJS().map((v,i) => {
	return (<CardSlot id={'h' + i} key={'h' + i}>
		<Card ui={ui} gs={game_state} card={v} obs={obs}/>
		</CardSlot>)
    });

}

export { field, fieldReverse, hand }
