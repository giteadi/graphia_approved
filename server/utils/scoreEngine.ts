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
  unplacedCancellations?: Array<{ text: string; confidence: number; reason: string; occurrence?: number }>;

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

// ─── Deterministic word counter (handles headers and inline tags) ───────────
export function countWordsDeterministic(transcription: string): number {
  // 1. Header aur non-body text ko remove karein, sath hi cancellations ko exclude karein
  const bodyText = transcription
    .replace(/Date:\s*\d{1,2}\/\d{1,2}\/\d{4}/gi, '')
    .replace(/\d{1,2}:\d{2}\s*to\s*\d{1,2}(?:am|pm)?/gi, '')
    .replace(/\[(?:CANCELLED|MAYBE-CANCELLED):\s*[^\]]+\]/gi, '') // Cancelled words count mein nahi aayenge
    .replace(/\n/g, ' ')
    .trim();

  // 2. Sirf readable (visible) words count karein
  return bodyText
    .replace(/-/g, ' ')
    .replace(/\bget\s+to\s+gether\b/gi, 'get together')
    .replace(/\bgettogther\b/gi, 'get together')
    .replace(/\bget\s*togther\b/gi, 'get together')
    .replace(/\btogther\b/gi, 'together')
    .replace(/\bgether\b/gi, 'together')
    .split(/\s+/)
    .filter(word => word.length > 0) // Empty strings filter out
    .length;
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

// ─── Individual scorers (Strict Clinical Ratio-Based Formulas) ────────────────

/** SPELLING: Clinical Error Density Penalty */
function scoreSpelling(spellingErrors: number, totalWords: number): number {
  if (totalWords <= 0) return 0;
  if (spellingErrors === 0) return 100;
  
  const errorRate = (spellingErrors / totalWords) * 100;
  const clinicalDeduction = errorRate * 4.5; // Strict multiplier
  return Math.max(0, Math.min(100, Math.round(100 - clinicalDeduction)));
}

/** SENTENCE BOUNDARIES: Increased strictness based on Grade */
function scoreSentenceBoundaries(
  runOnSentences: number,
  missingCapitals: number,
  missingPunctuation: number,
  grade: string,
  totalWords: number
): number {
  if (totalWords <= 0) return 0;

  const gradeNum = parseInt(grade.toLowerCase().replace(/[^0-9]/g, '')) || 6;
  let penaltyMultiplier = 1.0;

  if (gradeNum <= 5) {
    penaltyMultiplier = 0.8;
  } else if (gradeNum <= 8) {
    penaltyMultiplier = 1.2;
  } else {
    penaltyMultiplier = 1.5; // High school/College ke liye strict penalty
  }

  const estimatedSentences = Math.max(1, totalWords / 10);
  const totalBoundaryErrors = (runOnSentences * 2.0) + missingCapitals + missingPunctuation;
  
  const errorRate = (totalBoundaryErrors / estimatedSentences) * 100;
  const adjustedDeduction = errorRate * penaltyMultiplier;

  return Math.max(0, Math.min(100, Math.round(100 - adjustedDeduction)));
}

/** GRAMMAR: Ultra Strict Clinical Multiplier */
function scoreGrammar(
  mistakes: Array<{ type: string; example: string }>,
  totalWords: number
): number {
  if (totalWords <= 0) return 0;
  if (mistakes.length === 0) return 100;

  let errorWeight = 0;
  for (const m of mistakes) {
    switch (m.type) {
      case 'syntax':    errorWeight += 2.0; break;
      case 'agreement': errorWeight += 1.5; break;
      case 'plural':    errorWeight += 1.5; break;
      default:          errorWeight += 1.0;
    }
  }

  const errorRatePer100Words = (errorWeight / totalWords) * 100;
  
  // Strict clinical deduction (Multiplier 8.5)
  // Severe grammar impairment is penalized appropriately.
  const clinicalDeduction = errorRatePer100Words * 8.5;

  return Math.max(0, Math.min(100, Math.round(100 - clinicalDeduction)));
}

