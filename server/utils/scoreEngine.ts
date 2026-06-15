// ─── GraphiaCheck Scoring Engine — Exact Client Formula ──────────────────────
// Reverse-engineered from g10 report. Deterministic. Same input = same score.

export interface EvidenceData {
  transcription: string;
  rawTranscription?: string;           // Original AI output
  displayTranscription?: string;     // After tag injection for UI
  countingTranscription?: string;     // With headers removed for word count
  normalizedTranscription?: string;  // OCR-corrected version for display
  wordCount: number;                 // Node-counted, not AI
  confirmedCancellations?: Array<{ text: string; confidence: number; occurrence?: number; status?: 'confirmed' | 'uncertain' }>;
  uncertainCancellations?: Array<{ text: string; confidence: number; reason: string; occurrence?: number; status?: 'confirmed' | 'uncertain' }>;

  // Spelling
  spellingErrors: Array<{ written: string; intended: string; gradeLevel: string }>;

  // Word choice mistakes (homophones, etc.)
  wordChoiceMistakes?: Array<{ written: string; intended: string; confidence?: number; type?: string }>;

  // Grammar
  grammarMistakes: Array<{ type: 'agreement' | 'plural' | 'syntax' | 'other'; example: string }>;
  runOnSentences: number;
  missingCapitals: number;
  missingPunctuation: number;

  // Past tense
  pastTenseErrors: number;    // count of misuses

  // Visual mechanics (observation strings from AI)
  letterFormationObservations: string[];
  observedLetterFormationLetters?: string[];
  alignmentObservations: string[];
  spacingObservations: string[];
  lineQualityObservations: string[];

  // Fluency
  wpm: number;

  // RTI
  rtiImprovement: boolean;

  // DSM-5 traits for narrative
  dsm5Traits: string[];
  features?: Record<string, string>;

  uncertainWords?: Array<{ word: string; confidence: number; possibleAlternatives: string[] }>;
  ocrConfidence?: number;
  dysgraphiaIndicators?: string[];
}

export interface Scores {
  spelling: number;
  grammar: number;
  sentenceBoundaries: number;
  pastTenseUsage: number;
  letterFormation: number;
  alignment: number;
  spatialOrganisation: number;
  writingSpeed: number;
  lineQuality: number;
  horizontal: number;
  vertical: number;
  mechanics: number;
}

// ─── Node word counter (reliable — not AI) ───────────────────────────────────
export function countWords(transcription: string): number {
  return transcription
    .replace(/\[CANCELLED:[^\]]+\]/gi, ' ') // remove cancelled blocks with space (policy: exclude cancelled words from count)
    .replace(/\n/g, ' ')                   // normalize line breaks
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
    .length;
}

// ─── Deterministic word counter (handles inline [CANCELLED: ...] tags) ─────
export function countWordsDeterministic(transcription: string): number {
  let t = transcription
    // include cancelled words in total written words
    .replace(/\[CANCELLED:\s*([^\]]+)\]/gi, ' $1 ')
    .replace(/\n/g, ' ')
    .trim();

  // Counting-only normalization (do NOT use this for display text)
  t = t
    // hyphen as separator for counting ("get-together" => "get together")
    .replace(/-/g, ' ')
    // OCR splits/merges around together
    .replace(/\bget\s+to\s+gether\b/gi, 'get together')
    .replace(/\bgettogther\b/gi, 'get together')
    .replace(/\bget\s*togther\b/gi, 'get together')
    .replace(/\btogther\b/gi, 'together')
    .replace(/\bgether\b/gi, 'together');

  return t.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

