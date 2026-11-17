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
  grammarMistakes: Array<{ type: 'agreement' | 'plural' | 'syntax' | 'other'; example: string; errorWord?: string }>;
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
  /** False when "time taken" was never recorded — writing speed is unknown, not slow. */
  writingSpeedAssessed: boolean;
  lineQuality: number;
  horizontal: number;
  vertical: number;
  mechanics: number;
}

// ─── Deterministic word counter (handles headers and inline tags) ───────────
export function countWordsDeterministic(transcription: string, studentName?: string, prompt?: string): number {
  if (!transcription || typeof transcription !== 'string') return 0;

  const rawWords = transcription
    .replace(/\[CANCELLED:\s*[^\]]+\]/gi, '')
    .replace(/[\[\]]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  let text = transcription;

  // 1. Process line-by-line: drop standalone header/metadata lines (<= 15 words)
  const lines = text.split('\n');
  const cleanedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    const words = trimmed.split(/\s+/).filter(Boolean);

    // If the line is short (<= 15 words) and matches an administrative label, student name, or date, drop it
    if (words.length <= 15) {
      if (/^(?:Q|Question|Topic|Prompt|Title|Essay|Name|Student|Date)\b[:\s-]/i.test(trimmed)) return '';
      if (studentName && trimmed.toLowerCase() === studentName.trim().toLowerCase()) return '';
      if (/^\s*\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\s*$/.test(trimmed)) return '';
      if (studentName && new RegExp('^' + studentName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+\\d{1,2}[\\/\\.-]\\d{1,2}[\\/\\.-]\\d{2,4}$', 'i').test(trimmed)) return '';
    }
    return trimmed;
  });

  text = cleanedLines.filter(Boolean).join('\n');

  // 2. Strip prompt if passed
  if (prompt && prompt.trim()) {
    const escapedPrompt = prompt.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp('^(?:\\s*(?:Q|Question|Topic|Prompt|Title|Essay)\\s*[:\\s-]*)?' + escapedPrompt + '\\s*\\??\\s*', 'i'), ' ');
  }

  // 3. Strip studentName if passed at start of text or after a label
  if (studentName && studentName.trim()) {
    const escapedName = studentName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp('(?:^|\\s)(?:Name|Student)?\\s*[:\\s-]*' + escapedName + '\\b', 'gi'), ' ');
    const nameParts = studentName.trim().split(/\s+/).filter(p => p.length >= 3);
    for (const part of nameParts) {
      const escPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp('(?:^|\\s)(?:Name|Student)\\s*[:\\s-]*' + escPart + '\\b', 'gi'), ' ');
    }
  }

  // 4. Safe inline question prefix strip: only strip if question is short (<= 12 words) and within first 80 chars
  text = text.replace(/^\s*(?:Q|Question|Prompt)\s*:\s*([^?\n]{1,80}\?)/i, (match, q) => {
    return q.split(/\s+/).filter(Boolean).length <= 12 ? ' ' : match;
  });

  // 5. Safe label prefix strip
  text = text.replace(/^\s*(?:Essay|Title|Topic|Prompt)\s*[-:]\s*/i, ' ');

  // 6. Strip date patterns and cancellations
  const bodyText = text
    .replace(/\bDate:\s*\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\b/gi, ' ')
    .replace(/\b\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\b/gi, ' ')
    .replace(/\b\d{1,2}:\d{2}\s*(?:to\s*\d{1,2}(?::\d{2})?)?\s*(?:am|pm)?\b/gi, ' ')
    .replace(/\[CANCELLED:\s*[^\]]+\]/gi, '') // ONLY confirmed cancellations are removed from word count
    .replace(/\n/g, ' ')
    .trim();

  // 7. Sirf readable (visible) words count karein
  const words = bodyText
    .replace(/[\[\]]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);

  // Safety net: Agar strip ke baad count 0 aaye aur original mein 20+ words hon, to original count use karo
  if (words.length === 0 && rawWords.length >= 20) {
    return rawWords.length;
  }

  return words.length;
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

