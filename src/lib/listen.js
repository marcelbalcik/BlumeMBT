// listen.js — German speech-to-text via the Web Speech API's SpeechRecognition.
//
// NOTE: unlike the rest of the app, recognition needs an internet connection
// (Chrome sends audio to Google's servers). It is offered as an optional extra
// next to typing, which stays as the offline fallback. Works on Android Chrome.

// Browsers expose this as either SpeechRecognition or webkitSpeechRecognition.
const SR =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Is speech recognition available in this browser at all?
export function recognitionSupported() {
  return !!SR;
}

// Start listening for one German utterance.
// Calls onResult(transcript) with the recognised text, onEnd() when it stops,
// and onError(err) on failure. Returns a stop() function to cancel early.
export function listenOnce({ onResult, onEnd, onError } = {}) {
  if (!SR) {
    if (onError) onError(new Error("not-supported"));
    if (onEnd) onEnd();
    return () => {};
  }

  const rec = new SR();
  rec.lang = "de-DE";
  rec.interimResults = false; // we only want the final transcript
  rec.maxAlternatives = 1;
  rec.continuous = false; // one phrase, then stop

  rec.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (onResult) onResult(transcript.trim());
  };
  rec.onerror = (event) => {
    if (onError) onError(event.error || event);
  };
  rec.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    rec.start();
  } catch (err) {
    // start() can throw if called twice; surface it kindly.
    if (onError) onError(err);
    if (onEnd) onEnd();
  }

  return () => {
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  };
}
