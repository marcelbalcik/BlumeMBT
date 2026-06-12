// SituationView.jsx — one interaction: the three figures, the speaker bubbles,
// Play scene, the Tip, her input, fuzzy feedback, the model answer + audio, the
// grammar note, and Next.

import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar.jsx";
import SpeechBubble from "./SpeechBubble.jsx";
import { evaluate } from "../lib/evaluate.js";
import { speakLine, playScene, stop } from "../lib/speak.js";
import { listenOnce, recognitionSupported } from "../lib/listen.js";

const ROLES = ["customer", "boss", "you"]; // fixed positions, always on screen
const SPEEDS = [0.6, 0.8, 1.0];

export default function SituationView({ situation, onNext }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null); // evaluation result (or null)
  const [showTip, setShowTip] = useState(false);
  const [rate, setRate] = useState(0.8);
  const [activeLine, setActiveLine] = useState(-1); // index in script while playing
  const [playing, setPlaying] = useState(false);
  const [listening, setListening] = useState(false); // mic active
  const [micError, setMicError] = useState("");

  const stopFnRef = useRef(null);
  const stopListenRef = useRef(null);

  // Speech-to-text only exists in some browsers (Android Chrome: yes).
  const micSupported = recognitionSupported();

  // Which roles actually speak in this interaction?
  const speakingRoles = new Set(situation.script.map((l) => l.who));

  // Reset everything when the interaction changes; stop any audio.
  useEffect(() => {
    setAnswer("");
    setResult(null);
    setShowTip(false);
    setActiveLine(-1);
    setPlaying(false);
    setListening(false);
    setMicError("");
    stop();
    if (stopListenRef.current) {
      stopListenRef.current();
      stopListenRef.current = null;
    }
    if (stopFnRef.current) {
      stopFnRef.current = null;
    }
  }, [situation.id]);

  // Cancel playback / listening cleanly if the component unmounts.
  useEffect(() => {
    return () => {
      stop();
      if (stopListenRef.current) stopListenRef.current();
    };
  }, []);

  const handleMic = () => {
    if (listening) {
      // Tapping again stops listening.
      if (stopListenRef.current) stopListenRef.current();
      setListening(false);
      return;
    }
    setMicError("");
    stop(); // don't let TTS bleed into the mic
    setListening(true);
    stopListenRef.current = listenOnce({
      onResult: (transcript) => {
        // Drop the recognised German into the box so she can see/fix it,
        // then tap Check. We append if there's already text.
        setAnswer((prev) => (prev ? prev + " " + transcript : transcript));
      },
      onError: (err) => {
        const code = typeof err === "string" ? err : err?.message || "";
        setMicError(
          code === "not-allowed" || code === "service-not-allowed"
            ? "Microphone blocked — allow mic access in your browser."
            : code === "no-speech"
            ? "Didn't catch that — tap the mic and try again."
            : "Speech needs an internet connection. You can type instead."
        );
      },
      onEnd: () => {
        setListening(false);
        stopListenRef.current = null;
      },
    });
  };

  const handlePlayScene = () => {
    if (playing) {
      // Toggle: stop.
      stop();
      setPlaying(false);
      setActiveLine(-1);
      return;
    }
    setPlaying(true);
    stopFnRef.current = playScene(situation.script, {
      rate,
      onLineStart: (i) => setActiveLine(i),
      onEnd: () => {
        setActiveLine(-1);
        setPlaying(false);
      },
    });
  };

  const handleCheck = () => {
    setResult(evaluate(answer, situation.accepted));
  };

  const handleNext = () => {
    stop();
    setPlaying(false);
    onNext();
  };

  return (
    <section className="situation">
      {/* Setting / context line */}
      <p className="situation__setting">{situation.setting}</p>

      {/* The three figures, always in the same fixed positions. */}
      <div className="stage">
        {ROLES.map((role) => {
          const speaks = speakingRoles.has(role);
          // While playing, the avatar of the currently-spoken line is emphasised.
          const isActiveSpeaker =
            playing &&
            activeLine >= 0 &&
            situation.script[activeLine]?.who === role;
          return (
            <Avatar
              key={role}
              role={role}
              speaking={isActiveSpeaker || (!playing && speaks)}
              dimmed={!speaks && role !== "you"}
            />
          );
        })}
      </div>

      {/* Speech bubbles — only for the figure(s) that actually speak. */}
      <div className="bubbles">
        {situation.script.map((line, i) => (
          <SpeechBubble
            key={i}
            line={line}
            rate={rate}
            active={playing && activeLine === i}
          />
        ))}
      </div>

      {/* Play scene + speed control */}
      <div className="playrow">
        <button type="button" className="btn btn--play" onClick={handlePlayScene}>
          {playing ? "■ Stop" : "▶ Play scene"}
        </button>
        <div className="speed" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={"speed__btn" + (rate === s ? " speed__btn--on" : "")}
              onClick={() => setRate(s)}
              aria-pressed={rate === s}
            >
              {s.toFixed(1)}×
            </button>
          ))}
        </div>
      </div>

      {/* Her turn */}
      <div className="turn">
        <label className="turn__cue" htmlFor="answer">
          <strong>Your turn:</strong> {situation.cue}
        </label>

        <div className="turn__tiprow">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowTip((v) => !v)}
            aria-expanded={showTip}
          >
            {showTip ? "Hide tip" : "Tip"}
          </button>
          {showTip && <p className="turn__tip">{situation.tip}</p>}
        </div>

        <div className="turn__inputrow">
          <textarea
            id="answer"
            className="turn__input"
            lang="de"
            rows={2}
            placeholder="Type your German reply…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl/Cmd+Enter checks (handy on a phone keyboard too).
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleCheck();
            }}
          />
          {micSupported && (
            <button
              type="button"
              className={"mic" + (listening ? " mic--on" : "")}
              onClick={handleMic}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Speak your answer"}
              title={listening ? "Listening… tap to stop" : "Speak your answer (needs internet)"}
            >
              🎤
            </button>
          )}
        </div>

        {listening && (
          <p className="turn__listening">Listening… speak your German reply.</p>
        )}
        {micError && <p className="turn__micerror">{micError}</p>}

        <button type="button" className="btn btn--primary" onClick={handleCheck}>
          Check my answer
        </button>
      </div>

      {/* After checking: feedback, model answer + audio, grammar note, Next. */}
      {result && (
        <div className="result">
          <div className={"feedback feedback--" + result.tier}>
            {result.message}
          </div>

          <div className="model">
            <div className="model__head">A natural reply</div>
            <div className="model__row">
              <span className="model__de" lang="de">
                {situation.model}
              </span>
              <button
                type="button"
                className="bubble__speak"
                onClick={() => speakLine({ who: "you", de: situation.model }, { rate })}
                aria-label="Hear the model answer"
                title="Hear the model answer"
              >
                ♪
              </button>
            </div>
            <div className="model__en">{situation.modelEn}</div>
          </div>

          <div className="grammar">
            <div className="grammar__title">{situation.grammar.title}</div>
            <p className="grammar__note">{situation.grammar.note}</p>
          </div>

          <button type="button" className="btn btn--next" onClick={handleNext}>
            Next →
          </button>
        </div>
      )}

      {/* When she hasn't checked yet, Next is still available to skip. */}
      {!result && (
        <button type="button" className="btn btn--ghost btn--skip" onClick={handleNext}>
          Skip →
        </button>
      )}
    </section>
  );
}
