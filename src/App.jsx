import { useEffect, useState, useRef } from "react";
const SCENES = {
  INTRO: "intro",
  GAMEPLAY: "gameplay",
  ENDING: "ending",
};


// Settings for our simulation
const PEOPLE_COUNT = 35;
const FREEZE_DURATION = 3000;
const PERSON_SIZE = 50;
const FRAME_SIZE = 120;

const trendImages = {
  baseball: "/happy_cap.png",
  cape: "/happy_cape.png",
  crown: "/happy_crown.png",
  handbag: "/happy_handbag.png",
  mohawk: "/happy_mohawk.png",
  mustache: "/happy_mustache.png",
  ponytail: "/happy_ponytail.png",
  scarf: "/happy_scarf.png",
  sunglasses: "/happy_glasses.png",
  tophat: "/happy_tophat.png",
  none: "/shocked.png"
};

// Spread a trend to other people (or reject it)
function spreadTrend(people, targetTrend, viral) {
 let newPeople = [];


 for (let i = 0; i < people.length; i++) {
   let person = people[i];


   if (viral) {
     // Popular trend: grey people copy it
     if (person.trend === "#777") {
       person = { ...person, trend: targetTrend };
     }
   } else {
     // Flopped trend: people abandon it
     if (person.trend === targetTrend) {
       person = { ...person, trend: "#777" };
     }
   }


   newPeople.push(person);
 }


 return newPeople;
}


// Count how many grey people
function countGrey(people) {
 let count = 0;
 for (let i = 0; i < people.length; i++) {
   if (people[i].trend === "#777") {
     count++;
   }
 }
 return count;
}


// Pick a random color
function randomTrend() {
  const trends = [
    "baseball", "cape", "crown", "handbag", 
    "mohawk", "mustache", "ponytail", "scarf", 
    "sunglasses", "tophat"
  ];

  const randomIndex = Math.floor(Math.random() * trends.length);
  return trends[randomIndex];
}


function createPerson(id) {
  return {
    id: id,
    x: Math.random() * 85,
    y: Math.random() * 85,
    trend: randomTrend(),
    trendiness: Math.random(),
  };
}


function Person({ person, conformity, frozen, focused, onCapture }) {
  let trendToShow = person.trend;

  // If society is very conformist, make it grey / none
  if (conformity > 0.7) {
    trendToShow = "none";
  }

  const imgSrc = trendImages[trendToShow] || trendImages["none"];

  return (
    <div
      onClick={(e) => {
        if (trendToShow !== "none") {
          onCapture(person, e);
        }
      }}
      style={{
        position: "absolute",
        left: person.x + "%",
        top: person.y + "%",
        width: 40,
        height: 40,
        cursor: trendToShow !== "none" ? "crosshair" : "default",
        transform: "scale(1)",
        outline: focused ? "3px solid red" : "none",
        outlineOffset: "4px",
        transition: frozen
          ? "transform 0.15s ease, outline 0.15s ease"
          : "all 0.5s ease",
        zIndex: focused ? 10 : 1,
      }}
    >
      <img 
        src={imgSrc} 
        alt={trendToShow} 
        style={{ width: "100%", height: "100%" }} 
      />
    </div>
  );
}


// Function to get the dominant trend and its percentage
function getTrendAndPercentage(people) {
 let trendCounts = {};
 for (let i = 0; i < people.length; i++) {
   let trend = people[i].trend;
   if (trend === "#777") continue; // skip grey
   if (!trendCounts[trend]) {
     trendCounts[trend] = 1;
   } else {
     trendCounts[trend]++;
   }
 }


 let dominantTrend = "None";
 let maxCount = 0;


 for (let color in trendCounts) {
   if (trendCounts[color] > maxCount) {
     maxCount = trendCounts[color];
     dominantTrend = color;
   }
 }


 let percentage = 0;
 if (dominantTrend !== "None") {
   percentage = Math.round((maxCount / people.length) * 100);
 }


 return { trend: dominantTrend, percentage: percentage };
}