/** PAST TENSE: Error ratio based on estimated verbs */
function scorePastTense(pastTenseErrors: number, totalWords: number): number {
  if (totalWords <= 0) return 0;
  if (pastTenseErrors === 0) return 100;

  const estimatedVerbs = Math.max(1, totalWords * 0.15);
  const errorRate = (pastTenseErrors / estimatedVerbs) * 100;

  return Math.max(0, Math.min(100, Math.round(100 - errorRate)));
}

/** VISUAL MECHANICS: Crashing scores on severe traits */

function scoreLetterFormation(observations: string[]): number {
  if (observations.length === 0) return 90;
  const text = observations.join(' ').toLowerCase();
  
  if (text.includes('severe') || text.includes('illegible') || text.includes('poor') || observations.length >= 4) return 35;
  if (text.includes('inconsistent') || text.includes('irregular') || text.includes('cross-out') || text.includes('overwriting') || observations.length >= 3) return 45;
  if (text.includes('mild') || observations.length === 2) return 60;
  return 80;
}

function scoreAlignment(observations: string[]): number {
  if (observations.length === 0) return 90;
  const text = observations.join(' ').toLowerCase();
  
  if (text.includes('severe') || text.includes('erratic') || observations.length >= 3) return 35;
  if (text.includes('moderate') || text.includes('drift') || text.includes('inconsistent') || observations.length === 2)  return 45;
  if (text.includes('minor') || text.includes('slight') || observations.length === 1) return 65;
  return 90;
}

function scoreSpatialOrganisation(observations: string[]): number {
  if (observations.length === 0) return 88;
  const text = observations.join(' ').toLowerCase();
  
  if (text.includes('severe') || text.includes('crowded') || observations.length >= 3) return 35;
  if (text.includes('frequent') || text.includes('irregular') || observations.length === 2) return 45;
  if (observations.length === 1) return 65;
  return 88;
}

function scoreLineQuality(observations: string[]): number {
  if (observations.length === 0) return 90;
  const text = observations.join(' ').toLowerCase();
  
  if (text.includes('severe') || text.includes('heavy') || text.includes('poor') || observations.length >= 3) return 35;
  if (text.includes('tremor') || text.includes('uneven') || text.includes('variable') || observations.length === 2) return 45;
  return 65;
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
  return calculateScoresWithNorm(e, grade);
}

// ─── calculateScoresWithNorm (main entry point) ───────────────────────────────
export function calculateScoresWithNorm(e: EvidenceData, grade: string): Scores {
  console.log('[Score Engine] Calculating scores for grade:', grade);
  console.log('  - wordCount:', e.wordCount);
  console.log('  - spellingErrors:', e.spellingErrors?.length || 0);
  console.log('  - grammarMistakes:', e.grammarMistakes?.length || 0);
  console.log('  - confirmedCancellations:', e.confirmedCancellations?.length || 0);
  console.log('  - wpm:', e.wpm);

  const norm = getWpmNorm(grade);

  const spelling           = scoreSpelling(e.spellingErrors.length, e.wordCount);
  const grammar            = scoreGrammar(e.grammarMistakes, e.wordCount);
  const sentenceBoundaries = scoreSentenceBoundaries(e.runOnSentences, e.missingCapitals, e.missingPunctuation, grade, e.wordCount);
  const pastTenseUsage     = scorePastTense(e.pastTenseErrors, e.wordCount);
  const letterFormation    = scoreLetterFormation(e.letterFormationObservations || []);
  const alignment          = scoreAlignment(e.alignmentObservations || []);
  const spatialOrganisation = scoreSpatialOrganisation(e.spacingObservations || []);
  const lineQuality        = scoreLineQuality(e.lineQualityObservations || []);
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

  const scores = {
    spelling, grammar, sentenceBoundaries, pastTenseUsage,
    letterFormation, alignment, spatialOrganisation, writingSpeed,
    lineQuality, horizontal, vertical, mechanics,
  };

  console.log('[Score Engine] Calculated scores:', scores);

  return scores;
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

  // HIGH: Grammar < 20 (severe grammar impairment)
  if (scores.grammar < 20) return 'HIGH';

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
    scores.mechanics < 65 // Visual mechanics poor fallback
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