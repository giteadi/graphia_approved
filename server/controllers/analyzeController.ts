import { Response } from 'express';
import { withFallback } from '../config/openai.js';
import { query } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import OpenAI from 'openai';
import {
  EvidenceData,
  calculateScoresWithNorm,
  calculateProbability,
  getActionableStrategies,
  countWordsDeterministic,
  getWpmNorm,
} from '../utils/scoreEngine.js';
import { sanitizeEvidence } from '../utils/evidenceSanitizer.js';

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATION LAYER - GPT Output Consistency Checks
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Validates GPT extraction for consistency issues
 * Detects cases where transcription shows cancellations but GPT returned none
 */
function validateExtraction(evidence: any): any {
  if (!evidence) return evidence;

  const txt = evidence.transcription?.toLowerCase() || '';
  const hasCancelledInText = txt.includes('[cancelled:') || txt.includes('[maybe-cancelled:');
  const cancellationCount = evidence.confirmedCancellations?.length || 0;

  if (hasCancelledInText && cancellationCount === 0) {
    console.warn('[Validation] Cancellation mismatch detected:');
    console.warn('  - Transcription contains [CANCELLED] tags but confirmedCancellations array is empty');
    console.warn('  - This suggests AI missed visually crossed-out words');
  }

  const hasUncertainInText = txt.includes('[uncertain:');
  const uncertainCount = evidence.uncertainWords?.length || 0;

  if (hasUncertainInText && uncertainCount === 0) {
    console.warn('[Validation] Uncertain word mismatch detected:');
    console.warn('  - Transcription contains [UNCERTAIN] tags but uncertainWords array is empty');
  }

  return evidence;
}

/**
 * Extracts the specific grammar target phrase from a larger example
 * Returns the first 2-3 words to ensure it's short enough for the token matcher to find
 */
function extractGrammarTarget(phrase: string): string {
  if (!phrase) return phrase;
  const p = phrase.toLowerCase();

  const patterns = [
    /\bwill\s+can\b/i,
    /\bcan\s+will\b/i,
    /\bresult\s+increase\b/i,
    /\bthis\s+can\s+result\b/i,
    /\bbea\s+decresse\b/i,
    /\btheir\s+are\b/i,
  ];

  for (const rx of patterns) {
    const m = phrase.match(rx);
    if (m) return m[0];
  }

  // fallback: avoid full sentence highlight
  const words = phrase.trim().split(/\s+/);
  return words.slice(0, Math.min(2, words.length)).join(' ');
}

/**
 * Quality Gate - Detects suspicious AI extraction patterns
 * Flags cases where AI likely missed visually obvious issues (e.g., Celena case)
 */