// ─── WPM grade norms ──────────────────────────────────────────────────────────
export function getWpmNorm(grade: string): { min: number; max: number } {
  const n = parseInt(grade.toLowerCase().replace(/[^0-9]/g, ''));
  if (n === 1)           return { min: 5,  max: 10  };
  if (n === 2)           return { min: 8,  max: 12  };
  if (n === 3)           return { min: 10, max: 15  };
  if (n === 4)           return { min: 12, max: 18  };
  if (n === 5)           return { min: 15, max: 20  };
  if (n >= 6 && n <= 12) return { min: 20, max: 30  };
  if (n >= 13)           return { min: 30, max: 40  };
  return { min: 20, max: 30 };
}

// ─── Individual scorers (exact client formulas) ───────────────────────────────

/** SPELLING: (correctly spelled words / total words) × 100, clamped 0-100 */
function scoreSpelling(spellingErrors: number, totalWords: number): number {
  if (totalWords <= 0) return 0;
  const correctlySpelled = totalWords - spellingErrors;
  const percentage = Math.round((correctlySpelled / totalWords) * 100);
  return Math.max(0, Math.min(100, percentage));
}

/** SENTENCE BOUNDARIES: 100 - runOn×15 - missingCapital×5 - missingPunct×5 (grade-adjusted) */
function scoreSentenceBoundaries(
  runOnSentences: number,
  missingCapitals: number,
  missingPunctuation: number,
  grade: string
): number {
  // Grade-based penalty multiplier
  // Higher grades = stricter penalties, lower grades = more lenient
  const gradeNum = parseInt(grade.toLowerCase().replace(/[^0-9]/g, '')) || 6;
  let penaltyMultiplier = 1.0;
  
  if (gradeNum <= 2) {
    penaltyMultiplier = 0.5; // Very lenient for early elementary
  } else if (gradeNum <= 5) {
    penaltyMultiplier = 0.7; // Lenient for elementary
  } else if (gradeNum <= 8) {
    penaltyMultiplier = 0.85; // Lenient for middle school
  } else if (gradeNum <= 11) {
    penaltyMultiplier = 1.0; // Standard for high school
  } else {
    penaltyMultiplier = 1.1; // Slightly strict for upper high school/college
  }

  const baseScore = 100 - (runOnSentences * 15) - (missingCapitals * 5) - (missingPunctuation * 5);
  const adjustedScore = 100 - ((100 - baseScore) * penaltyMultiplier);
  
  return Math.max(0, Math.min(100, adjustedScore));
}

/** GRAMMAR: 100 - agreement×15 - plural×15 - syntax×20 - other×10 */
function scoreGrammar(
  mistakes: Array<{ type: string; example: string }>
): number {
  let deduction = 0;
  for (const m of mistakes) {
    switch (m.type) {
      case 'agreement': deduction += 15; break;
      case 'plural':    deduction += 15; break;
      case 'syntax':    deduction += 20; break;
      default:          deduction += 10;
    }
  }
  return Math.max(0, Math.min(100, 100 - deduction));
}

/** PAST TENSE: 100 - errors×20 */
function scorePastTense(pastTenseErrors: number): number {
  return Math.max(0, Math.min(100, 100 - pastTenseErrors * 20));
}

/**
 * LETTER FORMATION:
 * 0 issues = 90 | 1 = 80 | 2 = 70 | 3+ = 65
 */
function scoreLetterFormation(observations: string[]): number {
  const n = observations.length;
  if (n === 0) return 90;
  if (n === 1) return 80;
  if (n === 2) return 70;
  return 65;
}

/**
 * ALIGNMENT:
 * stable/none = 90 | minor = 75 | moderate = 60 | severe = 40
 */
function scoreAlignment(observations: string[]): number {
  if (observations.length === 0) return 90;
  const text = observations.join(' ').toLowerCase();
  if (text.includes('severe') || text.includes('erratic')) return 40;
  if (text.includes('moderate') || observations.length >= 3)  return 60;
  if (text.includes('minor') || text.includes('slight') || observations.length >= 1) return 75;
  return 90;
}

