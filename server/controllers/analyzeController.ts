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
  countWords,
  getWpmNorm,
} from '../utils/scoreEngine.js';

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — GPT-4o: Evidence extraction only. No scores. No diagnosis.
// ══════════════════════════════════════════════════════════════════════════════
function buildExtractionPrompt(grade: string): string {
  return `You are a forensic OCR specialist analyzing a handwritten document.

YOUR PRIMARY JOB: Accurate verbatim transcription. Then extract clinical evidence.

The transcription is the scoring source of truth. Do not rewrite the student's
language into correct English. Preserve the visible writing exactly, even when it
looks like a normal word was intended.

═══ STRICT OCR RULES (follow exactly) ═══

1. CANCELLED/CROSSED-OUT WORDS:
   - Only mark words as CANCELLED if the strikethrough is clearly visible in the handwriting.
   - If uncertain about whether a word is cancelled, place it in uncertainWords instead.
   - Do NOT infer or guess hidden cancelled text that is not clearly visible.
   - Do NOT skip cancelled words. Do NOT include them in the main transcription flow.
   - Example: "I went [CANCELLED: to the] store" — not "I went store"

2. HYPHENATED WORDS:
   - Treat hyphenated compounds as ONE word: "get-together" = 1 word
   - Even if written as two words with a space (e.g., "get together"), count as written — do NOT merge or split differently than what is on the page.

3. WORD COUNT:
   - Count ONLY the actual handwritten writing sample text.
   - EXCLUDE date/time headers (e.g., "Date:", "2/18/2026", "2:45", "3pm").
   - EXCLUDE [CANCELLED: ...] words from wordCount.
   - Count hyphenated words as 1 word each.
   - Be thorough — count line by line if needed.

4. TRANSCRIPTION ACCURACY:
   - Transcribe character-by-character. NEVER autocorrect.
   - Preserve ALL misspellings exactly: "gettogther" stays "gettogther"
   - NEVER normalize spelling, punctuation, tense, plurals, hyphens, apostrophes, or capitalization.
   - If the page says "theire", "lifes", "alot", "ad", "get-togethir", or "gettogther", those exact forms MUST appear in transcription and spellingErrors.
   - Preserve dates/times/headings if handwritten or part of the writing sample.
   - If a word is ambiguous, write your best read and add it to uncertainWords.
   - Use \\n for line breaks in transcription.

5. SPELLING DETECTION — EXHAUSTIVE (flag everything suspicious):
- Flag only words that clearly deviate from standard spelling
- Do NOT flag correctly spelled English words used in context
- Confidence threshold: flag anything 70%+ confident as a misspelling
- Valid English words used correctly are NOT errors ("met", "had", "get", "we", "family", "fun", "talk")
- BUT: wrong plural forms ("lifes"), missing letters ("ad" for "and"), phonetic spellings ("togther"), merged words ("alot"), wrong tense forms — ALL must be flagged
- Count EACH occurrence separately — if "ad" appears twice, list it twice
- If uncertain about a word, add to uncertainWords instead of spellingErrors
- Provide confidence (0-100) and reason for each.
- IMPORTANT: Do NOT flag words that appear in cancelledWords as spelling errors. Cancelled words should only appear in the cancelledWords list, not in spellingErrors.
- IMPORTANT: "met" is a correctly spelled word - if used incorrectly as tense, flag as grammar/syntax error, NOT spelling error.

Grade context: ${grade}

GRAMMAR COUNTING RULES:
- Count subject-verb disagreement as "agreement" (e.g. "their are", "I get to met")
- Count wrong plural forms as "plural" (e.g. "lifes" instead of "lives")
- Count tense mixing or verb form errors as "syntax"
- Count missing/wrong prepositions, articles as "other"
- Count EVERY mistake — do not merge or summarise

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

IMPORTANT:
- Count EACH instance separately
- A sentence is defined as a complete thought with a subject and verb
- Be thorough — this directly affects scoring
- If handwriting is unclear, make your best judgment based on visible punctuation and capitalization
- BE STRICT: If there are multiple clauses without punctuation, count each as a potential run-on

RETURN ONLY THIS JSON (no markdown fences, no extra text):
{
  "transcription": "verbatim text preserving errors, \\n for line breaks, [CANCELLED: word] for crossed-out",
  "wordCount": 0,
  "cancelledWords": ["word1", "word2"],
  "uncertainWords": [{ "word": "ambiguous", "confidence": 45, "possibleAlternatives": ["alt1"] }],

  "spellingErrors": [
    { "written": "gettogether", "intended": "get-together", "confidence": 95, "reason": "written as one word without hyphen" }
  ],

  "grammarMistakes": [
    { "type": "agreement|plural|syntax|other", "example": "exact phrase from transcription" }
  ],
  "runOnSentences": 0,
  "missingCapitals": 0,
  "missingPunctuation": 0,

  "pastTenseErrors": 0,

  "letterFormationObservations": [
    "write at least 3 specific observations if issues exist (e.g., inconsistent letter size, irregular joins, unclear letter closure, variable formation of t/g/r, overwriting/cross-outs affecting legibility)"
  ],
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
2. PROBABILITY IS FIXED AT "${probability}" — do not change it.
3. RECOMMENDATION: ${rtiImprovement ? 'RTI improvement noted — do NOT recommend formal evaluation. Say monitoring is recommended.' : 'Base recommendation on evidence.'}
4. Title: "Writing Assessment Report"
5. Bold ONLY headings (**Heading**). No bullet symbols (* or -). Numbered lists or plain paragraphs.
6. Parent-friendly language. Explain clinical terms.
7. 2 detailed sentences per mechanics sub-point citing the observations below.
8. ${evidence.wordCount < 75 ? 'Include VALIDITY WARNING after title.' : 'No validity warning needed.'}

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
  "mechanics": "2-sentence overall mechanics summary",
  "spellingErrors": ${JSON.stringify(evidence.spellingErrors.map(e => `${e.written} (${e.intended}) - grade level: ${e.gradeLevel}`))},
  "dysgraphiaIndicators": ${JSON.stringify(evidence.dsm5Traits || [])},
  "assessmentRecommendation": "${rtiImprovement ? 'A formal evaluation is NOT recommended at this time because the student has shown positive improvement with current interventions. Continued monitoring and support is recommended.' : 'Based on the evidence, a formal psycho-educational assessment is recommended.'}",
  "probabilityEstimate": "${probability} — cite domains impaired and evidence",
  "spellingScore": "${spellingLabel} — 2-sentence justification",
  "academicDiscrepancy": "The student's spelling performance appears below expected grade level based on this writing sample; however, comprehensive assessment across multiple tasks is recommended before determining the extent of academic discrepancy.",
  "horizontalAnalysis": "2-sentence horizontal spacing observation",
  "verticalAnalysis": "2-sentence vertical organisation observation",
  "wordCount": ${evidence.wordCount},
  "transcription": "${evidence.transcription.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  "fluencyAnalysis": "${fluencyLabel} — ${evidence.wpm} WPM vs norm ${norm.min}–${norm.max} WPM. 2-sentence qualitative assessment.",
  "wpm": ${evidence.wpm},
  "basalLevel": "2 sentences on consistently demonstrated skills",
  "ceilingLevel": "2 sentences on where performance breaks down",
  "ocrConfidence": ${evidence.ocrConfidence || 80},
  "uncertainWords": [],
  "features": ${JSON.stringify(evidence.features || {})},
  "languageSkills": {
    "sentenceBoundaries": "2-3 sentence comment. Focus on observed issues: ${evidence.runOnSentences} run-on sentences${evidence.missingPunctuation > 0 ? `, ${evidence.missingPunctuation} missing punctuation` : ''}${evidence.missingCapitals > 0 ? `, ${evidence.missingCapitals} missing capitals` : ''}. Only mention missing capitals/punctuation if clearly visible in sample.",
    "grammar": "2-3 sentence comment. Focus on verb form errors, syntax issues, and sentence structure. ${evidence.grammarMistakes.length} grammar issues observed. Do NOT include spelling errors in grammar analysis.",
    "pastTenseUsage": "2-3 sentence comment. ${evidence.pastTenseErrors} errors observed"
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

function buildDeterministicSummary(params: {
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
    existingSummary, evidence, scores, probability, rtiImprovement,
    spellingLabel, fluencyLabel, norm,
  } = params;

  const spellingErrors = evidence.spellingErrors.map(e =>
    `${e.written} (${e.intended}) - grade level: ${e.gradeLevel}`
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
    lineFormation: existingSummary.lineFormation || evidence.letterFormationObservations.join(' ') || 'Letter formation observations were limited in the extracted evidence.',
    mechanics: existingSummary.mechanics || [
      ...evidence.letterFormationObservations,
      ...evidence.alignmentObservations,
      ...evidence.spacingObservations,
      ...evidence.lineQualityObservations,
    ].join(' ') || 'Overall mechanics should be interpreted from the extracted handwriting evidence.',
    spellingErrors,
    dysgraphiaIndicators: evidence.dsm5Traits || [],
    assessmentRecommendation: rtiImprovement
      ? 'A formal evaluation is NOT recommended at this time because the student has shown positive improvement with current interventions. Continued monitoring and support is recommended.'
      : (existingSummary.assessmentRecommendation || 'Based on the evidence, a formal psycho-educational assessment is recommended.'),
    probabilityEstimate: `${probability} — ${impairedDomains.length ? `impaired domains include ${impairedDomains.join(', ')}` : 'few impaired domains were detected'}; WPM ${evidence.wpm} vs norm ${norm.min}-${norm.max}.`,
    spellingScore: `${spellingLabel} — ${spellingErrors.length} spelling error${spellingErrors.length === 1 ? '' : 's'} detected.`,
    academicDiscrepancy: existingSummary.academicDiscrepancy || 'The student\'s spelling performance appears below expected grade level based on this writing sample; however, comprehensive assessment across multiple tasks is recommended before determining the extent of academic discrepancy.',
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
    languageSkills: {
      sentenceBoundaries: languageSkills.sentenceBoundaries || `Focus on observed issues: ${evidence.runOnSentences} run-on sentences${evidence.missingPunctuation > 0 ? `, ${evidence.missingPunctuation} missing punctuation` : ''}${evidence.missingCapitals > 0 ? `, ${evidence.missingCapitals} missing capitals` : ''}. Only mention missing capitals/punctuation if clearly visible in sample.`,
      grammar: languageSkills.grammar || `Focus on verb form errors, syntax issues, and sentence structure. ${evidence.grammarMistakes.length} grammar issue${evidence.grammarMistakes.length === 1 ? '' : 's'} observed. Do NOT include spelling errors in grammar analysis.`,
      pastTenseUsage: languageSkills.pastTenseUsage || `${evidence.pastTenseErrors} past-tense error${evidence.pastTenseErrors === 1 ? '' : 's'} observed.`,
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

function attachDeterministicSummary(reportText: string, summary: Record<string, any>): string {
  const cleanReport = stripSummaryBlock(reportText);
  return `${cleanReport}\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\``;
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

  const grade_p      = extract('Grade') || grade || '';
  const age_p        = extract('Chronological Age');
  const timeGiven_p  = extract('Time Given \\(Allotted Time\\)');
  const timeTaken_p  = extract('Time Taken \\(Actual Time Spent\\)');
  const prompt_p     = extract('Writing Prompt/Task Given');
  const paper_p      = extract('Paper Type');
  const instrument_p = extract('Writing Instrument');
  const timeTaken    = timeTaken_p ? parseFloat(timeTaken_p) : undefined;

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

    const step1 = await withFallback(client => client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: buildExtractionPrompt(grade_p) },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      }] as OpenAI.Chat.ChatCompletionMessageParam[],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 4096,
    }));

    const raw1 = step1.choices[0]?.message?.content || '';
    console.log('\n[Step 1] RAW OUTPUT:\n─────────────────────────────');
    console.log(raw1);
    console.log('─────────────────────────────\n');

    let extracted: any;
    try {
      extracted = JSON.parse(raw1.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      console.error('[Step 1] JSON parse failed');
      res.status(500).json({ error: 'Evidence extraction failed — invalid JSON. Please retry.' });
      return;
    }

    if (!extracted.transcription) {
      res.status(500).json({ error: 'Evidence extraction incomplete — missing transcription. Please retry.' });
      return;
    }

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
      alignmentObservations: extracted.alignmentObservations,
      spacingObservations: extracted.spacingObservations,
      lineQualityObservations: extracted.lineQualityObservations,
      dsm5Traits: extracted.dsm5Traits,
    }, null, 2));

    // ── STEP 2: Node.js Scoring ───────────────────────────────────────────────
    console.log('\n[Step 2] Calculating scores...');

    const norm      = getWpmNorm(grade_p);

    // Filter spelling by confidence >= 70 and remove cancelled words
    const cancelledWordsLower = (extracted.cancelledWords || []).map((w: string) => w.toLowerCase());
    const spellingErrors = (extracted.spellingErrors || [])
      .filter((e: any) => (e.confidence ?? 100) >= 70)
      .filter((err: any) => {
        const writtenLower = err.written?.toLowerCase();
        return !cancelledWordsLower.includes(writtenLower);
      })
      .map((e: any) => ({ written: e.written, intended: e.intended, gradeLevel: e.gradeLevel || 'unknown' }));

    // Strip placeholder strings AI sometimes echoes from the prompt template
    const isPlaceholder = (s: string) =>
      /^(write actual|specific visual|specific observable|e\.g\.|no examples)/i.test(s.trim());
    const cleanObs = (arr: string[]) => (arr || []).filter(s => !isPlaceholder(s));

    // Validate missing capitals against actual transcription
    const missingCapitals = extracted.missingCapitals > 0 &&
      extracted.transcription
        .split(/[.!?]+/)
        .some((s: string) => /^[a-z]/.test(s.trim()))
      ? extracted.missingCapitals
      : 0;

    // Validate missing punctuation against actual transcription
    const visiblePunctuation = (extracted.transcription.match(/[.!?]/g) || []).length;
    const sentenceStarts = extracted.transcription
      .split(/[.!?]+/)
      .filter((s: string) => s.trim().length > 0)
      .length;
    const missingPunctuation = visiblePunctuation < sentenceStarts - 1
      ? Math.min(
          extracted.missingPunctuation || 0,
          sentenceStarts - visiblePunctuation - 1
        )
      : 0;

    // Validate run-on sentences against estimated sentence count
    const estimatedSentences = extracted.transcription
      .split(/[.!?]+/)
      .filter(Boolean).length;
    const runOnSentences = Math.min(
      extracted.runOnSentences || 0,
      Math.max(0, estimatedSentences - 1)
    );

    // Deduplicate grammar mistakes
    const grammarMistakes = Array.from(
      new Map(
        (extracted.grammarMistakes || []).map((g: any) =>
          [`${g.type}-${g.example}`, g]
        )
      ).values()
    ) as { type: "agreement" | "plural" | "syntax" | "other"; example: string }[];

    // Validate word count - exclude date/time headers and cancelled words
    // Remove cancelled words from transcription
    const transcriptionWithoutCancelled = extracted.transcription.replace(/\[CANCELLED:[^\]]+\]/g, '');
    // Remove date/time headers (patterns like "Date:", "2/18/2026", "2:45", "3pm", etc.)
    const transcriptionWithoutHeaders = transcriptionWithoutCancelled
      .replace(/Date:\s*\d{1,2}\/\d{1,2}\/\d{4}/gi, '')
      .replace(/\d{1,2}:\d{2}\s*(?:am|pm)?/gi, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}/gi, '')
      .replace(/Date:/gi, '');
    const wordCount = countWords(transcriptionWithoutHeaders);

    // Safe time calculation for WPM
    const safeTime = timeTaken && timeTaken > 0 ? timeTaken : undefined;
    const wpm = safeTime && wordCount > 0 ? Math.round(wordCount / safeTime) : 0;

    const evidenceData: EvidenceData = {
      transcription:              extracted.transcription,
      wordCount,
      cancelledWords:             extracted.cancelledWords || [],
      spellingErrors,
      grammarMistakes,
      runOnSentences,
      missingCapitals,
      missingPunctuation,
      pastTenseErrors:            extracted.pastTenseErrors || 0,
      letterFormationObservations: cleanObs(extracted.letterFormationObservations),
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

    const scores = calculateScoresWithNorm(evidenceData, grade_p);
    const probability = calculateProbability(scores, rtiImprovement, wpm);
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

    const step3 = await withFallback(client => client.chat.completions.create({
      model: model || 'gpt-4o',
      messages: [{
        role: 'user',
        content: buildNarrativePrompt({
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
      }] as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: max_tokens || 4096,
    }));

    console.log('[Step 3] ✓ | usage:', step3.usage);
    console.log('[Step 3] Preview:', step3.choices[0]?.message?.content?.slice(0, 200));

    const rawReportText = step3.choices[0]?.message?.content || '';
    const deterministicSummary = buildDeterministicSummary({
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

    if (step3.choices[0]?.message) {
      step3.choices[0].message.content = reportText;
    }

    if (req.userId) {
      await query(
        'INSERT INTO reports (user_id, grade, report_text) VALUES (?, ?, ?)',
        [req.userId, grade_p || null, reportText]
      );
    }

    res.json(step3);

  } catch (error: any) {
    console.error('[analyzeController] Error:', error?.message);
    res.status(error?.status || 500).json({ error: error?.message || 'Internal server error' });
  }
}
