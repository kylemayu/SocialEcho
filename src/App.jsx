import { useEffect, useState, useRef } from "react";

// Settings for our simulation
const PEOPLE_COUNT = 35;
const FREEZE_DURATION = 3000;
const PERSON_SIZE = 85;
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
  none: "/sad.png"
};

const sadTrendImages = {
  baseball: "/sad_cap.png",
  cape: "/sad_cape.png",
  crown: "/sad_crown.png",
  handbag: "/sad_handbag.png",
  mohawk: "/sad_mohawk.png",
  mustache: "/sad_mustache.png",
  ponytail: "/sad_ponytail.png",
  scarf: "/sad_scarf.png",
  sunglasses: "/sad_glasses.png",
  tophat: "/sad_tophat.png",
  none: "/sad.png"
};

const trendNames = {
  baseball: "Baseball Caps",
  cape: "Capes",
  crown: "Crowns",
  handbag: "Handbags",
  mohawk: "Mohawks",
  mustache: "Mustaches",
  ponytail: "Ponytails",
  scarf: "Scarves",
  sunglasses: "Sunglasses",
  tophat: "Top Hats",
  none: "Nothing..."
};

// Spread a trend to other people (or reject it)
function spreadTrend(people, targetTrend, viral) {
  let newPeople = [];

  for (let i = 0; i < people.length; i++) {
    let person = people[i];

    if (viral) {
      // Popular trend: grey people copy it
      if (person.trend === "none") {
        person = { ...person, trend: targetTrend };
      }
    } else {
      // Flopped trend: people abandon it
      if (person.trend === targetTrend) {
        person = { ...person, trend: "none" };
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
    if (people[i].trend === "none") {
      count++;
    }
  }
  return count;
}

// Pick a random trend
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

function Person({ person, conformity, frozen, focused, onCapture, showSad }) {
  // Show the person's actual trend (no conformity override)
  let trendToShow = person.trend;

  // Use sad images if showSad is true, otherwise use happy images
  const imageSet = showSad ? sadTrendImages : trendImages;
  const imgSrc = imageSet[trendToShow] || trendImages["none"];

  // Only allow clicks if the person has a real trend (not "none" which means grey/no trend)
  const clickable = person.trend !== "none";

  return (
    <div
      onClick={(e) => {
        if (clickable) {
          onCapture(person, e);
        }
      }}
      style={{
        position: "absolute",
        left: person.x + "%",
        top: person.y + "%",
        width: PERSON_SIZE,
        height: PERSON_SIZE,
        cursor: clickable ? "crosshair" : "default",
        pointerEvents: clickable ? "auto" : "none",
        transition: frozen
          ? "transform 0.15s ease"
          : "all 0.5s ease",
        zIndex: 1,
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
    // Include all trends in counts
    if (!trendCounts[trend]) {
      trendCounts[trend] = 1;
    } else {
      trendCounts[trend]++;
    }
  }

  let dominantTrend = "none";
  let maxCount = 0;

  for (let color in trendCounts) {
    if (trendCounts[color] > maxCount) {
      maxCount = trendCounts[color];
      dominantTrend = color;
    }
  }

  // Always calculate percentage, even for "none"
  let percentage = Math.round((maxCount / people.length) * 100);

  return { trend: dominantTrend, percentage: percentage };
}

// Main app
export default function App() {
  const [people, setPeople] = useState([]);
  const [society, setSociety] = useState({ conformity: 0 });
  const [frozen, setFrozen] = useState(false);
  const [focusedId, setFocusedId] = useState(null);
  const [narration, setNarration] = useState("Click someone to take a picture.");
  const [captureUI, setCaptureUI] = useState(null);
  const [showSad, setShowSad] = useState(false);
  const worldRef = useRef(null);

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

    const trendKey = person.trend;
    const trendLabel = trendNames[trendKey];
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

    if (viral) {
      setNarration(`Society loves ${trendLabel}.`);
      setShowSad(false); // Happy images
    } else {
      setNarration(`Society rejects ${trendLabel}.`);
      setShowSad(true); // Sad images
    }

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
      setShowSad(false); // Return to happy images
    }, FREEZE_DURATION);
  }

  // Calculate current trend info
  const trendInfo = getTrendAndPercentage(people);
  const dominantTrend = trendInfo.trend;
  const trendPercentage = trendInfo.percentage;

  return (
    <div className="container">
    <p className="status">{narration}</p>

    {/* Wrapper that reserves space so scaling never overlaps text */}
    <div
      style={{
        paddingTop:40,
        paddingBottom: 40,
        display: "flex",
        justifyContent: "center",
      }}
    >
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
            showSad={showSad}
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

            <div style={{ textAlign: "center", marginTop: 6 }}>
              <div
                style={{
                  color: "white",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <img
                  src={
                    captureUI.viral
                      ? "/instagram-like.png"
                      : "/instagram-dislike.png"
                  }
                  alt={captureUI.viral ? "like" : "dislike"}
                  style={{ width: 16, height: 16 }}
                />
                {captureUI.likes.toLocaleString()}
              </div>

                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.9,
                    color: "#ff69b4"
                  }}
                >
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
    </div>

    <p className="status">
      Current Trend:{" "}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {trendNames[dominantTrend] || "None"} ({trendPercentage}%)
      </span>
    </p>
    </div>
  );
}