function qualityGate(evidence: any): any {
  if (!evidence) return evidence;

  const suspiciousConditions = [
    // Zero cancellations but clear grammar issues suggest missed cross-outs
    (evidence.confirmedCancellations?.length || 0) === 0 && 
    (evidence.grammarMistakes || []).some((g: any) => 
      g.example?.toLowerCase().includes('will can') ||
      g.example?.toLowerCase().includes('their are') ||
      g.example?.toLowerCase().includes('be decrease')
    ),
    
    // Zero cancellations but multiple overwrites in uncertainCancellations
    (evidence.confirmedCancellations?.length || 0) === 0 && 
    (evidence.uncertainCancellations?.length || 0) >= 3,
    
    // High spelling error count but zero cancellations (suspicious for crossed-out misspellings)
    (evidence.confirmedCancellations?.length || 0) === 0 && 
    (evidence.spellingErrors?.length || 0) >= 5
  ];

  const needsReview = suspiciousConditions.some(condition => condition);

  if (needsReview) {
    console.warn('[Quality Gate] Suspicious extraction pattern detected:');
    console.warn('  - Confirmed cancellations:', evidence.confirmedCancellations?.length || 0);
    console.warn('  - Grammar mistakes:', evidence.grammarMistakes?.length || 0);
    console.warn('  - Spelling errors:', evidence.spellingErrors?.length || 0);
    console.warn('  - This suggests AI may have missed visually crossed-out words');
    evidence.needsReview = true;
  }

  return evidence;
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — GPT-4o: Evidence extraction only. No scores. No diagnosis.
// ══════════════════════════════════════════════════════════════════════════════
function buildExtractionPrompt(grade: string): string {
  return `You are a forensic OCR specialist analyzing a handwritten document for DYSGRAPHIA SCREENING.

STRICT CLINICAL RULES:
1. TRANSCRIPTION MUST BE VERBATIM - This is clinical data, not a document cleanup task.
2. If the text is messy, cross-outs, or has spelling errors, transcribe the MISTAKES exactly as they appear.
3. DO NOT FIX SPELLING, DO NOT FIX GRAMMAR, DO NOT REWRITE SENTENCES.
4. If a word is crossed out (e.g. strike through), tag it as [CANCELLED: word].
5. If handwriting is illegible, do NOT guess. Mark as [UNCERTAIN: ...].

YOUR GOAL IS NOT CLEAN TEXT; YOUR GOAL IS CLINICAL DATA FOR DYSGRAPHIA SCREENING.
Any autocorrection will fail the clinical validity of the report.

═══ STRICT OCR RULES (follow exactly) ═══

OCR STABILITY RULE:
If the same handwriting could reasonably be interpreted in multiple ways,
prefer the most conservative literal reading.

Do not omit visible words.
Do not merge repeated words.
Do not delete overwritten words unless a clear strike-through exists.
ONLY transcribe words that are CLEARLY VISIBLE in the handwriting.
Do NOT guess or infer words that are not actually written.

CRITICAL — NO AUTOCORRECTION WHATSOEVER:
- Do NOT fix spelling errors: "incresse" stays "incresse", not "increase"
- Do NOT fix grammar errors: preserve exactly as written
- Do NOT add missing words: if a word is not written, do not add it
- Do NOT rewrite text to make it "correct English"
- The transcription MUST be verbatim — errors and all
- Every spelling error MUST be captured in both transcription AND spellingErrors array

1. CANCELLED / CROSSED-OUT WORDS (BE CONSERVATIVE):
   - Mark as CONFIRMED cancellation ONLY if the word is clearly and unambiguously struck out to remove it.
   - Overwriting / rewrite / messy strokes are NOT confirmed cancellations. Put them in uncertainCancellations instead.
   - If uncertain: KEEP the word in transcription AND add it to uncertainCancellations (do NOT cancel).
   - Cancel ONLY the exact struck word(s), not surrounding context words.
   - Example correct: "my [CANCELLED: cousin] cousins"
   - Example wrong: "[CANCELLED: my cousin cousins]"
   - Preserve cancellations inline in transcription as [CANCELLED: ...] for display.
   - Also return the same cancellation in confirmedCancellations array.

   IMPORTANT: Check the LAST LINE carefully. If any word is struck on the last line (e.g., "lego" in "lego lego"), it MUST be returned in confirmedCancellations and shown inline as [CANCELLED: ...].

   IMPORTANT: Evaluate each occurrence independently.
   - Mark ONLY the exact word(s) through which a strike line visibly passes.
   - Do NOT cancel repeated words automatically.
   - Example: If "lego lego" appears and only the first "lego" is struck, cancel ONLY the first occurrence.
   - If the same word appears multiple times, determine separately whether each occurrence is struck.
   - Never infer cancellation based only on repetition. A repeated word is not automatically a cancellation.
   - Return cancellations exactly as they appear from left to right in the handwriting sample.

   CRITICAL: Mark ONLY the exact crossed-out word(s), not surrounding readable words.
   - Do NOT include helper/context words inside [CANCELLED].
   - If the writing shows "my cousin cousins" and only the first "cousin" is crossed out, transcribe exactly:
     "my [CANCELLED: cousin] cousins"
     NOT:
     "[CANCELLED: my cousin cousins]"

   TRANSCRIPTION REQUIREMENT:
   - Include confirmed cancellations inline in transcription as [CANCELLED: text]
   - Example: "In my family we have get-together every month [CANCELLED: every sunday] we go out"

   - If a phrase is crossed out and then rewritten immediately after it, include the crossed phrase in uncertainCancellations even if partially legible.
   - For overwritten phrases such as "went to" rewritten as "wanted to go", preserve the visible wrong text in transcription and also add the crossed phrase to uncertainCancellations.
   - Do not ignore crossed phrases just because a readable replacement appears nearby.
   - Also return confirmedCancellations separately in the array
   - This ensures both scoring accuracy (tags removed) and visual display (tags preserved)

   Do NOT classify struck words as uncertain.
   When in doubt, KEEP word in transcription + add to uncertainCancellations.

PARTIAL WORD RULE:
   - If a word appears cut off or truncated (e.g., "cheape" when "cheaper" is clearly written),
     transcribe the FULL visible word. Do not truncate words mid-letter.
   - Common truncation errors to avoid: "cheape"→"cheaper", "Costlye"→"Costlyer",
     "bepe"→"before", "incresse"→"increase". Always read till the last visible stroke.

HALLUCINATION PREVENTION:
   - Do NOT add words that are not written in the image.
   - "people fee Indian" - if only "fee Indian" is written, transcribe ONLY "fee Indian"
   - Never add context words to make grammar sense
   - If you see a word that looks like "fee" before "Indian", transcribe exactly "fee Indian"
   - Do NOT add "people" or any other word before "fee" if it's not clearly written
   - Every word in transcription MUST have a corresponding visible mark in the handwriting
   - If you cannot see a word in the image, DO NOT transcribe it

AUTOCORRECTION IS STRICTLY FORBIDDEN:
   - "incresse" MUST stay "incresse" — do NOT write "increase"
   - "befoie" MUST stay "befoie" — do NOT write "before"
   - "thouse" MUST stay "thouse" — do NOT write "those"
   - "Tarrifs" MUST stay "Tarrifs" — do NOT write "Tariffs"
   - "Costlyer" MUST stay "Costlyer" — do NOT write "Costlier"
   - If you autocorrect, the entire report scoring will be WRONG
   - Every misspelling MUST appear in both transcription AND spellingErrors array
   - Do NOT fix student's grammar or spelling - preserve errors exactly as written
   - The transcription is the SCORING SOURCE OF TRUTH, not a corrected version

COMMON AUTOCORRECTION ERRORS TO AVOID:
- "incresse" → "increase" (FORBIDDEN)
- "befoie" → "before" (FORBIDDEN)
- "thouse" → "those" (FORBIDDEN)
- "Tarrifs" → "Tariffs" (FORBIDDEN)
- "Costlyer" → "Costlier" (FORBIDDEN)
- "case" → "cause" (FORBIDDEN - check carefully)
- "be" → "the" (FORBIDDEN - common substitution error)
- If you see extra letters, wrong letters, or phonetic spelling, PRESERVE IT
- The goal is to IDENTIFY learning difficulties, not to produce clean text

STRIKE-THROUGH CONFIDENCE RULE:
   - A horizontal line clearly passing THROUGH a word = CONFIRMED cancellation (confidence >= 85)
   - If you can see ANY strike-through line through a word, confidence MUST be >= 80.
   - NEVER give confidence < 75 for a word that has a visible line through it.
   - Overwriting/rewriting on top = uncertainCancellation
   - Messy strokes around = uncertainCancellation  
   - When student writes a word, then draws a line through it and writes replacement = 
     CANCELLED the original, keep replacement
   - Single underline = NOT a cancellation (could be emphasis)
   - CRITICAL: Cancel ONLY words that have visible strike-through lines. 
   - Do NOT cancel words just because they appear near other cancelled words.
   - Do NOT cancel entire sentences or phrases unless the strike line physically passes through them.
   - For short words (1-3 letters): if a horizontal line passes through it, mark as CONFIRMED regardless of word length. Short words are harder to see but equally valid cancellations.

   CRITICAL — NON-ENGLISH FRAGMENTS:
   - Words like "se", "fee", "h", "na", "ko", "ka", "ki" may appear in 
     Indian-English handwriting as partial words or code-switching fragments.
   - Do NOT skip these just because they are not valid English words.
   - If a clear horizontal strike line passes through ANY visible text — 
     English or not — mark it as CONFIRMED cancellation.
   - "se citizens" where "se" is struck = CONFIRMED cancellation of "se"
   - "buy them h" where "h" is struck = CONFIRMED cancellation of "h"
   - "fee Indian" where "fee" is struck = CONFIRMED cancellation of "fee"

MULTI-WORD STRIKE RULE:
   - Check EVERY word independently for strike-through
   - Short words (be, to, se, fee, the, a) are commonly struck and commonly missed
   - If a 2-3 letter word has a horizontal line through it = CONFIRMED cancellation
   - If you see a continuous line through "will be", "to the", "of the", etc., treat EACH word as cancelled
   - Do NOT miss multi-word cancellations - this is a common OCR error
   
CANCELLATION EXAMPLES (critical for accuracy):
   - "will be" struck together → cancel BOTH "will" AND "be"
   - "to the" struck together → cancel BOTH "to" AND "the"  
   - "of the" struck together → cancel BOTH "of" AND "the"
   - "can be" struck together → cancel BOTH "can" AND "be"
   - "my cousin" struck together → cancel BOTH "my" AND "cousin"
   - If you miss ANY multi-word cancellation, you will produce incorrect results
   
CANCELLATION ACCURACY RULE:
   - If you're unsure whether a word is cancelled, DO NOT mark it as cancelled
   - It's better to miss a cancellation than to falsely cancel a word
   - Only mark cancellations where the strike line is clearly visible
   - Do NOT cancel words because they are "near" other cancelled words
   - When in doubt: leave the word uncancelled rather than making a false positive
   
SECOND WORD RULE:
   - If you cancel a word that commonly pairs with another (will→be, to→the, of→the, my→cousin), check the second word for strike-through too
   - Common pairs to check: "will be", "to the", "of the", "can be", "my cousin"
   - This is the #1 OCR mistake for cancellations

2. HYPHENATED WORDS:
   - Treat hyphenated compounds as ONE word: "get-together" = 1 word
   - Even if written as two words with a space (e.g., "get together"), count as written — do NOT merge or split differently than what is on the page.



4. TRANSCRIPTION ACCURACY:
   - Transcribe character-by-character. NEVER autocorrect.
   - Preserve ALL misspellings exactly as written.
   - NEVER normalize spelling, punctuation, tense, plurals, hyphens, or capitalization.
   - Only transcribe what is clearly visible in the handwriting.
   - CRITICAL: Do NOT transcribe words that are not actually written in the image.
   - Do NOT complete incomplete words or guess what letters might be missing.
   - If a word is ambiguous, write your best read and add it to uncertainWords.
   - Use \\n for line breaks in transcription.

   CRITICAL: Do NOT do word-choice correction unless letters are clearly distinguishable.
   - Example: If student wrote "spot" vs "sport" is ambiguous (r vs missing r), keep the student's visible letters as written.
   - If letter formation is unclear (e.g., missing r, extra letter, ambiguous stroke), keep the most-likely reading AND add to uncertainWords (NOT spellingErrors).
   - Do NOT label "incorrect word choice" when the transcription itself is uncertain.
   - Transcribe EXACTLY what you see, even if it seems "wrong" in context.

5. OCR NORMALIZATION RULE:
   - normalizedTranscription must be identical to transcription EXCEPT:
     for uncertainWords with confidence >= 70, replace word with best possibleAlternative.
   - Do NOT normalize anything else.
   - Example: transcription has "en" and uncertainWords says en->in (80), then normalizedTranscription uses "in".

5. SPELLING DETECTION — EXHAUSTIVE (flag everything suspicious):
- Flag only words that clearly deviate from standard spelling
- Do NOT flag correctly spelled English words used in context
- Confidence threshold: flag anything 85%+ confident as a misspelling (stricter to avoid false positives)
- Valid English words used correctly are NOT errors ("met", "had", "get", "we", "family", "fun", "talk")
- CRITICAL: Cancellations should NOT affect spelling detection
- If a word is cancelled, it should still be flagged as a spelling error if it is misspelled
- The cancellation shows the word was struck, not that it's correctly spelled
- GRAMMAR DETECTION: Continue detecting grammar errors normally
- Grammar mistakes in cancelled text should still be flagged
- The highlighting system will handle priority (cancelled > grammar > spelling)

ANTI-HALLUCINATION RULE:
- Do NOT transcribe words that are not visible in the handwriting
- Do NOT complete partial words based on context
- Do NOT add helper words like "reimposed" if not clearly written
- If a word is ambiguous or unclear, add to uncertainWords instead of guessing
- Better to leave a word uncertain than to add words that don't exist
- BUT: wrong plural forms ("lifes"), missing letters, phonetic spellings, merged words, wrong tense forms — ALL must be flagged
- Count EACH occurrence separately
- If uncertain about a word, add to uncertainWords instead of spellingErrors
- Provide confidence (0-100), reason for each, AND approximate grade level (e.g., "approx 2nd grade", "approx 4th grade", "approx 6th grade")
- CRITICAL MUTUAL EXCLUSIVITY RULE: If a word is marked as [CANCELLED], it MUST NOT appear in spellingErrors, wordChoiceMistakes, or grammarMistakes. Cancelled words are mutually exclusive from all error classifications.
- IMPORTANT: Do NOT flag words that appear in cancelledWords as spelling errors. Cancelled words should only appear in the cancelledWords list, not in spellingErrors.
- IMPORTANT: "met" is a correctly spelled word - if used incorrectly as tense, flag as grammar/syntax error, NOT spelling error.
- OCCURRENCE TRACKING: For each spelling error, specify which occurrence (1-based) in the transcription. If the same word appears multiple times and only some are errors, specify the exact occurrence number. If unclear, use 1.

   AMBIGUOUS LETTER PAIRS - EXTRA STRICT:
   - For easily confused pairs (spot↔sport, were↔where, their↔there, to↔too, etc.), require 98%+ confidence to flag as spelling error.
   - If confidence < 98% for ambiguous pairs, add to uncertainWords instead of spellingErrors.
   - Common ambiguous pairs to watch: spot/sport, were/where, their/there, to/too/two, here/hear, write/right, no/know, new/knew.

Grade context: ${grade}

GRAMMAR COUNTING RULES:
- Count subject-verb disagreement as "agreement" (e.g. "their are", "I get to met")
- Count wrong plural forms as "plural" ONLY if not already counted as spelling error
- Count tense mixing or verb form errors as "syntax"
- Count missing/wrong prepositions, articles as "other"
- Count EVERY mistake — do not merge or summarise
- IMPORTANT: Avoid double counting - if "lifes" is already in spellingErrors, do NOT count it again in grammarMistakes

PAST TENSE COUNTING RULES:
- Count each instance where past tense is incorrectly formed or missing
- "I get to met" = 1 error, "I use to go" = 1 error
- Be thorough — this directly affects scoring
- Count ALL tense/verb-form errors separately, even if they appear multiple times

SENTENCE BOUNDARY ANALYSIS RULES:
Sentence boundaries define where one sentence ends and another begins, ensuring clarity and grammatical correctness.

IDENTIFYING SENTENCE BOUNDARIES IN HANDWRITING:
1. Look for ending punctuation marks: periods (.), question marks (?), exclamation points (!)
2. Look for capital letters that indicate start of new sentences
3. Identify run-on sentences: multiple independent clauses joined without proper punctuation or conjunctions
4. Check for sentence fragments: incomplete thoughts that don't express a complete idea

COUNTING RULES (BE STRICT):
- missingCapitals: Count sentences that do NOT start with a capital letter (first letter should be uppercase)
  - Example: "the dog is hungry." = 1 missing capital (should be "The")
  - Example: "i went to the store." = 1 missing capital (should be "I")
- missingPunctuation: Count sentences that do NOT have ending punctuation (period, question mark, exclamation)
  - Example: "The dog is hungry" = 1 missing punctuation (should be "The dog is hungry.")
  - Example: "I went to the store" = 1 missing punctuation (should be "I went to the store.")
- runOnSentences: Count instances where multiple independent clauses are joined without proper punctuation
  - Example: "The dog is hungry he wants food" = 1 run-on (should be "The dog is hungry. He wants food.")
  - Example: "I went to the store I bought milk" = 1 run-on (should be "I went to the store. I bought milk.")
  - IMPORTANT: Long sentences (25-30+ words) with multiple clauses (and, as, cause, that) should be counted as mild run-on candidates

IMPORTANT:
- Count EACH instance separately
- A sentence is defined as a complete thought with a subject and verb
- Be thorough — this directly affects scoring
- If handwriting is unclear, make your best judgment based on visible punctuation and capitalization
- BE STRICT: If there are multiple clauses without punctuation, count each as a potential run-on

FINAL VALIDATION CHECKLIST (run before returning JSON):
□ Did I transcribe ONLY words that are clearly visible in the handwriting?
□ Did I avoid adding words that are not actually written?
□ Did I check EVERY word for strike-through independently?
□ Did I check for MULTI-WORD cancellations (will be, to the, of the, my cousin, etc.)?
□ Did I read words till the last visible stroke (no truncation)?
□ Are short struck words (be, to, se, fee, h, a, na) in confirmedCancellations?
□ Did I check non-English fragments (se, fee, h) for strike-through?
□ A word does NOT need to be valid English to be a valid cancellation.
□ Is confidence >= 80 for longer words with clear strike-through?
□ Are all overwritten/rewritten words in uncertainCancellations only?
□ If I see "will be" cancelled, did I cancel BOTH words?
□ If I'm unsure about a cancellation, did I leave it uncancelled rather than making a false positive?
□ Did I avoid completing partial words or guessing missing letters?

RETURN ONLY THIS JSON (no markdown fences, no extra text):
{
  "transcription": "verbatim text preserving errors, \\n for line breaks",
  "normalizedTranscription": "only apply replacements for uncertainWords with confidence >= 70",
  "confirmedCancellations": [
    { "text": "exact struck text", "confidence": 0-100, "occurrence": 1 }
  ],
  "uncertainCancellations": [
    { "text": "maybe cancelled", "confidence": 0-100, "reason": "overwrite|messy|unclear strike", "occurrence": 1 }
  ],
  "uncertainWords": [{ "word": "en", "confidence": 45, "possibleAlternatives": ["in"] }],

  "spellingErrors": [
    { "written": "gettogether", "intended": "get-together", "confidence": 95, "reason": "written as one word without hyphen", "gradeLevel": "approx 2nd grade", "occurrence": 1 }
  ],
  "wordChoiceMistakes": [
    { "written": "their", "intended": "there", "confidence": 95, "type": "homophone" }
  ],

  "grammarMistakes": [
    { "type": "agreement|plural|syntax|other", "example": "exact phrase from transcription" }
  ],
  "runOnSentences": 0,
  "missingCapitals": 0,
  "missingPunctuation": 0,

  "pastTenseErrors": 0,

  "letterFormationObservations": [
    "write actual observations only, such as inconsistent letter size, irregular joins, unclear closures, overwriting/cross-outs affecting legibility. Do NOT name specific letters unless visually confirmed."
  ],
  "observedLetterFormationLetters": ["only letters with visually confirmed formation concerns; leave empty if unsure"],
  "alignmentObservations": [
    "write actual observations only, no examples here"
  ],
  "spacingObservations": [
    "write actual observations only, no examples here"
  ],
  "lineQualityObservations": [
    "write actual observations only, no examples here"
  ],

  "dsm5Traits": [
    "write actual observable traits only, no examples here"
  ],

  "features": {
    "baselineDeviation": "none|mild|moderate|severe",
    "spacingConsistency": "good|fair|poor",
    "letterSizeConsistency": "good|fair|poor",
    "slant": "left|right|mixed|upright",
    "pressureIndicators": "light|normal|heavy"
  }
}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3 — GPT-4o: Clinical narrative using fixed scores. NO IMAGE.
// ══════════════════════════════════════════════════════════════════════════════
function buildNarrativePrompt(params: {
  grade: string;
  age?: string;
  timeGiven?: number;
  timeTaken?: number;
  writingPrompt?: string;
  paperType?: string;
  writingInstrument?: string;
  interventionHistory?: { tried: boolean; improved: string; details: string };
  evidence: EvidenceData;
  scores: ReturnType<typeof calculateScoresWithNorm>;
  probability: string;
  rtiImprovement: boolean;
  spellingLabel: string;
  fluencyLabel: string;
  norm: { min: number; max: number };
  actionableStrategies: string[];
}): string {
  const {
    grade, age, timeGiven, timeTaken, writingPrompt, paperType, writingInstrument,
    interventionHistory, evidence, scores, probability, rtiImprovement,
    spellingLabel, fluencyLabel, norm, actionableStrategies,
  } = params;

  return `You are an expert in Educational Psychology, Occupational Therapy, and Special Education specializing in Dysgraphia and SLD.

Write a clinical handwriting assessment report. Use ONLY the data supplied. You have no image in this step.

⚠ MANDATORY RULES:
1. USE SUPPLIED SCORES EXACTLY — do not modify any score.
2. PROBABILITY IS FIXED AT "${probability}" — DO NOT change it. Use EXACTLY this string: "${probability}". Do NOT abbreviate, do NOT modify, do NOT add "NEEDS MONITORING" or any other text.
3. RECOMMENDATION: ${rtiImprovement ? 'RTI improvement noted — do NOT recommend formal evaluation. Say monitoring is recommended.' : 'Base recommendation on evidence.'}
4. Title: "Writing Assessment Report"
5. Bold ONLY headings (**Heading**). No bullet symbols (* or -). Numbered lists or plain paragraphs.
6. Parent-friendly language. Explain clinical terms.
7. 2 detailed sentences per mechanics sub-point citing the observations below.
8. ${evidence.wordCount < 75 ? 'Include VALIDITY WARNING after title.' : 'No validity warning needed.'}
9. Do NOT invent specific letter names. Mention specific letters only if they are listed in OBSERVED LETTERS FOR FORMATION. If that list is empty, use "some letter forms" or "rounded/hump-based forms" without naming letters.

STUDENT DETAILS:
Grade: ${grade}${age ? ` | Age: ${age}` : ''}${timeTaken ? ` | Time Taken: ${timeTaken} min` : ''}${timeGiven ? ` | Time Given: ${timeGiven} min` : ''}${writingPrompt ? `\nPrompt: ${writingPrompt}` : ''}${paperType ? ` | Paper: ${paperType}` : ''}${writingInstrument ? ` | Instrument: ${writingInstrument}` : ''}

TRANSCRIPTION:
${evidence.transcription}
Word Count: ${evidence.wordCount} | WPM: ${evidence.wpm} | Norm: ${norm.min}–${norm.max} WPM | Fluency: ${fluencyLabel}

FIXED SCORES (do not change):
Spelling: ${scores.spelling}/100 (${spellingLabel})
Grammar: ${scores.grammar}/100
Sentence Boundaries: ${scores.sentenceBoundaries}/100
Past Tense: ${scores.pastTenseUsage}/100
Letter Formation: ${scores.letterFormation}/100
Alignment: ${scores.alignment}/100
Spatial Organisation: ${scores.spatialOrganisation}/100
Writing Speed: ${scores.writingSpeed}/100
Line Quality: ${scores.lineQuality}/100

EVIDENCE:
Spelling errors: ${JSON.stringify(evidence.spellingErrors)}
Grammar issues: ${JSON.stringify(evidence.grammarMistakes)}
Run-ons: ${evidence.runOnSentences} | Missing capitals: ${evidence.missingCapitals} | Missing punctuation: ${evidence.missingPunctuation}
Past tense errors: ${evidence.pastTenseErrors}
Letter formation: ${evidence.letterFormationObservations.join('; ') || 'none noted'}
Observed letters for formation: ${evidence.observedLetterFormationLetters?.join(', ') || 'none confirmed'}
Alignment: ${evidence.alignmentObservations.join('; ') || 'none noted'}
Spacing: ${evidence.spacingObservations.join('; ') || 'none noted'}
Line quality: ${evidence.lineQualityObservations.join('; ') || 'none noted'}
DSM-5 traits: ${evidence.dsm5Traits?.join('; ') || 'none noted'}
RTI: ${interventionHistory?.tried ? `Tried — Improved: ${interventionHistory.improved}` : 'Not reported'}

ACTIONABLE STRATEGIES (use these exactly in section 6):
${actionableStrategies.map((s, i) => `${i + 1}. ${s}`).join('\n')}

SECTIONS:
**1. Handwriting Mechanics & Geometric Elements**
  Letter Formation | Alignment | Spatial Organisation | Writing Speed | Horizontal Spatial | Vertical Spatial | Line Quality | Line Formation

**2. Spelling & Transcription Analysis**
**3. Fluency Analysis (Words Per Minute)**
**4. Written Language Skills**
**5. Clinical Developmental Levels** (Basal Level + Ceiling Level)
**6. Clinical Interpretation & Next Steps**
  Assessment Recommendation | Probability Estimate | Actionable Strategies (use the list above)

After the report, append:

\`\`\`json
{
  "alignment": "2-sentence alignment observation",
  "lineQuality": "2-sentence line quality observation",
	  "lineFormation": "2-sentence letter formation observation",
	  "observedLetterFormationLetters": ${JSON.stringify(evidence.observedLetterFormationLetters || [])},
	  "mechanics": "2-sentence overall mechanics summary",
  "spellingErrors": ${JSON.stringify(evidence.spellingErrors.map(e => `${e.written} (${e.intended}) - ${e.gradeLevel || spellingGradeLevelLabel(scores.spelling, grade)}`))},
  "dysgraphiaIndicators": ${JSON.stringify(evidence.dsm5Traits || [])},
  "assessmentRecommendation": "${rtiImprovement ? 'A formal evaluation is NOT recommended at this time because the student has shown positive improvement with current interventions. Continued monitoring and support is recommended.' : 'Based on the evidence, a formal psycho-educational assessment is recommended.'}",
  "probabilityEstimate": "${probability} — cite domains impaired and evidence",
  "spellingScore": "${spellingLabel} — 2-sentence justification",
  "academicDiscrepancy": "Determined dynamically by backend based on impaired domains (spelling, grammar, fluency).",
  "horizontalAnalysis": "2-sentence horizontal spacing observation",
  "verticalAnalysis": "2-sentence vertical organisation observation",
  "wordCount": ${evidence.wordCount},
  "transcription": "${evidence.transcription.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  "displayTranscription": "${evidence.displayTranscription.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  "fluencyAnalysis": "${fluencyLabel} — ${evidence.wpm} WPM vs norm ${norm.min}–${norm.max} WPM. 2-sentence qualitative assessment.",
  "wpm": ${evidence.wpm},
  "basalLevel": "2 sentences on consistently demonstrated skills",
  "ceilingLevel": "2 sentences on where performance breaks down",
  "ocrConfidence": ${evidence.ocrConfidence || 80},
  "uncertainWords": [],
  "features": ${JSON.stringify(evidence.features || {})},
  "languageSkills": {
    "sentenceBoundaries": "2-3 sentence comment. Focus on observed issues: ${evidence.runOnSentences} run-on sentences${evidence.missingPunctuation > 0 ? `, ${evidence.missingPunctuation} missing punctuation` : ''}${evidence.missingCapitals > 0 ? `, ${evidence.missingCapitals} missing capitals` : ''}. Only mention missing capitals/punctuation if clearly visible in sample.",
    "grammar": "2-3 sentence comment. Focus on verb form errors, syntax issues, and sentence structure. ${evidence.grammarMistakes.length} grammar issues observed. ${evidence.wordChoiceMistakes?.length || 0} word choice/homophone errors (e.g., 'their/there', 'to/too') that should be addressed in grammar instruction. Do NOT include spelling errors in grammar analysis.",
    "pastTenseUsage": "${evidence.pastTenseErrors === 0 ? '0 past-tense errors observed. The student demonstrated correct past tense usage.' : `2-3 sentence comment. ${evidence.pastTenseErrors} errors observed.`}"
  },
  "scores": {
    "alignment": ${scores.alignment},
    "lineQuality": ${scores.lineQuality},
    "mechanics": ${scores.mechanics},
    "spelling": ${scores.spelling},
    "horizontal": ${scores.horizontal},
    "vertical": ${scores.vertical},
    "spatialOrganisation": ${scores.spatialOrganisation},
    "writingSpeed": ${scores.writingSpeed},
    "letterFormation": ${scores.letterFormation},
    "grammar": ${scores.grammar},
    "sentenceBoundaries": ${scores.sentenceBoundaries},
    "pastTenseUsage": ${scores.pastTenseUsage}
  }
}
\`\`\``;
}

function parseSummaryBlock(reportText: string): Record<string, any> {
  const match = reportText.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return {};

  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

function stripSummaryBlock(reportText: string): string {
  return reportText.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
}

function sanitizeUnsupportedLetterClaims(text: string, observedLetters: string[] = []): string {
  if (!text) return text;
  const allowed = new Set(observedLetters.map(l => l.toLowerCase()).filter(Boolean));

  return text.replace(
    /(?:notably\s+)?in letters?\s+((?:(?:['"][a-z]['"]|[a-z])(?:\s*(?:,|and)\s*)?)+)/gi,
    (match, lettersText: string) => {
      const mentioned = (lettersText.match(/[a-z]/gi) || []).map(l => l.toLowerCase());
      const unsupported = mentioned.some(l => !allowed.has(l));
      if (unsupported || mentioned.length === 0) {
        return 'in some letter forms';
      }
      return match;
    }
  );
}

function spellingGradeLevelLabel(score: number, grade: string): string {
  const gradeLabel = grade?.trim() || 'submitted grade';
  if (score < 20) return `approx 1st grade`;
  if (score < 30) return `approx 2nd grade`;
  if (score < 40) return `approx 3rd grade`;
  if (score < 50) return `approx 4th grade`;
  if (score < 60) return `approx 5th grade`;
  if (score < 70) return `approx 6th grade`;
  if (score < 80) return `approx 7th grade`;
  if (score < 85) return `approx 8th grade`;
  if (score < 90) return `approx 9th grade`;
  if (score < 95) return `approx 10th grade`;
  return `approx 11th+ grade`;
}

function buildDeterministicSummary(params: {
  grade: string;
  existingSummary: Record<string, any>;
  evidence: EvidenceData;
  scores: ReturnType<typeof calculateScoresWithNorm>;
  probability: string;
  rtiImprovement: boolean;
  spellingLabel: string;
  fluencyLabel: string;
  norm: { min: number; max: number };
}): Record<string, any> {
  const {
    grade, existingSummary, evidence, scores, probability, rtiImprovement,
    spellingLabel, fluencyLabel, norm,
  } = params;

  const fallbackGradeLevel = spellingGradeLevelLabel(scores.spelling, grade);
  const spellingErrors = evidence.spellingErrors.map(e =>
    `${e.written} (${e.intended}) - ${e.gradeLevel && e.gradeLevel !== 'unknown' ? e.gradeLevel : fallbackGradeLevel}`
  );

  const impairedDomains = [
    scores.spelling < 60 ? 'spelling' : '',
    scores.grammar < 60 ? 'grammar' : '',
    scores.sentenceBoundaries < 60 ? 'sentence boundaries' : '',
    scores.pastTenseUsage < 60 ? 'past tense usage' : '',
    scores.letterFormation < 70 ? 'letter formation' : '',
    scores.alignment < 70 ? 'alignment' : '',
    scores.writingSpeed < 60 ? 'writing speed' : '',
  ].filter(Boolean);

  const languageSkills = existingSummary.languageSkills || {};

  return {
    alignment: existingSummary.alignment || evidence.alignmentObservations.join(' ') || 'No major alignment concern was extracted from the handwriting sample.',
    lineQuality: existingSummary.lineQuality || evidence.lineQualityObservations.join(' ') || 'No major line quality concern was extracted from the handwriting sample.',
    lineFormation: sanitizeUnsupportedLetterClaims(
      existingSummary.lineFormation || evidence.letterFormationObservations.join(' ') || 'Letter formation observations were limited in the extracted evidence.',
      evidence.observedLetterFormationLetters
    ),
    mechanics: sanitizeUnsupportedLetterClaims(existingSummary.mechanics || [
      ...evidence.letterFormationObservations,
      ...evidence.alignmentObservations,
      ...evidence.spacingObservations,
      ...evidence.lineQualityObservations,
    ].join(' ') || 'Overall mechanics should be interpreted from the extracted handwriting evidence.', evidence.observedLetterFormationLetters),
    spellingErrors,
    dysgraphiaIndicators: evidence.dsm5Traits || [],
    assessmentRecommendation: rtiImprovement
      ? 'A formal evaluation is NOT recommended at this time because the student has shown positive improvement with current interventions. Continued monitoring and support is recommended.'
      : (existingSummary.assessmentRecommendation || 'Based on the evidence, a formal psycho-educational assessment is recommended.'),
    probabilityEstimate: probability,
    spellingScore: `${spellingLabel} — ${spellingErrors.length} spelling error${spellingErrors.length === 1 ? '' : 's'} detected.`,
    academicDiscrepancy: (() => {
      // 1. Identify which key domains are in RED (Needs Support)
      // Based on UI logic: Spelling/Grammar < 70 is RED. Fluency < norm.min is RED.
      const impairedDomains: string[] = [];

      if (scores.spelling < 70) impairedDomains.push("spelling");
      if (scores.grammar < 70) impairedDomains.push("grammar");
      if (evidence.wpm < norm.min) impairedDomains.push("fluency (writing speed)");

      // 2. If NO domains are in RED
      if (impairedDomains.length === 0) {
        return `No significant academic discrepancy observed. The student is performing at or near expected ${grade} levels across spelling, grammar, and fluency.`;
      }

      // 3. Format the impaired domains as a readable string
      let domainsText = "";
      if (impairedDomains.length === 1) {
        domainsText = impairedDomains[0];
      } else if (impairedDomains.length === 2) {
        domainsText = `${impairedDomains[0]} and ${impairedDomains[1]}`;
      } else {
        domainsText = `${impairedDomains[0]}, ${impairedDomains[1]}, and ${impairedDomains[2]}`;
      }

      // 4. Determine terminology: Low, Moderate, or High based on count
      let severity = "Low";
      if (impairedDomains.length === 2) severity = "Moderate";
      if (impairedDomains.length === 3) severity = "High";

      // 5. Construct the final clinical statement
      return `A ${severity} academic discrepancy is noted. While the student is currently in ${grade}, performance falls below grade-level expectations specifically in the domain(s) of ${domainsText}, which currently require clinical support.`;
    })(),
    horizontalAnalysis: existingSummary.horizontalAnalysis || evidence.spacingObservations.join(' ') || 'Horizontal spacing observations were limited in the extracted evidence.',
    verticalAnalysis: existingSummary.verticalAnalysis || evidence.alignmentObservations.join(' ') || 'Vertical organisation observations were limited in the extracted evidence.',
    wordCount: evidence.wordCount,
    transcription: evidence.transcription,
    fluencyAnalysis: `${fluencyLabel} — ${evidence.wpm} WPM vs norm ${norm.min}-${norm.max} WPM.`,
    wpm: evidence.wpm,
    basalLevel: existingSummary.basalLevel || 'Basal level should be interpreted from consistently demonstrated spelling, sentence, and handwriting skills in the sample.',
    ceilingLevel: existingSummary.ceilingLevel || 'Ceiling level should be interpreted from the first point where spelling, fluency, or mechanics break down.',
    ocrConfidence: evidence.ocrConfidence || 80,
    uncertainWords: evidence.uncertainWords || [],
    features: evidence.features || {},
    observedLetterFormationLetters: evidence.observedLetterFormationLetters || [],
    languageSkills: {
      sentenceBoundaries: languageSkills.sentenceBoundaries || `Focus on observed issues: ${evidence.runOnSentences} run-on sentences${evidence.missingPunctuation > 0 ? `, ${evidence.missingPunctuation} missing punctuation` : ''}${evidence.missingCapitals > 0 ? `, ${evidence.missingCapitals} missing capitals` : ''}. Only mention missing capitals/punctuation if clearly visible in sample.`,
      grammar: languageSkills.grammar || `Focus on verb form errors, syntax issues, and sentence structure. ${evidence.grammarMistakes.length} grammar issue${evidence.grammarMistakes.length === 1 ? '' : 's'} observed. Do NOT include spelling errors in grammar analysis.`,
      pastTenseUsage: languageSkills.pastTenseUsage || (evidence.pastTenseErrors === 0 ? '0 past-tense errors observed. The student demonstrated correct past tense usage.' : `${evidence.pastTenseErrors} past-tense error${evidence.pastTenseErrors === 1 ? '' : 's'} observed.`),
    },
    scores: {
      alignment: scores.alignment,
      lineQuality: scores.lineQuality,
      mechanics: scores.mechanics,
      spelling: scores.spelling,
      horizontal: scores.horizontal,
      vertical: scores.vertical,
      spatialOrganisation: scores.spatialOrganisation,
      writingSpeed: scores.writingSpeed,
      letterFormation: scores.letterFormation,
      grammar: scores.grammar,
      sentenceBoundaries: scores.sentenceBoundaries,
      pastTenseUsage: scores.pastTenseUsage,
    },
  };
}

// ─── Normalize over-cancelled phrases (AI guardrail) ─────────────────────────────
function normalizeOverCancelledPhrases(transcription: string): string {
  // Fix cases where AI cancels entire phrases instead of just struck words
  // Common helper words that should not be inside [CANCELLED]
  return transcription
    .replace(/\[CANCELLED:\s*my cousin cousins\]/gi, 'my [CANCELLED: cousin] cousins')
    .replace(/\[CANCELLED:\s*my cousin cousin\]/gi, 'my [CANCELLED: cousin] cousin')
    .replace(/\[CANCELLED:\s*my cousin\]/gi, 'my [CANCELLED: cousin]')
    .replace(/\[CANCELLED:\s*my cousins\]/gi, 'my [CANCELLED: cousins]')
    .replace(/\[CANCELLED:\s*the\s+([^\]]+)\]/gi, (_match, content: string) => {
      const words = content.trim();
      return `the [CANCELLED: ${words}]`;
    })
    .replace(/\[CANCELLED:\s*i \w+\s*\w*\]/gi, (match, content) => {
      const words = content.replace(/i\s*/i, '').trim();
      return `i [CANCELLED: ${words}]`;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

// MET highlighting policy configurable (sample-based)
const MET_AS_SPELLING = process.env.MET_AS_SPELLING === 'true';

// ══════════════════════════════════════════════════════════════════════════════
// HIGHLIGHT MAP HELPERS
// ══════════════════════════════════════════════════════════════════════════════

type SpellingError = {
  written: string;
  intended: string;
  gradeLevel: string;
  occurrence?: number;
};

type GrammarMistake = {
  type: 'agreement' | 'plural' | 'syntax' | 'other';
  example: string;
};

type UncertainWord = {
  word: string;
  confidence: number;
  possibleAlternatives?: string[];
};

type HighlightTarget = {
  text: string;
  occurrence: number; // 1-based
  kind: 'spelling' | 'grammar' | 'cancelled' | 'maybe-cancelled';
  tokenSpan?: number; // words count for phrase-level matching
};

type HighlightMap = {
  redWords: string[];      // backward compatibility
  redPhrases: string[];    // backward compatibility
  strikePhrases: string[]; // backward compatibility
  targets?: HighlightTarget[]; // optional for backward compatibility
};

function normalizeForUiMatch(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqueNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeForUiMatch(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value.trim());
  }

  return result;
}

function dedupeGrammarMistakes(grammarMistakes: GrammarMistake[] = []): GrammarMistake[] {
  const seen = new Set<string>();
  const result: GrammarMistake[] = [];

  for (const item of grammarMistakes) {
    const key = `${item.type}:${normalizeForUiMatch(item.example)}`;
    if (!item.example || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function dedupeSpellingErrors(spellingErrors: SpellingError[] = []): SpellingError[] {
  const seen = new Set<string>();
  const result: SpellingError[] = [];

  for (const item of spellingErrors) {
    const key = `${normalizeForUiMatch(item.written)}::${item.occurrence || 1}`;
    if (!item.written || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function isPlacedInText(text: string, phrase: string): boolean {
  const t = normalizeForUiMatch(text || '');
  const p = normalizeForUiMatch(phrase || '');
  if (!t || !p) return false;
  const pattern = new RegExp(`\\b${escapeRegExp(p)}\\b`, 'i');
  return pattern.test(t);
}

function keepOnlyVisibleConfirmed(
  transcription: string,
  items: Array<{ text: string; confidence?: number; occurrence?: number }>
) {
  const t = normalizeForUiMatch(transcription || '');
  return (items || []).filter((c) => {
    const text = normalizeForUiMatch(c.text || '');
    if (!text) return false;
    // multi-word false positives drop
    if (text.split(' ').length > 1) return false;
    // must exist as real token in transcription
    const re = new RegExp(`\\b${escapeRegExp(text)}\\b`, 'i');
    return re.test(t);
  });
}

function sanitizeConfirmedCancellations(transcription: string, items: any[] = []) {
  return items.filter((c) => {
    const txt = String(c?.text || "").trim();
    if (!txt) return false;
    const words = txt.split(/\s+/);
    if (words.length > 1) return false; // multi-word false positives block
    if ((c.confidence ?? 0) < 85) return false;
    return isPlacedInText(transcription, txt);
  });
}

function stripCancellationTags(text: string): string {
  return (text || '')
    .replace(/\[CANCELLED:\s*([^\]]+)\]/gi, '$1')
    .replace(/\[MAYBE-CANCELLED:\s*([^\]]+)\]/gi, '$1');
}

function extractInlineCancellationTags(text: string): string[] {
  const cancelled: string[] = [];
  const cancelledRegex = /\[CANCELLED:\s*([^\]]+)\]/gi;
  let match;
  while ((match = cancelledRegex.exec(text)) !== null) {
    cancelled.push(match[1]);
  }
  return cancelled;
}

function promoteUncertainWordsToSpellingErrors(
  uncertainWords: UncertainWord[] = [],
  existingSpellingErrors: SpellingError[] = []
): SpellingError[] {
  const existing = new Set(
    existingSpellingErrors.map(item => normalizeForUiMatch(item.written))
  );

  const promotionMap: Record<string, string> = {
    ad: 'and',
    en: 'in',
    ar: 'are',
    n: 'in',
    bcuz: 'because',
    cuz: 'because',
  };

  const promoted: SpellingError[] = [];

  for (const item of uncertainWords) {
    const word = normalizeForUiMatch(item.word);
    if (!word) continue;
    if (existing.has(word)) continue;

    const intended =
      promotionMap[word] ||
      (item.possibleAlternatives && item.possibleAlternatives[0]) ||
      '';

    if (!intended) continue;
    if ((item.confidence || 0) < 40) continue;

    promoted.push({
      written: item.word,
      intended,
      gradeLevel: 'approx 1st grade',
      occurrence: 1,
    });
  }

  return promoted;
}

function buildHighlightMap(params: {
  spellingErrors?: SpellingError[];
  grammarMistakes?: GrammarMistake[];
  uncertainWords?: UncertainWord[];
  confirmedCancellations?: CancellationItem[];
  uncertainCancellations?: CancellationItem[];
  treatUncertainCancellationsAsStrike?: boolean;
}): HighlightMap {
  const {
    spellingErrors = [],
    grammarMistakes = [],
    uncertainWords = [],
    confirmedCancellations = [],
    uncertainCancellations = [],
    treatUncertainCancellationsAsStrike = true,
  } = params;

  const redWords = uniqueNormalized(spellingErrors.map(s => s.written)); // uncertainWords removed
  const redPhrases = uniqueNormalized(grammarMistakes.map(g => extractGrammarTarget(g.example)).filter(Boolean));
  const strikePhrases = uniqueNormalized(confirmedCancellations.map(c => c.text));

  // Build targets array with respect to treatUncertainCancellationsAsStrike flag
  const targets: HighlightTarget[] = [
    ...spellingErrors.map(s => ({
      text: s.written,
      occurrence: s.occurrence || 1,
      kind: 'spelling' as const,
      tokenSpan: 1 // spelling is always single word
    })),
    ...grammarMistakes.map(g => ({
      text: extractGrammarTarget(g.example) || g.example,
      occurrence: 1,
      kind: 'grammar' as const,
      tokenSpan: (extractGrammarTarget(g.example) || g.example).trim().split(/\s+/).length
    })),
    ...confirmedCancellations.map(c => ({
      text: c.text,
      occurrence: c.occurrence || 1,
      kind: 'cancelled' as const,
      tokenSpan: (c.text || '').trim().split(/\s+/).length
    })),
    // Uncertain cancellations excluded from targets
  ];

  return { redWords, redPhrases, strikePhrases, targets };
}

function countNormalizedOccurrences(text: string, phrase: string): number {
  const normalizedText = normalizeForUiMatch(text || '');
  const normalizedPhrase = normalizeForUiMatch(phrase || '');

  if (!normalizedText || !normalizedPhrase) return 0;

  const pattern = new RegExp(`\\b${escapeRegExp(normalizedPhrase)}\\b`, 'g');
  return (normalizedText.match(pattern) || []).length;
}

function filterVisibleSpellingErrors(
  transcription: string,
  spellingErrors: SpellingError[] = []
): SpellingError[] {
  return spellingErrors.filter((err) => {
    const visibleCount = countNormalizedOccurrences(transcription, err.written);
    const requiredOccurrence = err.occurrence || 1;
    return visibleCount >= requiredOccurrence;
  });
}

function findUnplacedCancellations(
  displayTranscription: string,
  cancellations: any[]
): any[] {
  const unplaced: any[] = [];

  const transcriptionNormalized = normalizeForUiMatch(displayTranscription || '');

  for (const c of cancellations || []) {
    const textNormalized = normalizeForUiMatch(c.text || '');
    if (textNormalized && !transcriptionNormalized.includes(textNormalized)) {
      unplaced.push({
        text: c.text,
        confidence: c.confidence ?? 0,
        reason: c.reason || 'unplaced',
        occurrence: c.occurrence
      });
    }
  }

  return unplaced;
}

function attachDeterministicSummary(reportText: string, summary: Record<string, any>): string {
  const cleanReport = stripSummaryBlock(reportText);
  return `${cleanReport}\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\``;
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

function canonicalIntended(written: string, intended: string) {
  const w = (written || '').toLowerCase().trim();
  const i = (intended || '').toLowerCase().trim();

  if (w === 'alot' && (!i || i === 'alot')) return 'a lot';
  if (w === 'ad' && (!i || i === 'ad')) return 'and';
  if (w === 'lifes' && (!i || i === 'lifes')) return 'lives';
  return intended;
}

function normalizeWord(s: string) {
  return (s || '').toLowerCase().trim();
}

type SpErr = { written: string; intended: string; gradeLevel?: string; confidence?: number; reason?: string };

function hasError(spellingErrors: SpErr[], written: string, intended?: string) {
  const w = normalizeWord(written);
  const i = intended ? normalizeWord(intended) : '';
  return spellingErrors.some(e => {
    const ew = normalizeWord(e.written);
    const ei = normalizeWord(e.intended);
    if (ew !== w) return false;
    return intended ? (ei === i) : true;
  });
}

function applySpellingHeuristics(transcription: string, spellingErrors: SpErr[]): SpErr[] {
  // Removed hardcoded patterns - GPT extraction handles spelling detection
  // Previously had hardcoded "to met" and "together" variants which were sample-specific
  return spellingErrors;
}

function computeSentenceBoundaryEvidence(transcription: string) {
  const text = (transcription || '').trim();
  if (!text) return { runOnSentences: 0, missingCapitals: 0, missingPunctuation: 0 };

  const endPunctMatches = text.match(/[.!?]/g) || [];
  const endPunct = endPunctMatches.length;

  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  // Missing capitals: any new sentence starts lowercase
  const missingCapitals = sentences.some(s => /^[a-z]/.test(s)) ? 1 : 0;

  // Missing punctuation: long text but too few end marks
  const missingPunctuation = (text.length > 140 && endPunct === 0) ? 1 : 0;

  // Run-on: if ANY sentence chunk is too long (words threshold)
  const wordCounts = sentences.map(s => (s.match(/\b[\w']+\b/g) || []).length);
  const maxWordsInOneSentence = wordCounts.length ? Math.max(...wordCounts) : 0;

  // Tune threshold (works across grades better than checking only total punct)
  const runOnSentences = (maxWordsInOneSentence >= 28) ? 1 : 0;

  return { runOnSentences, missingCapitals, missingPunctuation };
}

function detectWordChoiceMistakes(transcription: string) {
  const t = (transcription || '').toLowerCase();
  const out: Array<{ written: string; intended: string; type: string; confidence: number }> = [];

  if (/\btheir\s+are\b/.test(t)) {
    out.push({ written: 'their are', intended: 'there are', type: 'homophone', confidence: 90 });
  }
  if (/\bto\s+too\b/.test(t)) {
    out.push({ written: 'to too', intended: 'too', type: 'homophone', confidence: 85 });
  }
  if (/\byour\s+are\b/.test(t) && /\bhour\b/.test(t)) {
    out.push({ written: 'our are', intended: 'we are', type: 'grammar', confidence: 85 });
  }
  return out;
}

function fixCancellationPatterns(text: string): string {
  return text
    .replace(/\[(CANCELLED):\s*(my|the|a|an|his|her|their|our|your|this|that|its)\s+(\w+)\s*\]/gi, '$2 [$1: $3]')
    .replace(/\[(CANCELLED):\s*(my|the|a|an|his|her|their|our|your|this|that|its)\s+(\w+)\s+(\w+)\s*\]/gi, '$2 [$1: $3] $4');
}

// ─── Helper: Clean cancellation array (preserve original text, no helper-word stripping) ───────────
function cleanCancellationArray(cancellations: any[]): any[] {
  if (!cancellations) return [];
  return cancellations
    .filter(c => c?.text && String(c.text).trim().length > 0)
    .map(c => ({ ...c, text: String(c.text).trim() })); // no helper-word stripping
}

type CancellationItem = {
  text: string;
  confidence?: number;
  occurrence?: number; // 1-based; if missing -> 1
  status?: 'confirmed' | 'uncertain';
};

function normalizeForMatch(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPhraseRegex(phrase: string): RegExp | null {
  const p = normalizeForMatch(phrase);
  if (!p) return null;

  const words = p.split(' ').filter(Boolean);
  if (words.length === 0) return null;

  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Allow spaces and light punctuation between words.
  const joiner = `[\\s,.;:!?'"()\\-]+`;
  const body = words.map(esc).join(joiner);

  // Word boundaries on both ends to avoid partial matches.
  return new RegExp(`\\b${body}\\b`, 'gi');
}

function replaceNth(
  input: string,
  re: RegExp,
  nth: number,
  replacement: (match: string) => string
): string {
  if (nth <= 0) nth = 1;

  let idx = 0;
  // Ensure global
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const rgx = new RegExp(re.source, flags);

  return input.replace(rgx, (m) => {
    idx += 1;
    if (idx === nth) return replacement(m);
    return m;
  });
}

function injectCancellationTags(
  transcription: string,
  confirmedCancellations: CancellationItem[] = [],
  uncertainCancellations: CancellationItem[] = []
): string {
  let result = transcription || '';
  if (!result.trim()) return result;

  const hasTagType = (tagType: 'cancelled' | 'maybe-cancelled') =>
    result.toLowerCase().includes(`[${tagType}:`);

  const injectOne = (item: CancellationItem, tag: 'CANCELLED' | 'MAYBE-CANCELLED') => {
    const rawText = (item?.text || '').trim();
    if (!rawText) return;

    const exactTag = `[${tag}: ${rawText}]`;
    if (result.includes(exactTag)) return;

    const re = buildPhraseRegex(rawText);
    if (!re) return;

    const safeLower = normalizeForMatch(rawText);
    if (hasTagType('cancelled') || hasTagType('maybe-cancelled')) {
      const taggedRegions = result.match(/\[(CANCELLED|MAYBE-CANCELLED):[^\]]+\]/gi) || [];
      if (taggedRegions.some(tr => normalizeForMatch(tr).includes(safeLower))) return;
    }

    const nth = typeof item.occurrence === 'number' && item.occurrence > 0 ? item.occurrence : 1;
    result = replaceNth(result, re, nth, (matched) => `[${tag}: ${matched}]`);
  };

  const sortByPhraseLengthDesc = (a: CancellationItem, b: CancellationItem) =>
    normalizeForMatch(b.text).length - normalizeForMatch(a.text).length;

  const confirmed = (confirmedCancellations || []).slice().sort(sortByPhraseLengthDesc);
  const uncertain = (uncertainCancellations || []).slice().sort(sortByPhraseLengthDesc);

  for (const c of confirmed) injectOne(c, 'CANCELLED');
  for (const c of uncertain) injectOne(c, 'MAYBE-CANCELLED');

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════
export async function analyzeHandler(req: AuthRequest, res: Response): Promise<void> {
  console.log('\n═══════════════════════════════════════════════');
  console.log('[analyzeController] POST /api/analyze — user:', req.userEmail);

  const { messages, model, max_tokens, grade } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages field is required' });
    return;
  }

  const userContent = messages[0]?.content;
  const imageUrlObj = Array.isArray(userContent)
    ? userContent.find((c: any) => c.type === 'image_url') : null;
  const imageUrl: string | null = imageUrlObj?.image_url?.url || null;

  const textPart: string = Array.isArray(userContent)
    ? userContent.find((c: any) => c.type === 'text')?.text || '' : '';

  console.log('[REQ] prompt length:', textPart.length, '| image present:', !!imageUrl);
  console.log('═══════════════════════════════════════════════\n');

  function extract(key: string): string | undefined {
    const m = textPart.match(new RegExp(`- ${key}:\\s*(.+)`));
    return m?.[1]?.trim();
  }

  const grade_p      = grade || extract('Grade') || '';
  const age_p        = extract('Chronological Age');
  const timeGiven_p  = extract('Time Given \\(Allotted Time\\)');
  const timeTaken_p  = extract('Time Taken \\(Actual Time Spent\\)');
  const prompt_p     = extract('Writing Prompt/Task Given');
  const paper_p      = extract('Paper Type');
  const instrument_p = extract('Writing Instrument');
  const timeTaken    = timeTaken_p ? parseFloat(timeTaken_p) : undefined;
  // Prioritize form data over OCR extraction
  const studentName  = req.body.studentName || extract('Student Name') || extract('Name') || null;
  const contactEmail = req.body.contactEmail || extract('Contact Email') || extract('Email') || extract('Parent Email') || null;
  const contactPhone = req.body.contactPhone || extract('Contact Phone') || extract('Phone') || extract('Mobile') || null;

  const interventionTried = textPart.includes('Interventions Tried: Yes');
  const improvedMatch     = textPart.match(/Improvement Observed: (\w+)/);
  const detailsMatch      = textPart.match(/Intervention Details: (.+)/);
  const improvedVal       = (improvedMatch?.[1] || 'NO').toUpperCase();
  const rtiImprovement    = interventionTried && improvedVal === 'YES';

  if (!imageUrl) {
    res.status(400).json({ error: 'No image found in messages' });
    return;
  }

  try {
    // ── STEP 1: Evidence Extraction ───────────────────────────────────────────
    console.log('[Step 1] Extracting evidence...');

    const step1 = await withFallback(client => (client as any).responses.create({
      model: 'gpt-5-chat-latest',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: buildExtractionPrompt(grade_p) },
            { type: 'input_image', image_url: imageUrl },
          ],
        },
      ],
      temperature: 0,
    }));

    const raw1 = (step1 as any).output_text || (step1 as any).output?.[0]?.content?.[0]?.text || (step1 as any).choices?.[0]?.message?.content || '';
    // Try to extract JSON from markdown code blocks if the response is not pure JSON
    const jsonMatch = raw1.match(/```json\n?([\s\S]*?)\n?```/) || raw1.match(/```\n?([\s\S]*?)\n?```/);
    const cleanedRaw1 = jsonMatch ? jsonMatch[1] : raw1;
    console.log('\n[Step 1] RAW OUTPUT:\n─────────────────────────────');
    console.log(raw1);
    console.log('─────────────────────────────\n');

    let extracted: any;
    try {
      extracted = JSON.parse(cleanedRaw1.trim());
    } catch {
      console.error('[Step 1] JSON parse failed');
      res.status(500).json({ error: 'Evidence extraction failed — invalid JSON. Please retry.' });
      return;
    }

    if (!extracted.transcription) {
      res.status(500).json({ error: 'Evidence extraction incomplete — missing transcription. Please retry.' });
      return;
    }

    // Deduplicate repeated trailing sentences
    const lines = extracted.transcription.split('\n').map(l => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1];
    if (lines.length >= 2 && lines[lines.length - 2] === lastLine) {
      lines.pop();
      extracted.transcription = lines.join('\n');
    }

    // Create 3 transcription versions for proper pipeline
    let modelTranscription = extracted.transcription || '';

    // 1. AI guardrail: Fix over-cancelled phrases FIRST (fixes the string)
    modelTranscription = normalizeOverCancelledPhrases(modelTranscription);

    // 2. NOW extract the true tags from the FIXED transcription
    const inlineConfirmedTags = extractInlineCancellationTags(modelTranscription);

    // 3. Synchronize the confirmedCancellations array with the fixed tags
    if (extracted.confirmedCancellations) {
      const updatedCancellations = [];
      
      for (const tagText of inlineConfirmedTags) {
        // Find matching original to keep confidence/occurrence data
        const original = extracted.confirmedCancellations.find((c: any) =>
          c.text.toLowerCase().includes(tagText.toLowerCase())
        );
        
        updatedCancellations.push({
          text: tagText,
          confidence: original?.confidence ?? 90,
          occurrence: original?.occurrence ?? 1
        });
      }
      
      extracted.confirmedCancellations = updatedCancellations;
    }

    const plainTranscription = stripCancellationTags(modelTranscription);

    console.log('[Step 1] Extraction completed. Initial data:');
    console.log('  - transcription length:', extracted.transcription?.length || 0);
    console.log('  - displayTranscription present:', !!extracted.displayTranscription);
    console.log('  - displayTranscription length:', extracted.displayTranscription?.length || 0);
    console.log('  - confirmedCancellations:', extracted.confirmedCancellations?.length || 0);
    console.log('  - uncertainCancellations:', extracted.uncertainCancellations?.length || 0);
    console.log('  - spellingErrors:', extracted.spellingErrors?.length || 0);
    console.log('  - grammarMistakes:', extracted.grammarMistakes?.length || 0);
    if (extracted.confirmedCancellations?.length > 0) {
      console.log('  - confirmedCancellations samples:', extracted.confirmedCancellations.slice(0, 3).map(c => c.text));
    }

    // SIMPLIFIED: Use extraction as-is, minimal processing
    // Removed: validateExtraction, rebucketing, sanitizeConfirmedCancellations, demote logic, sanitizeEvidence, qualityGate
    // KEPT: normalizeOverCancelledPhrases (AI grouping guardrail - fixes "my cousin cousin" -> "my [CANCELLED: cousin] cousin")

    // Capture raw transcription immediately after Step-1 parse (before any modifications)
    const rawTranscription = extracted.transcription || '';

    console.log('[Step 1] PARSED EVIDENCE:');
    console.log(JSON.stringify({
      transcription_preview: extracted.transcription?.slice(0, 100),
      spellingErrors: extracted.spellingErrors,
      grammarMistakes: extracted.grammarMistakes,
      runOnSentences: extracted.runOnSentences,
      missingCapitals: extracted.missingCapitals,
      missingPunctuation: extracted.missingPunctuation,
      pastTenseErrors: extracted.pastTenseErrors,
      letterFormationObservations: extracted.letterFormationObservations,
      observedLetterFormationLetters: extracted.observedLetterFormationLetters,
      alignmentObservations: extracted.alignmentObservations,
      spacingObservations: extracted.spacingObservations,
      lineQualityObservations: extracted.lineQualityObservations,
      dsm5Traits: extracted.dsm5Traits,
    }, null, 2));

    // Internal debug evidence logging for cancellation verification
    console.log('[INTERNAL DEBUG] Cancellation Evidence:');
    const confirmedEvidence = (extracted.confirmedCancellations || []).map(c => ({
      word: c.text,
      confidence: c.confidence,
      status: 'confirmed'
    }));
    const uncertainEvidence = (extracted.uncertainCancellations || []).map(c => ({
      word: c.text,
      confidence: c.confidence,
      status: 'uncertain',
      reason: c.reason
    }));
    console.log(JSON.stringify([...confirmedEvidence, ...uncertainEvidence], null, 2));

    // ── STEP 2: Node.js Scoring ───────────────────────────────────────────────
    console.log('\n[Step 2] Calculating scores...');

    const norm      = getWpmNorm(grade_p);

    // SIMPLIFIED: Direct use of extraction data with minimal filtering
    // Basic confidence filtering for spelling errors
    const confirmedCancellationTexts = (extracted.confirmedCancellations || [])
      .filter((c: any) => (c.confidence ?? 0) >= 70)
      .map((c: any) => c.text?.toLowerCase() || '');

    // Create word-level set for basic matching
    const cancelledWordSet = new Set(
      confirmedCancellationTexts
        .flatMap(text => text.split(/\s+/))
        .filter(word => word.length > 0)
    );

    // SIMPLIFIED: Direct spelling errors from extraction with basic confidence filter
    let spellingErrors = (extracted.spellingErrors || [])
      .filter((e: any) => (e.confidence ?? 100) >= 70)
      .map((e: any) => ({
        written: String(e.written || '').trim(),
        intended: String(e.intended || e.written || '').trim(),
        gradeLevel: e.gradeLevel || '',
        confidence: e.confidence ?? 100
      }));

    // SIMPLIFIED: Remove cancelled words from spelling errors (basic filter)
    spellingErrors = spellingErrors
      .filter((err: any) => {
        const writtenLower = err.written?.toLowerCase();
        const errorWords = writtenLower.split(/\s+/).filter(w => w.length > 0);
        return !errorWords.some(word => cancelledWordSet.has(word));
      });

    // Strip placeholder strings AI sometimes echoes from the prompt template
    const isPlaceholder = (s: string) =>
      /^(write actual|specific visual|specific observable|e\.g\.|no examples)/i.test(s.trim());
    const cleanObs = (arr: string[]) => (arr || []).filter(s => !isPlaceholder(s));

    // SIMPLIFIED: Use LLM values directly, no heuristic override
    // Removed: computeSentenceBoundaryEvidence override

    // Deduplicate grammar mistakes
    const grammarMistakes = dedupeGrammarMistakes(extracted.grammarMistakes || []);

    // Deduplicate spelling errors
    spellingErrors = dedupeSpellingErrors(spellingErrors || []);

    extracted.grammarMistakes = grammarMistakes;

    // As-is OCR approach with uncertain cancellations for scribbles/overwrites
    const displayTranscription = injectCancellationTags(
      plainTranscription,
      extracted.confirmedCancellations || [],
      extracted.uncertainCancellations || [] // FIX: Scribbles and overwrites now show in UI
    );

    // Remove headers for counting
    const countingTranscription = displayTranscription
      .replace(/Date:\s*\d{1,2}\/\d{1,2}\/\d{4}/gi, '')
      .replace(/\d{1,2}:\d{2}\s*(?:am|pm)?/gi, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}/gi, '')
      .replace(/Date:/gi, '');

    // Store transcriptions
    extracted.transcription = modelTranscription; // Keep original model transcription
    extracted.rawTranscription = modelTranscription;
    extracted.displayTranscription = displayTranscription;
    extracted.countingTranscription = countingTranscription;
    extracted.modelTranscription = modelTranscription;

    // SIMPLIFIED: Minimal cancellation filtering - only basic checks
    // Keep cancellations that: exist in plain transcription, have confidence >= 70, text non-empty
    const minimalConfirmedCancellations = (extracted.confirmedCancellations || [])
      .filter((c: any) => {
        const text = (c.text || '').trim();
        return text.length > 0 &&
               (c.confidence ?? 0) >= 70 &&
               isPlacedInText(plainTranscription, text);
      });

    extracted.confirmedCancellations = minimalConfirmedCancellations;

    // SIMPLIFIED: Removed applySpellingHeuristics, ambiguous pair logic
    // Empty declarations for compatibility
    const unplacedCancellations: any[] = [];
    const allWordChoiceMistakes: any[] = [];
    // Basic filtering only - remove cancelled words from spelling
    spellingErrors = spellingErrors
      .filter((err: any) => {
        const writtenLower = err.written?.toLowerCase();
        const errorWords = writtenLower.split(/\s+/).filter(w => w.length > 0);
        return !errorWords.some(word => cancelledWordSet.has(word));
      })
      .map((e: any) => ({
        written: e.written,
        intended: e.intended,
        gradeLevel: e.gradeLevel || '',
        occurrence: typeof e.occurrence === 'number' && e.occurrence > 0 ? e.occurrence : 1
      }));

    // Promote uncertain words (like 'en', 'ad', 'ar') to spelling errors for highlighting
    const promotedWords = promoteUncertainWordsToSpellingErrors(
      extracted.uncertainWords || [],
      spellingErrors
    );
    spellingErrors = [...spellingErrors, ...promotedWords];

    // Build final spelling errors and highlight map after all post-processing
    const finalSpellingErrors = dedupeSpellingErrors(spellingErrors);
    
    // FIX: Removed filterVisibleSpellingErrors so autocorrected words don't get deleted from the error list.
    
    const highlightMap = buildHighlightMap({
      spellingErrors: finalSpellingErrors,
      grammarMistakes: extracted.grammarMistakes || [], // FIX: Restored grammar highlights (orange color)
      uncertainWords: extracted.uncertainWords || [],
      confirmedCancellations: extracted.confirmedCancellations || [],
      uncertainCancellations: extracted.uncertainCancellations || [],
      treatUncertainCancellationsAsStrike: true,
    });

    extracted.spellingErrors = finalSpellingErrors;
    extracted.highlightMap = highlightMap;

    // 5) Word count must use countingTranscription - includes cancelled words
    const wordCount = countWordsDeterministic(countingTranscription);

    console.log('[INTERNAL DEBUG] Word Count Calculation:');
    console.log(`Transcription: ${countingTranscription.slice(0, 100)}...`);
    console.log(`Word count (includes cancelled): ${wordCount}`);
    console.log(`Transcription has cancellation tags: ${extracted.transcription.includes('[CANCELLED:')}`);
    
    // Enhanced debug logging for future dispute resolution
    console.log('[INTERNAL DEBUG] Full Evidence for Dispute Resolution:');
    console.log(JSON.stringify({
      transcription: extracted.transcription,
      confirmedCancellations: extracted.confirmedCancellations,
      uncertainCancellations: extracted.uncertainCancellations,
      finalWordCount: wordCount
    }, null, 2));

    // Safe time calculation for WPM
    const safeTime = timeTaken && timeTaken > 0 ? timeTaken : undefined;
    const wpm = safeTime && wordCount > 0 ? Math.round(wordCount / safeTime) : 0;

    const evidenceData: EvidenceData = {
      transcription:              extracted.transcription,
      rawTranscription:            extracted.rawTranscription,
      displayTranscription:       extracted.displayTranscription,
      countingTranscription:      extracted.countingTranscription,
      normalizedTranscription:     extracted.normalizedTranscription || extracted.transcription,
      wordCount,
      confirmedCancellations:     extracted.confirmedCancellations || [],
      uncertainCancellations:    extracted.uncertainCancellations || [],
      unplacedCancellations:      unplacedCancellations || [],
      spellingErrors: finalSpellingErrors.map(err => ({
        written: err.written,
        intended: err.intended,
        gradeLevel: err.gradeLevel || 'unknown'
      })),
      wordChoiceMistakes:        allWordChoiceMistakes,
      grammarMistakes,
      runOnSentences:           extracted.runOnSentences,
      missingCapitals:          extracted.missingCapitals,
      missingPunctuation:       extracted.missingPunctuation,
      pastTenseErrors:            extracted.pastTenseErrors || 0,
      letterFormationObservations: cleanObs(extracted.letterFormationObservations),
      observedLetterFormationLetters: (extracted.observedLetterFormationLetters || [])
        .filter((letter: any) => typeof letter === 'string')
        .map((letter: string) => letter.toLowerCase().trim())
        .filter((letter: string) => /^[a-z]$/.test(letter)),
      alignmentObservations:      cleanObs(extracted.alignmentObservations),
      spacingObservations:        cleanObs(extracted.spacingObservations),
      lineQualityObservations:    cleanObs(extracted.lineQualityObservations),
      wpm,
      rtiImprovement,
      dsm5Traits:                 cleanObs(extracted.dsm5Traits),
      features:                   extracted.features || {},
      ocrConfidence:              extracted.ocrConfidence || 80,
     
      dysgraphiaIndicators:       cleanObs(extracted.dsm5Traits),
    };

    // Debug: Log grade and norm before calculation
    console.log('[DEBUG] Grade being used:', grade_p);
    console.log('[DEBUG] WPM Norm:', norm);
    console.log('[DEBUG] WPM % of norm min:', norm.min > 0 ? ((wpm / norm.min) * 100).toFixed(1) + '%' : 'N/A');

    const scores = calculateScoresWithNorm(evidenceData, grade_p);
    const probability = calculateProbability(scores, rtiImprovement, wpm, grade_p);
    const actionableStrategies = getActionableStrategies(scores, rtiImprovement);

    const spellingLabel = scores.spelling < 50 ? 'Significantly Below Grade Level'
      : scores.spelling < 70 ? 'Below Grade Level'
      : scores.spelling < 85 ? 'At Grade Level' : 'Above Grade Level';

    const fluencyLabel = wpm < norm.min ? 'Slow/Labored'
      : wpm <= norm.max ? 'Developing' : 'Fluent';

    console.log('[Step 2] SCORES:');
    console.log(JSON.stringify(scores, null, 2));
    console.log('[Step 2] Node word count:', wordCount, '| WPM:', wpm, '| Probability:', probability);

    // ── STEP 3: Narrative — TEXT ONLY, NO IMAGE ───────────────────────────────
    console.log('\n[Step 3] Generating narrative...');

    const step3 = await withFallback(client => (client as any).responses.create({
      model: model || 'gpt-5-chat-latest',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildNarrativePrompt({
                grade: grade_p, age: age_p,
                timeGiven: timeGiven_p ? parseFloat(timeGiven_p) : undefined,
                timeTaken,
                writingPrompt: prompt_p, paperType: paper_p, writingInstrument: instrument_p,
                interventionHistory: { tried: interventionTried, improved: improvedVal, details: detailsMatch?.[1] || '' },
                evidence: evidenceData,
                scores,
                probability,
                rtiImprovement,
                spellingLabel,
                fluencyLabel,
                norm,
                actionableStrategies,
              }),
            },
          ],
        },
      ],
    }));

    console.log('[Step 3] ✓ | usage:', (step3 as any).usage);
    console.log('[Step 3] Preview:', (step3 as any).output?.[0]?.content?.[0]?.text?.slice(0, 200) || (step3 as any).choices?.[0]?.message?.content?.slice(0, 200));

    let rawReportText = (step3 as any).output_text || (step3 as any).output?.[0]?.content?.[0]?.text || (step3 as any).choices?.[0]?.message?.content || '';
    // Clean up markdown code blocks if present
    const reportJsonMatch = rawReportText.match(/```json\n?([\s\S]*?)\n?```/) || rawReportText.match(/```\n?([\s\S]*?)\n?```/);
    if (reportJsonMatch) {
      rawReportText = reportJsonMatch[1];
    }
    const deterministicSummary = buildDeterministicSummary({
      grade: grade_p,
      existingSummary: parseSummaryBlock(rawReportText),
      evidence: evidenceData,
      scores,
      probability,
      rtiImprovement,
      spellingLabel,
      fluencyLabel,
      norm,
    });
    const reportText = attachDeterministicSummary(rawReportText, deterministicSummary);

    if ((step3 as any).choices?.[0]?.message) {
      (step3 as any).choices[0].message.content = reportText;
    }

    if (req.userId) {
      const isHighProbability = probability.toLowerCase().includes('high');
      const contactInfo = contactPhone ? `${contactEmail || ''} | ${contactPhone}` : contactEmail;
      await query(
        'INSERT INTO reports (user_id, grade, report_text, probability, is_high_probability, student_name, student_age, contact_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.userId, grade_p || null, reportText, probability, isHighProbability, studentName, age_p || null, contactInfo]
      );
    }

    // Construct response with summary data including highlightMap
    const responseData = {
      ...(step3 as any),
      summary: {
        ...deterministicSummary,
        transcription: extracted.displayTranscription || extracted.transcription,
        displayTranscription: extracted.displayTranscription || extracted.transcription,
        spellingErrors: finalSpellingErrors,
        grammarMistakes: grammarMistakes,
        uncertainWords: extracted.uncertainWords || [],
        confirmedCancellations: extracted.confirmedCancellations || [],
        uncertainCancellations: extracted.uncertainCancellations || [],
        highlightMap: highlightMap,
        runOnSentences: extracted.runOnSentences ?? 0,
        missingCapitals: extracted.missingCapitals ?? 0,
        missingPunctuation: extracted.missingPunctuation ?? 0,
      }
    };

    console.log('[Response Data] Sending to frontend:');
    console.log('  - transcription length:', responseData.summary.transcription?.length || 0);
    console.log('  - displayTranscription length:', responseData.summary.displayTranscription?.length || 0);
    console.log('  - transcription has [CANCELLED tags]?:', responseData.summary.transcription?.includes('[CANCELLED'));
    console.log('  - displayTranscription has [CANCELLED tags]?:', responseData.summary.displayTranscription?.includes('[CANCELLED'));
    console.log('  - transcription preview:', responseData.summary.transcription?.slice(0, 150));
    console.log('  - displayTranscription preview:', responseData.summary.displayTranscription?.slice(0, 150));
    console.log('  - confirmedCancellations in response:', responseData.summary.confirmedCancellations?.length || 0);
    console.log('  - spellingErrors in response:', responseData.summary.spellingErrors?.length || 0);

    res.json(responseData);

  } catch (error: any) {
    console.error('[analyzeController] Error:', error?.message);
    res.status(error?.status || 500).json({ error: error?.message || 'Internal server error' });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RECALCULATE HANDLER - For edited OCR transcription
// ══════════════════════════════════════════════════════════════════════════════
export async function recalculateHandler(req: AuthRequest, res: Response): Promise<void> {
  console.log('\n═══════════════════════════════════════════════');
  console.log('[analyzeController] POST /api/recalculate — user:', req.userEmail);

  const { 
    evidenceData, 
    editedTranscription,
    grade,
    wpm,
    timeTaken,
    rtiImprovement
  } = req.body;

  if (!evidenceData || !editedTranscription) {
    res.status(400).json({ error: 'evidenceData and editedTranscription are required' });
    return;
  }

  try {
    console.log('[Recalculate] Processing edited transcription...');
    
    // Update evidence with new transcription
    const updatedEvidence = {
      ...evidenceData,
      transcription: editedTranscription
    };

    // Re-calculate scores with updated transcription
    const norm = getWpmNorm(grade || '6');
    const scores = calculateScoresWithNorm(updatedEvidence, grade || '6');
    const probability = calculateProbability(scores, rtiImprovement || false, wpm || 0, grade || '6');
    const actionableStrategies = getActionableStrategies(scores, rtiImprovement || false);

    // Recalculate word count
    const wordCount = countWordsDeterministic(editedTranscription);

    const spellingLabel = scores.spelling < 50 ? 'Significantly Below Grade Level'
      : scores.spelling < 70 ? 'Below Grade Level'
      : scores.spelling < 85 ? 'At Grade Level' : 'Above Grade Level';

    const fluencyLabel = wpm < norm.min ? 'Slow/Labored'
      : wpm <= norm.max ? 'Developing' : 'Fluent';

    console.log('[Recalculate] Updated scores:', scores);
    console.log('[Recalculate] Updated probability:', probability);
    console.log('[Recalculate] Updated word count:', wordCount);

    res.json({
      success: true,
      scores: {
        ...scores,
        probability,
        spellingLabel,
        fluencyLabel
      },
      wordCount,
      norm
    });

  } catch (error: any) {
    console.error('[Recalculate] Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