/**
 * Minimum sample size used as the denominator when extrapolating an error rate.
 * Matches the 75-word validity threshold used for the report's validity warning.
 *
 * Without this floor, a handful of errors in a very short sample extrapolates to
 * an impossible per-100-word rate (e.g. 2 mistakes in 8 words => 371% deduction),
 * collapsing the score to 0. Short samples are under-powered, not catastrophic.
 */
const MIN_RATE_SAMPLE_WORDS = 75;

/** Denominator for per-100-word rates, floored so small samples don't explode. */
function rateDenominator(totalWords: number): number {
  return Math.max(totalWords, MIN_RATE_SAMPLE_WORDS);
}

/** SPELLING: Clinical Error Density Penalty with Grade Scaling */
function scoreSpelling(spellingErrors: number, totalWords: number, grade: string = ''): number {
  if (totalWords <= 0) return 0;
  if (spellingErrors === 0) return 100;
  
  const gradeNum = parseInt(grade.toLowerCase().replace(/[^0-9]/g, '')) || 6;
  let multiplier = 4.5;
  if (gradeNum >= 12) {
    multiplier = 10.0; // High school seniors with elementary errors: ~30 pt deduction for 4 errors on 133 words = 70
  } else if (gradeNum >= 9) {
    multiplier = 6.5;
  } else if (gradeNum >= 6) {
    multiplier = 5.2;
  }
  
  const errorRate = (spellingErrors / totalWords) * 100;
  const clinicalDeduction = errorRate * multiplier;
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
  } else if (gradeNum >= 12) {
    penaltyMultiplier = 1.33; // High school senior: 1 run-on + 1 missing mark on 133 words = ~20 pt deduction -> 80
  } else {
    penaltyMultiplier = 1.5; // High school/College standard
  }

  const estimatedSentences = Math.max(5, totalWords / 10);
  const totalBoundaryErrors = Math.min(
    (runOnSentences * 1.0) + missingCapitals + missingPunctuation,
    estimatedSentences * 0.6 // cap at 60% error rate maximum
  );
  
  const errorRate = (totalBoundaryErrors / estimatedSentences) * 100;
  const adjustedDeduction = errorRate * penaltyMultiplier;

  return Math.max(0, Math.min(100, Math.round(100 - adjustedDeduction)));
}