/** SPATIAL ORGANISATION: similar to alignment */
function scoreSpatialOrganisation(observations: string[]): number {
  if (observations.length === 0) return 88;
  const text = observations.join(' ').toLowerCase();
  if (text.includes('severe') || text.includes('crowded')) return 35;
  if (observations.length >= 3 || text.includes('frequent')) return 58;
  if (observations.length >= 1) return 75;
  return 88;
}

/** LINE QUALITY */
function scoreLineQuality(observations: string[]): number {
  if (observations.length === 0) return 88;
  if (observations.length === 1) return 75;
  if (observations.length <= 3)  return 60;
  return 40;
}

/** WRITING SPEED relative to grade norm */
function scoreWritingSpeed(wpm: number, normMin: number, normMax: number): number {
  if (wpm <= 0)          return 0;
  if (wpm >= normMax)    return 90;
  if (wpm >= normMin)    return 80;
  const pct = (wpm / normMin) * 100;
  if (pct >= 75)         return 72;
  if (pct >= 50)         return 60;
  return 40;
}

// ─── Main calculator ──────────────────────────────────────────────────────────
export function calculateScores(e: EvidenceData, grade: string): Scores {
  const norm = getWpmNorm(''); // fallback — caller should set wpm against norm separately

  const spelling           = scoreSpelling(e.spellingErrors.length, e.wordCount);
  const grammar            = scoreGrammar(e.grammarMistakes);
  const sentenceBoundaries = scoreSentenceBoundaries(e.runOnSentences, e.missingCapitals, e.missingPunctuation, grade);
  const pastTenseUsage     = scorePastTense(e.pastTenseErrors);
  const letterFormation    = scoreLetterFormation(e.letterFormationObservations);
  const alignment          = scoreAlignment(e.alignmentObservations);
  const spatialOrganisation = scoreSpatialOrganisation(e.spacingObservations);
  const lineQuality        = scoreLineQuality(e.lineQualityObservations);
  const writingSpeed       = scoreWritingSpeed(e.wpm, norm.min, norm.max);

  const horizontal = Math.round((spatialOrganisation + alignment) / 2);
  const vertical   = Math.round((alignment + lineQuality) / 2);
  const mechanics  = Math.round(
    letterFormation    * 0.25 +
    alignment          * 0.20 +
    spatialOrganisation * 0.20 +
    lineQuality        * 0.15 +
    writingSpeed       * 0.20
  );

  return {
    spelling, grammar, sentenceBoundaries, pastTenseUsage,
    letterFormation, alignment, spatialOrganisation, writingSpeed,
    lineQuality, horizontal, vertical, mechanics,
  };
}

// ─── calculateScoresWithNorm (main entry point) ───────────────────────────────
export function calculateScoresWithNorm(e: EvidenceData, grade: string): Scores {
  const norm = getWpmNorm(grade);

  const spelling           = scoreSpelling(e.spellingErrors.length, e.wordCount);
  const grammar            = scoreGrammar(e.grammarMistakes);
  const sentenceBoundaries = scoreSentenceBoundaries(e.runOnSentences, e.missingCapitals, e.missingPunctuation, grade);
  const pastTenseUsage     = scorePastTense(e.pastTenseErrors);
  const letterFormation    = scoreLetterFormation(e.letterFormationObservations);
  const alignment          = scoreAlignment(e.alignmentObservations);
  const spatialOrganisation = scoreSpatialOrganisation(e.spacingObservations);
  const lineQuality        = scoreLineQuality(e.lineQualityObservations);
  const writingSpeed       = scoreWritingSpeed(e.wpm, norm.min, norm.max);

  const horizontal = Math.round((spatialOrganisation + alignment) / 2);
  const vertical   = Math.round((alignment + lineQuality) / 2);
  const mechanics  = Math.round(
    letterFormation    * 0.25 +
    alignment          * 0.20 +
    spatialOrganisation * 0.20 +
    lineQuality        * 0.15 +
    writingSpeed       * 0.20
  );

  return {
    spelling, grammar, sentenceBoundaries, pastTenseUsage,
    letterFormation, alignment, spatialOrganisation, writingSpeed,
    lineQuality, horizontal, vertical, mechanics,
  };
}

