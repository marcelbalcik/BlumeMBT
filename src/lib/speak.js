// speak.js — all Web Speech API logic lives here.
//
// We use the browser's built-in speechSynthesis (no external TTS service, works
// offline). Each German line is spoken with lang = "de-DE". When several German
// voices exist we assign a distinct one per role; otherwise we keep a single
// voice and vary the pitch so the customer, boss and learner still sound apart.

// Per-role pitch (used when only one German voice is available).
const PITCH = {
  customer: 1.15,
  boss: 0.85,
  you: 1.0,
};

// Cached, role-assigned voices. Rebuilt whenever the voice list changes.
let germanVoices = [];
let voiceByRole = {};

function buildVoices() {
  const all = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  // Prefer real de-DE voices, then any German ("de") voice.
  germanVoices = all
    .filter((v) => /^de(-DE)?/i.test(v.lang))
    .sort((a, b) => {
      const aDE = /de-DE/i.test(a.lang) ? 0 : 1;
      const bDE = /de-DE/i.test(b.lang) ? 0 : 1;
      return aDE - bDE;
    });

  // Assign distinct voices per role when we have enough; otherwise everyone
  // shares the first German voice and we differentiate by pitch instead.
  voiceByRole = {};
  if (germanVoices.length >= 3) {
    voiceByRole.customer = germanVoices[0];
    voiceByRole.boss = germanVoices[1];
    voiceByRole.you = germanVoices[2];
  } else if (germanVoices.length === 2) {
    voiceByRole.customer = germanVoices[0];
    voiceByRole.boss = germanVoices[1];
    voiceByRole.you = germanVoices[0];
  } else if (germanVoices.length === 1) {
    voiceByRole.customer = germanVoices[0];
    voiceByRole.boss = germanVoices[0];
    voiceByRole.you = germanVoices[0];
  }
}

// Voices load asynchronously on some browsers — rebuild when they arrive.
if (typeof window !== "undefined" && window.speechSynthesis) {
  buildVoices();
  window.speechSynthesis.onvoiceschanged = buildVoices;
}

const hasDistinctVoices = () => germanVoices.length >= 2;

// Build a configured utterance for one line.
function makeUtterance(line, { rate = 0.92 } = {}) {
  const who = line.who || "you";
  const u = new SpeechSynthesisUtterance(line.de);
  u.lang = "de-DE";
  u.rate = rate;

  const voice = voiceByRole[who] || voiceByRole.customer || null;
  if (voice) u.voice = voice;

  // If we couldn't give each role its own voice, vary pitch so roles differ.
  u.pitch = hasDistinctVoices() ? 1.0 : PITCH[who] ?? 1.0;

  return u;
}

// Speak a single line. `line` is { who, de }.
export function speakLine(line, { rate = 0.92 } = {}) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // never overlap
  // Make sure voices are ready (Safari sometimes needs a late rebuild).
  if (germanVoices.length === 0) buildVoices();
  window.speechSynthesis.speak(makeUtterance(line, { rate }));
}

// Speak an ordered list of lines, chaining each utterance's onend.
// - onLineStart(index) fires as each line begins (so the UI can highlight it)
// - onEnd() fires once the whole scene finishes
export function playScene(lines, { rate = 0.92, onLineStart, onEnd } = {}) {
  if (!window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  if (germanVoices.length === 0) buildVoices();

  let i = 0;
  let cancelled = false;

  const speakNext = () => {
    if (cancelled) return;
    if (i >= lines.length) {
      if (onEnd) onEnd();
      return;
    }
    const idx = i;
    const u = makeUtterance(lines[idx], { rate });
    u.onstart = () => {
      if (!cancelled && onLineStart) onLineStart(idx);
    };
    u.onend = () => {
      if (cancelled) return;
      i += 1;
      speakNext();
    };
    // Some browsers don't reliably fire onstart; call it just before speaking.
    if (onLineStart) onLineStart(idx);
    window.speechSynthesis.speak(u);
  };

  speakNext();

  // Allow the caller to stop this particular scene.
  return () => {
    cancelled = true;
    window.speechSynthesis.cancel();
  };
}

// Hard stop for any current speech.
export function stop() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}