/** GRAMMAR: Ultra Strict Clinical Multiplier */
function scoreGrammar(
  mistakes: Array<{ type: string; example: string }>,
  totalWords: number,
  grade: string = ''
): number {
  if (totalWords <= 0) return 0;
  // Without extensive writing sample or explicit grammar proof, cap default baseline at 95
  if (mistakes.length === 0) return totalWords < 30 ? 90 : 95;

  const gradeNum = parseInt(grade.toLowerCase().replace(/[^0-9]/g, '')) || 6;
  let errorWeight = 0;
  for (const m of mistakes) {
    switch (m.type) {
      case 'syntax':    errorWeight += 2.0; break;
      case 'agreement': errorWeight += 1.5; break;
      case 'plural':    errorWeight += 1.5; break;
      default:          errorWeight += 1.0;
    }
  }

  const errorRatePer100Words = (errorWeight / rateDenominator(totalWords)) * 100;

  // Strict clinical deduction (Multiplier 8.5 for middle grades, 10.0 for grade 12)
  const clinicalMultiplier = gradeNum >= 12 ? 10.0 : 8.5;
  const clinicalDeduction = errorRatePer100Words * clinicalMultiplier;

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

function scoreLetterFormation(observations: string[], features?: EvidenceData['features']): number {
  if (features?.legibility || features?.letterShapeQuality || features?.letterSizeConsistency) {
    if (features.legibility === 'low' || features.letterShapeQuality === 'poor' || features.letterSizeConsistency === 'poor') {
      return 45;
    }
    if (features.legibility === 'moderate' || features.letterShapeQuality === 'fair' || features.letterSizeConsistency === 'fair') {
      return 70;
    }
    if (features.legibility === 'high' && (features.letterShapeQuality === 'good' || !features.letterShapeQuality)) {
      return 85;
    }
  }

  if (observations.length === 0) return 85;
  const text = observations.join(' ').toLowerCase();
  
  const hasSevere = /\bsevere\b/.test(text) && !/\b(?:no|not|without|minimal)\s+severe\b/.test(text);
  const hasIllegible = /\billegible\b/.test(text) && !/\b(?:not|barely)\s+illegible\b/.test(text);
  const hasIrregular = /\birregular\b/.test(text) && !/\b(?:no|not)\s+irregular\b/.test(text);

  if (hasSevere || hasIllegible) return 35;
  if (hasIrregular && text.includes('poor')) return 45;
  // Readable cursive/print hybrid or mostly legible handwriting represents average performance
  if (text.includes('cursive') || text.includes('hybrid') || text.includes('mostly legible') || text.includes('generally legible') || text.includes('generally smooth')) {
    return 75;
  }
  if (hasIrregular || text.includes('inconsistent') || observations.length >= 3) return 55;
  if (text.includes('mild') || observations.length === 2) return 65;
  return 80;
}

function scoreAlignment(observations: string[], features?: EvidenceData['features']): number {
  if (features?.baselineDeviation) {
    if (features.baselineDeviation === 'none') return 92;
    if (features.baselineDeviation === 'mild') return 80;
    if (features.baselineDeviation === 'moderate') return 55;
    if (features.baselineDeviation === 'severe') return 35;
  }

  if (observations.length === 0) return 90;
  const text = observations.join(' ').toLowerCase();
  
  const hasSevere = /\b(?:severe|erratic)\b/.test(text) && !/\b(?:no|not|without)\s+(?:severe|erratic)\b/.test(text);
  if (hasSevere) return 35;
  // Handwriting on ruled lines with stable baseline or generally straight orientation represents good/average performance
  if (text.includes('stable baseline') || text.includes('ruled line') || text.includes('generally straight') || text.includes('mostly stays')) {
    return 85;
  }
  if (text.includes('moderate') || text.includes('drift') || text.includes('inconsistent') || observations.length >= 2) return 55;
  if (text.includes('minor') || text.includes('slight') || observations.length === 1) return 70;
  return 90;
}

function scoreSpatialOrganisation(observations: string[], features?: EvidenceData['features']): number {
  if (features?.spacingConsistency) {
    if (features.spacingConsistency === 'good') return 90;
    if (features.spacingConsistency === 'fair') return 70;
    if (features.spacingConsistency === 'poor') return 45;
  }

  if (observations.length === 0) return 88;
  const text = observations.join(' ').toLowerCase();
  
  const hasSevere = /\b(?:severe|crowded)\b/.test(text) && !/\b(?:no|not|without)\s+(?:severe|crowded)\b/.test(text);
  if (hasSevere) return 35;
  if (text.includes('frequent') || text.includes('irregular') || observations.length >= 2) return 55;
  if (observations.length === 1) return 70;
  return 88;
}

function scoreLineQuality(observations: string[], features?: EvidenceData['features']): number {
  if (features?.lineSteadiness) {
    if (features.lineSteadiness === 'steady') return 90;
    if (features.lineSteadiness === 'slightly_wavy') return 70;
    if (features.lineSteadiness === 'wavy') return 55;
  }

  if (observations.length === 0) return 90;
  const text = observations.join(' ').toLowerCase();
  
  const hasSevere = /\b(?:severe|heavy|poor)\b/.test(text) && !/\b(?:no|not|without)\s+(?:severe|heavy|poor)\b/.test(text);
  if (hasSevere) return 35;
  if (text.includes('tremor') || text.includes('uneven') || text.includes('variable') || observations.length >= 2) return 55;
  return 70;
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

  const spelling           = scoreSpelling(e.spellingErrors.length, e.wordCount, grade);
  const grammar            = scoreGrammar(e.grammarMistakes, e.wordCount, grade);
  const sentenceBoundaries = scoreSentenceBoundaries(e.runOnSentences, e.missingCapitals, e.missingPunctuation, grade, e.wordCount);
  const pastTenseUsage     = scorePastTense(e.pastTenseErrors, e.wordCount);
  const letterFormation    = scoreLetterFormation(e.letterFormationObservations || [], e.features);
  const alignment          = scoreAlignment(e.alignmentObservations || [], e.features);
  const spatialOrganisation = scoreSpatialOrganisation(e.spacingObservations || [], e.features);
  const lineQuality        = scoreLineQuality(e.lineQualityObservations || [], e.features);
  // A missing or zero "time taken" means writing speed was never MEASURED — it is
  // not evidence of slow writing. Scoring it as 0 would drag mechanics down and
  // manufacture a false HIGH dysgraphia probability from an empty form field.
  const writingSpeedAssessed = e.wpm > 0;
  const writingSpeed = writingSpeedAssessed
    ? scoreWritingSpeed(e.wpm, norm.min, norm.max)
    : 0;

  const horizontal = Math.round((spatialOrganisation + alignment) / 2);
  const vertical   = Math.round((alignment + lineQuality) / 2);

  // When speed is unavailable its 20% weight is redistributed over the
  // remaining domains instead of counting as a zero.
  const mechanics = writingSpeedAssessed
    ? Math.round(
        letterFormation     * 0.25 +
        alignment           * 0.20 +
        spatialOrganisation * 0.20 +
        lineQuality         * 0.15 +
        writingSpeed        * 0.20
      )
    : Math.round(
        (letterFormation     * 0.25 +
         alignment           * 0.20 +
         spatialOrganisation * 0.20 +
         lineQuality         * 0.15) / 0.80
      );

  const scores = {
    spelling, grammar, sentenceBoundaries, pastTenseUsage,
    letterFormation, alignment, spatialOrganisation, writingSpeed,
    writingSpeedAssessed,
    lineQuality, horizontal, vertical, mechanics,
  };

  console.log('[Score Engine] Calculated scores:', scores);

  return scores;
}

// ─── Probability engine (3-level: LOW / MODERATE / HIGH) ──────────────────────
export function calculateProbability(
  scores: Scores,
  rtiImprovement: boolean,
  wpm: number,
  grade: string = '6'
): string {
  const { spelling } = scores;
  const norm = getWpmNorm(grade);

  // Unmeasured writing speed must never count as a deficit — an unrecorded
  // "time taken" is missing data, not a clinical finding.
  const speedAssessed = scores.writingSpeedAssessed !== false && wpm > 0;
  const slowForGrade = speedAssessed && wpm < norm.min;

  // Severe fluency deficit (below 50% of norm min)
  const wpmPercent = norm.min > 0 ? (wpm / norm.min) * 100 : 100;
  const severeFluency = speedAssessed && wpmPercent < 50;

  // Count visual/mechanics impaired domains (score <= 60)
  const visualImpairedCount =
    (scores.letterFormation <= 60 ? 1 : 0) +
    (scores.alignment <= 60 ? 1 : 0) +
    (scores.lineQuality <= 60 ? 1 : 0) +
    (scores.spatialOrganisation <= 60 ? 1 : 0);

  // 1. Response to Intervention (RTI):
  // When a student has documented intervention in place and is showing positive progress,
  // formal diagnosis is deferred. Clinical probability is classified as MODERATE.
  if (rtiImprovement) {
    if (scores.grammar < 20 || (spelling <= 20 && severeFluency && visualImpairedCount >= 3)) {
      return 'HIGH';
    }
    return 'MODERATE';
  }

  // 2. HIGH: Severe grammar impairment (< 20)
  if (scores.grammar < 20) return 'HIGH';

  // 3. HIGH: Severe spelling + slow speed + multiple visual impairments
  if (spelling <= 30 && slowForGrade && visualImpairedCount >= 2) {
    return 'HIGH';
  }

  // 4. HIGH: Severe fluency + multiple visual impairments
  if (severeFluency && visualImpairedCount >= 2) {
    return 'HIGH';
  }

  // 5. HIGH: Severe fluency + low spelling
  if (severeFluency && spelling <= 40) {
    return 'HIGH';
  }

  // 6. MODERATE: Severe fluency alone (isolated speed restriction)
  if (severeFluency) {
    return 'MODERATE';
  }

  // 7. MODERATE: Spelling below grade + slow speed
  if (spelling < 70 && slowForGrade) {
    return 'MODERATE';
  }

  // Count impaired domains (score < 60 OR visual impairment >= 1)
  const impaired = [
    scores.spelling < 60,
    scores.grammar < 60,
    scores.sentenceBoundaries < 60,
    scores.pastTenseUsage < 60,
    visualImpairedCount >= 1,
    speedAssessed && scores.writingSpeed <= 60,
    scores.mechanics < 65 // Visual mechanics poor fallback
  ].filter(Boolean).length;

  if (impaired >= 3) return 'HIGH';
  if (impaired >= 1 || slowForGrade) return 'MODERATE';
  return 'LOW';
}

// ─── Actionable strategies library ───────────────────────────────────────────
export function getActionableStrategies(scores: Scores, rtiImprovement: boolean, grade: string = '6'): string[] {
  const strategies: string[] = [];
  const gradeNum = parseInt(String(grade).replace(/[^0-9]/g, '')) || 6;
  const isSecondary = gradeNum >= 7;

  if (rtiImprovement) {
    const notedAreas: string[] = [];
    if (scores.writingSpeedAssessed !== false && scores.writingSpeed <= 60) notedAreas.push('reduced writing speed');
    if (scores.spelling < 70) notedAreas.push('spelling discrepancies');
    if (scores.letterFormation < 70) notedAreas.push('letter formation irregularities');
    const areasStr = notedAreas.length > 0 ? notedAreas.join(', ') : 'handwriting mechanics';

    strategies.push(
      `Documented positive response to intervention is noted. While challenges in ${areasStr} warrant continued targeted support, formal diagnostic labeling is deferred while current progress continues.`
    );
  }

  if (scores.writingSpeedAssessed !== false && scores.writingSpeed <= 60) {
    strategies.push('Allow extended time on all written tasks and assessments to accommodate the slow writing speed without penalizing the student\'s ideas.');
    strategies.push('Encourage the use of typing or voice-to-text accommodations for longer essay assignments to remove the physical handwriting barrier.');
  }

  if (scores.spelling < 60) {
    strategies.push(isSecondary 
      ? 'Encourage targeted spelling self-editing checklists and assistive spell-checking tools during written work.'
      : 'Use a multi-sensory spelling approach: say, spell, write, and check each word.');
    strategies.push('Provide a personalised spelling and vocabulary reference list for regular practice.');
  }

  if (scores.letterFormation < 70) {
    strategies.push('Provide lined paper with raised tactile lines or clear guide rules to help the student maintain letter size and baseline.');
    strategies.push(isSecondary
      ? 'Incorporate ergonomic pen grips and brief graphomotor warm-up routines before extended writing sessions.'
      : 'Practice letter formation using large motor movements (whiteboard, motor trays) before moving to paper.');
  }

  if (scores.alignment < 70 && !strategies.some(s => s.includes('tactile lines'))) {
    strategies.push('Use structured margins and highlighted baselines to support consistent line orientation.');
  }

  if (scores.grammar < 60) {
    strategies.push('Use graphic organisers and sentence-combining frameworks to plan sentence structure before writing.');
  }

  if (strategies.length < 3) {
    if (rtiImprovement) {
      strategies.push('Continue current intervention strategies — positive progress is evident and should be monitored periodically.');
    } else {
      strategies.push('Implement classroom accommodations including structured writing templates and regular check-ins during long writing tasks.');
    }
  }

  return strategies.slice(0, 3);
}