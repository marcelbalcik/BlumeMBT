// LevelPicker.jsx — four big buttons (A1 · A2 · B1 · B2), each with a
// one-line English descriptor. Shown full-screen on first open.

const DESCRIPTORS = {
  A1: "first words & greetings",
  A2: "short full sentences",
  B1: "everyday politeness",
  B2: "nuanced & fluent",
};

export default function LevelPicker({ levels, onPick }) {
  return (
    <div className="levelpicker">
      <header className="levelpicker__head">
        <h1 className="levelpicker__title" lang="de">
          Im Blumenladen
        </h1>
        <p className="levelpicker__sub">
          Learn the German you need in a flower shop. Pick a level to begin.
        </p>
      </header>

      <div className="levelpicker__grid">
        {levels.map((lvl) => (
          <button
            key={lvl}
            type="button"
            className="levelbtn"
            onClick={() => onPick(lvl)}
          >
            <span className="levelbtn__code">{lvl}</span>
            <span className="levelbtn__desc">{DESCRIPTORS[lvl]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { DESCRIPTORS };
