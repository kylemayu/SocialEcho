import { useEffect, useState } from "react";

const PEOPLE_COUNT = 50;
const FREEZE_DURATION = 3000;

function spreadColor(people, targetColor, viral) {
  return people.map((p) => {
    // If viral (they love it): grey people adopt this color
    if (viral) {
      if (p.color === "#777") {
        return { ...p, color: targetColor };
      }
    } else {
      if (p.color === targetColor) {
        return { ...p, color: "#777" };
      }
    }

    return p;
  });
}

function getCurrentTrend(people) {
  const counts = {};
  people.forEach((p) => {
    if (p.color === "#777") return; // ignore greys
    counts[p.color] = (counts[p.color] || 0) + 1;
  });

  let maxCount = 0;
  let dominant = null;
  for (const color in counts) {
    if (counts[color] > maxCount) {
      maxCount = counts[color];
      dominant = color;
    }
  }

  return dominant || "None";
}

function randomColor() {
  const colors = [
    "#ff4d4d", // red
    "#4d79ff", // blue
    "#4dff88", // green
    "#c44dff", // purple
    "#ffd24d", // yellow
    "#4dd2ff", // cyan
    "#ff4da6", // pink
    "#4dffb3", // mint
    "#ff944d", // orange
    "#4d66ff", // indigo
    "#b34dff", // violet
    "#ffb34d", // amber
    "#4dffa6", // light green
    "#ff4db8", // fuchsia
    "#4dffff"  // aqua
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createPerson(id) {
  return {
    id,
    x: Math.random() * 85,
    y: Math.random() * 85,
    color: randomColor(),
    trendiness: Math.random(),
  };
}

// --- Person sprite ---
function Person({ person, conformity, frozen, focused, onCapture }) {
  const color = conformity > 0.7 ? "#777" : person.color;
  const radius = conformity > 0.7 ? 3 : 12;

  return (
    <div
      onClick={() => onCapture(person)}
      style={{
        position: "absolute",
        left: `${person.x}%`,
        top: `${person.y}%`,
        width: 20,
        height: 20,
        backgroundColor: color,
        borderRadius: radius,
        cursor: "crosshair",

        // Focus + camera pop
        transform: focused ? "scale(1.8)" : "scale(1)",
        outline: focused ? "3px solid red" : "none",
        outlineOffset: "4px",

        transition: frozen
          ? "transform 0.15s ease, outline 0.15s ease"
          : "all 0.5s ease",

        zIndex: focused ? 10 : 1,
      }}
    />
  );
}

export default function App() {
  const [people, setPeople] = useState(
    Array.from({ length: PEOPLE_COUNT }, (_, i) => createPerson(i))
  );

  const [society, setSociety] = useState({ conformity: 0 });
  const [frozen, setFrozen] = useState(false);
  const [focusedId, setFocusedId] = useState(null);
  const [narration, setNarration] = useState(
    "Click someone to take a picture."
  );

  // --- Movement loop ---
  useEffect(() => {
    if (frozen) return;

    const interval = setInterval(() => {
      setPeople((ps) =>
        ps.map((p) => ({
          ...p,
          x: Math.max(0, Math.min(90, p.x + (Math.random() - 0.5) * 6)),
          y: Math.max(0, Math.min(90, p.y + (Math.random() - 0.5) * 6)),
        }))
      );
    }, 900);

    return () => clearInterval(interval);
  }, [frozen]);

  // --- Capture logic ---
  function capture(person) {
    if (frozen) return;

    setFrozen(true);
    setFocusedId(person.id);

    const appeal = person.trendiness * (1 - society.conformity);
    const viral = Math.random() < appeal;

    setNarration(
      viral
        ? "They love this trend."
        : "They reject this trend."
    );

    setPeople((ps) => spreadColor(ps, person.color, viral));

    setSociety((s) => ({
      conformity: Math.min(1, s.conformity + (viral ? 0.12 : 0.04)),
    }));

    setTimeout(() => {
      setFrozen(false);
      setFocusedId(null);
      setNarration("Click someone to take a picture.");
    }, FREEZE_DURATION);
  }

  return (
    <div className="container">
      <p className="status">{narration}</p>

      <div
        className="world"
        style={{
          transform: frozen ? "scale(1.15)" : "scale(1)",
          transition: "transform 0.3s ease",
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
      </div>

      <p className="status">
        Conformity: {(society.conformity * 100).toFixed(0)}% | Current Trend:{" "}
        <span
          style={{
            display: "inline-block",
            width: 16,
            height: 16,
            backgroundColor: getCurrentTrend(people),
            border: "1px solid white",
            verticalAlign: "middle",
            marginLeft: 4,
          }}
        />
      </p>
    </div>
  );
}