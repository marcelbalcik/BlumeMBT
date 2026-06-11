// App.jsx — top-level state: which level, which interaction.
// Picks a random interaction from the current level; "Next" picks another
// random one from the same level WITHOUT immediately repeating the last.

import { useEffect, useMemo, useState } from "react";
import { levels, getByLevel } from "./data/situations.js";
import LevelPicker, { DESCRIPTORS } from "./components/LevelPicker.jsx";
import SituationView from "./components/SituationView.jsx";
import { stop } from "./lib/speak.js";

function pickRandom(pool, excludeId) {
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  let next;
  do {
    next = pool[Math.floor(Math.random() * pool.length)];
  } while (next.id === excludeId); // never immediately repeat
  return next;
}

export default function App() {
  const [level, setLevel] = useState(null); // null → show the level picker
  const [current, setCurrent] = useState(null);

  const pool = useMemo(() => (level ? getByLevel(level) : []), [level]);

  // When a level is chosen (or changed), load a fresh random interaction.
  useEffect(() => {
    if (level) {
      setCurrent(pickRandom(getByLevel(level), null));
    } else {
      setCurrent(null);
    }
  }, [level]);

  const handleNext = () => {
    setCurrent((prev) => pickRandom(pool, prev?.id));
  };

  const handleChangeLevel = (lvl) => {
    stop();
    setLevel(lvl);
  };

  // First screen: the level picker.
  if (!level || !current) {
    return <LevelPicker levels={levels} onPick={handleChangeLevel} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="topbar__title" lang="de">
          Im Blumenladen
        </h1>
        {/* Level pills — visible on the main screen, change level any time. */}
        <nav className="pills" aria-label="Choose level">
          {levels.map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={"pill" + (lvl === level ? " pill--on" : "")}
              onClick={() => handleChangeLevel(lvl)}
              aria-pressed={lvl === level}
              title={DESCRIPTORS[lvl]}
            >
              {lvl}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        <SituationView
          key={current.id}
          situation={current}
          onNext={handleNext}
        />
      </main>

      <footer className="foot">
        <span className="foot__level">
          {level} · {DESCRIPTORS[level]}
        </span>
      </footer>
    </div>
  );
}