function StartScene({onBegin}) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000", // temporary
      }}
    >
      <ImageButton
        normal="/start-unpush.png"
        pushed="/start-push.png"
        onClick={onBegin}
        width={220}
      />
    </div>
  );
}

function EndScene({onPlayAgain, onExit }) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>END (TEMP)</h1>
      <button onClick={onPlayAgain}>Play Again</button>
      <br /><br />
      <button onClick={onExit}>Exit to Intro</button>
    </div>
  );
}
// Main app
export default function App() {
 const [people, setPeople] = useState([]);
 const [society, setSociety] = useState({ conformity: 0 });
 const [frozen, setFrozen] = useState(false);
 const [focusedId, setFocusedId] = useState(null);
 const [narration, setNarration] = useState("Click someone to take a picture.");
 const [captureUI, setCaptureUI] = useState(null);
 const worldRef = useRef(null);
 const [scene, setScene] = useState(SCENES.INTRO);


 // Initialize people
 useEffect(() => {
   let initialPeople = [];
   for (let i = 0; i < PEOPLE_COUNT; i++) {
     initialPeople.push(createPerson(i));
   }
   setPeople(initialPeople);
 }, []);


 // Random movement
 useEffect(() => {
   if (frozen) return;


   const interval = setInterval(() => {
     let newPeople = [];
     for (let i = 0; i < people.length; i++) {
       let person = people[i];
       let newX = person.x + (Math.random() - 0.5) * 6;
       let newY = person.y + (Math.random() - 0.5) * 6;


       if (newX < 0) newX = 0;
       if (newX > 90) newX = 90;
       if (newY < 0) newY = 0;
       if (newY > 90) newY = 90;


       newPeople.push({ ...person, x: newX, y: newY });
     }
     setPeople(newPeople);
   }, 900);


   return () => clearInterval(interval);
 }, [frozen, people]);


 // Handle click
 function capture(person, e) {
   if (frozen) return;


   setFrozen(true);
   setFocusedId(person.id);


   // Determine if viral
   let viral;
   if (countGrey(people) === 0) {
     viral = false;
   } else {
     let appeal = person.trendiness * (1 - society.conformity);
     viral = Math.random() < appeal;
   }


   setNarration(viral ? "They love this trend." : "They reject this trend.");


    // const newPeople = spreadTrend(people, person.trend, viral);
    // setPeople(newPeople);

    // // Update conformity
    // const trendInfo = getTrendAndPercentage(newPeople);
    // setSociety({ conformity: trendInfo.percentage / 100 });

   // Instagram overlay position
   const world = worldRef.current.getBoundingClientRect();
   const centerX = (person.x / 100) * world.width + PERSON_SIZE / 2;
   const centerY = (person.y / 100) * world.height + PERSON_SIZE / 2;


    // Fake engagement
    let likes;
    let comments;
    if (viral) {
      likes = (Math.floor(Math.random() * (PEOPLE_COUNT - 20 + 1)) + 20) * 1000;
      comments = ["I LOVE THIS TREND", "Obsessed", "stealing this"];
    } else {
      likes = Math.floor(Math.random() * 20 + 1);
      comments = ["ew", "absolutely not", "this is sad"];
    }

   setCaptureUI({
     x: centerX,
     y: centerY,
     likes: likes,
     comments: comments,
     viral: viral,
   });


    setTimeout(() => {
      const updatedPeople = spreadTrend(people, person.trend, viral);
      setPeople(updatedPeople);

      const trendInfo = getTrendAndPercentage(updatedPeople);
      setSociety({ conformity: trendInfo.percentage / 100 });

      setFrozen(false);
      setFocusedId(null);
      setNarration("Click someone to take a picture.");
      setCaptureUI(null);
    }, FREEZE_DURATION);
  }

  function beginGame() {
  resetGame();
  setScene(SCENES.GAMEPLAY);
}

function exitGame() {
  setScene(SCENES.ENDING);
}

function playAgain() {
  resetGame();
  setScene(SCENES.GAMEPLAY);
}

function resetGame() {
  const resetPeople = [];
  for (let i = 0; i < PEOPLE_COUNT; i++) {
    resetPeople.push(createPerson(i));
  }
  setPeople(resetPeople);
  setSociety({conformity:0});
  setFrozen(false);
  setFocusedId(null);
  setNarration("Click someone to take a picture.");
  setCaptureUI(null);
}

function ImageButton({ normal, pushed, onClick, width = 200 }) {
  const [isPushed, setIsPushed] = useState(false);

  return (
    <img
      src={isPushed ? pushed : normal}
      alt="button"
      style={{
        width,
        cursor: "pointer",
        userSelect: "none",
      }}
      onMouseDown={() => setIsPushed(true)}
      onMouseUp={() => setIsPushed(false)}
      onMouseLeave={() => setIsPushed(false)}
      onClick={onClick}
      draggable={false}
    />
  );
}

 // Calculate current trend info
 const trendInfo = getTrendAndPercentage(people);
 const dominantTrend = trendInfo.trend;
 const trendPercentage = trendInfo.percentage;


 return (
   <div className="container">
    {scene === SCENES.INTRO &&  (
      <StartScene onBegin={beginGame}/>
    )}

    {scene === SCENES.GAMEPLAY && (
      <button
    style={{ position: "absolute", top: 10, right: 10, zIndex: 100 }}
    onClick={exitGame}
      >
        Exit
      </button>
    )}

    {scene === SCENES.ENDING && (
      <EndScene onPlayAgain={playAgain} onExit={() => setScene(SCENES.INTRO)}/>
    )}
     <p className="status">{narration}</p>


     <div
       ref={worldRef}
       className="world"
       style={{
         transform: frozen ? "scale(1.15)" : "scale(1)",
         transition: "transform 0.3s ease",
         position: "relative",
       }}
     >
       {people.map((p) => (
         <Person
           key={p.id}
           person={p}
           conformity={society.conformity}
           frozen={frozen}
           focused={p.id === focusedId}
           onCapture={capture}
         />
       ))}


       {captureUI && (
         <div
           style={{
             position: "absolute",
             left: captureUI.x,
             top: captureUI.y + 25,
             transform: "translate(-50%, -50%)",
             pointerEvents: "none",
             zIndex: 20,
             animation: "pop 0.25s ease-out",
           }}
         >
           <img
             src="/instagram-frame.png"
             alt="capture frame"
             style={{ width: FRAME_SIZE, height: FRAME_SIZE, display: "block" }}
           />


           <div style={{ textAlign: "left", marginTop: 6 }}>
             <div
               style={{
                 color: "black",
                 fontSize: 14,
                 display: "flex",
                 alignItems: "left",
                 justifyContent: "center",
                 gap: 4,
               }}
             >
               <img
                 src={captureUI.viral ? "/instagram-like.png" : "/instagram-dislike.png"}
                 alt={captureUI.viral ? "like" : "dislike"}
                 style={{ width: 16, height: 16 }}
               />
               {captureUI.likes.toLocaleString()}
             </div>


             <div style={{ fontSize: 12, opacity: 0.9, color: "black" }}>
               {captureUI.comments.slice(0, 2).map((c, i) => (
                 <div
                   key={i}
                   style={{
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     gap: 4,
                     marginTop: 2,
                   }}
                 >
                   <img
                     src="/instagram-comment.png"
                     alt="comment"
                     style={{ width: 14, height: 14 }}
                   />
                   {c}
                 </div>
               ))}
             </div>
           </div>
         </div>
       )}
     </div>


     <p className="status">
       Current Trend:{" "}
       <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
         <span
           style={{
             display: "inline-block",
             width: 16,
             height: 16,
             backgroundColor: dominantTrend,
             border: "1px solid white",
           }}
         />
         {dominantTrend} ({trendPercentage}%)
       </span>
     </p>
   </div>
 );
}
