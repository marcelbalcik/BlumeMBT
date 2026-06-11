// SpeechBubble.jsx — German dialogue in a soft, role-coloured bubble.
// Tapping the bubble toggles the English translation (German always stays).
// A small ♪ button speaks the line.

import { useState } from "react";
import { speakLine } from "../lib/speak.js";

export default function SpeechBubble({ line, rate, active = false }) {
  const [showEn, setShowEn] = useState(false);

  const who = line.who; // "customer" | "boss"

  return (
    <div
      className={
        "bubble bubble--" + who + (active ? " bubble--active" : "")
      }
    >
      <button
        type="button"
        className="bubble__text"
        onClick={() => setShowEn((v) => !v)}
        aria-expanded={showEn}
        title="Tap to toggle the English translation"
      >
        <span className="bubble__de" lang="de">
          {line.de}
        </span>
        {showEn && <span className="bubble__en">{line.en}</span>}
      </button>

      <button
        type="button"
        className="bubble__speak"
        onClick={(e) => {
          e.stopPropagation();
          speakLine(line, { rate });
        }}
        aria-label="Hear this line"
        title="Hear this line"
      >
        ♪
      </button>
    </div>
  );
}
