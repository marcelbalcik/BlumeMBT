// evaluate.js — forgiving, encouraging, offline grading.
//
// The whole point here is to be KIND. The learner is a beginner, so we grade
// loosely: we normalise away the things an English keyboard / a typo would get
// wrong, then do a token-level fuzzy match against MANY accepted answers and
// keep the best score. We never block her — the model answer and grammar note
// are always revealed afterwards regardless of score.

// ---------------------------------------------------------------------------
// Step 1 — normalisation
// ---------------------------------------------------------------------------
// lowercase, trim, collapse whitespace, strip punctuation, and fold German
// special characters so someone on an English keyboard can still "win":
//   ä→ae  ö→oe  ü→ue  ß→ss
export function normalize(text) {
  if (!text) return "";
  let s = text.toLowerCase();

  // Fold German special characters (do this before stripping punctuation).
  s = s
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");

  // Strip punctuation:  . , ! ? ; : „ " " ' ’ — –
  s = s.replace(/[.,!?;:„“”"'’\-—–]/g, " ");

  // Collapse repeated whitespace and trim.
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

function tokenize(text) {
  const n = normalize(text);
  return n.length ? n.split(" ") : [];
}

// ---------------------------------------------------------------------------
// Hand-rolled Levenshtein distance (no external library).
// ---------------------------------------------------------------------------
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Two-row dynamic programming — O(min) memory.
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// Similarity in [0,1]: 1 - distance / maxLen.
function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// Two tokens are "fuzzy-equal" if their similarity ≥ 0.8 (tolerates typos).
const FUZZY_THRESHOLD = 0.8;
function fuzzyEqual(a, b) {
  return similarity(a, b) >= FUZZY_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Step 2 — score the learner's answer against ONE accepted answer.
// For each token in the accepted answer, it counts as matched if any token in
// the learner's answer is fuzzy-equal to it. score = matched / total.
// ---------------------------------------------------------------------------
function scoreAgainst(learnerTokens, acceptedTokens) {
  if (acceptedTokens.length === 0) return 0;
  let matched = 0;
  for (const accTok of acceptedTokens) {
    if (learnerTokens.some((lt) => fuzzyEqual(lt, accTok))) {
      matched += 1;
    }
  }
  return matched / acceptedTokens.length;
}

// ---------------------------------------------------------------------------
// Step 4 — tiered, kind feedback.
// ---------------------------------------------------------------------------
function feedbackFor(bestScore) {
  if (bestScore >= 0.9) {
    return { tier: "great", message: "Sehr gut! That's a natural reply." };
  }
  if (bestScore >= 0.6) {
    return { tier: "good", message: "Good — very close! Just a touch off." };
  }
  if (bestScore >= 0.3) {
    return { tier: "close", message: "Close — compare with the answer below." };
  }
  return {
    tier: "try",
    message: "Give it a go — here's a natural reply to learn from.",
  };
}

// ---------------------------------------------------------------------------
// Public API — evaluate a learner answer against the accepted variants.
// Returns { score, tier, message, bestAccepted }.
// ---------------------------------------------------------------------------
export function evaluate(learnerAnswer, acceptedAnswers = []) {
  const learnerTokens = tokenize(learnerAnswer);

  // Step 3 — best score across all accepted answers, remembering which won.
  let bestScore = 0;
  let bestAccepted = acceptedAnswers[0] || "";

  for (const accepted of acceptedAnswers) {
    const accTokens = tokenize(accepted);
    const score = scoreAgainst(learnerTokens, accTokens);
    if (score > bestScore) {
      bestScore = score;
      bestAccepted = accepted;
    }
  }

  // Empty answer → lowest tier, no false "great".
  if (learnerTokens.length === 0) bestScore = 0;

  const fb = feedbackFor(bestScore);
  return {
    score: bestScore,
    tier: fb.tier,
    message: fb.message,
    bestAccepted,
  };
}