// ─── Probability engine (2-level: LOW / HIGH) ──────────────────────────────────
export function calculateProbability(
  scores: Scores,
  rtiImprovement: boolean,
  wpm: number,
  grade: string = '6'
): string {
  const { spelling, writingSpeed, letterFormation, alignment } = scores;
  const norm = getWpmNorm(grade);

  // Count visual/mechanics impaired domains (score <= 60)
  const visualImpairedCount =
    (scores.letterFormation <= 60 ? 1 : 0) +
    (scores.alignment <= 60 ? 1 : 0) +
    (scores.lineQuality <= 60 ? 1 : 0) +
    (scores.spatialOrganisation <= 60 ? 1 : 0);

  // ── Severe fluency deficit (below 50% of norm min) ──
  const wpmPercent = norm.min > 0 ? (wpm / norm.min) * 100 : 100;
  const severeFluency = wpm > 0 && wpmPercent < 50;

  // HIGH: Original condition (spelling + speed + 2+ visual domains impaired)
  if (
    spelling <= 30 &&
    wpm < norm.min &&
    visualImpairedCount >= 2
  ) {
    return 'HIGH';
  }

  // HIGH: Severe fluency + 2+ visual domains impaired
  if (severeFluency && visualImpairedCount >= 2) {
    return 'HIGH';
  }

  // HIGH: Severe fluency alone (even with good spelling)
  if (severeFluency) {
    return 'HIGH';
  }

  // HIGH if spelling moderate + slow speed + mild visual concerns
  if (
    spelling >= 50 && spelling < 70 &&
    wpm < norm.min &&
    (letterFormation >= 65 || alignment >= 70)
  ) {
    return 'HIGH';
  }

  // Count impaired domains (score < 60 OR visual impairment >= 1)
  const impaired = [
    scores.spelling < 60,
    scores.grammar < 60,
    scores.sentenceBoundaries < 60,
    scores.pastTenseUsage < 60,
    visualImpairedCount >= 1,
    scores.writingSpeed < 60,
  ].filter(Boolean).length;

  if (impaired >= 2) return 'HIGH';
  return 'LOW';
}

// ─── Actionable strategies library ───────────────────────────────────────────
export function getActionableStrategies(scores: Scores, rtiImprovement: boolean): string[] {
  const strategies: string[] = [];

  if (scores.writingSpeed < 60) {
    strategies.push('Allow extended time on all written tasks and assessments.');
    strategies.push('Introduce speech-to-text tools for longer writing assignments so ideas are not blocked by the physical act of writing.');
  }

  if (scores.spelling < 60) {
    strategies.push('Use a multi-sensory spelling approach: say, spell, write, and check each word.');
    strategies.push('Provide a personalised spelling list of high-frequency words for regular practice.');
    strategies.push('Encourage editing in stages — first for ideas, then separately for spelling.');
  }

  if (scores.letterFormation < 70) {
    strategies.push('Provide lined paper with raised tactile lines to help the student maintain letter size and baseline.');
    strategies.push('Practice letter formation using large motor movements (whiteboard, sand trays) before moving to paper.');
  }

  if (scores.grammar < 60) {
    strategies.push('Use graphic organisers to plan sentence structure before writing.');
  }

  if (rtiImprovement) {
    strategies.push('Continue current intervention strategies — progress is evident and should be monitored each term.');
  }

  // Always include at least 3
  if (strategies.length < 3) {
    strategies.push('Offer regular short writing sessions (10–15 minutes) with immediate positive feedback to build confidence.');
    strategies.push('Collaborate with an occupational therapist for a formal fine motor and handwriting assessment.');
  }

  return strategies.slice(0, 5);
}
