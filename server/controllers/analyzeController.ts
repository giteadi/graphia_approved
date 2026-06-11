import { Response } from 'express';
import { openaiClient, withFallback } from '../config/openai.js';
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
   - Every word that is crossed out, struck through, or cancelled MUST be wrapped: [CANCELLED: word]
   - Do NOT skip cancelled words. Do NOT include them in the main transcription flow.
   - Example: "I went [CANCELLED: to the] store" — not "I went store"

2. HYPHENATED WORDS:
   - Treat hyphenated compounds as ONE word: "get-together" = 1 word
   - Even if written as two words with a space (e.g., "get together"), count as written — do NOT merge or split differently than what is on the page.

3. WORD COUNT:
   - Count EVERY visible handwritten token (including repeated words, partial words).
   - Do NOT count [CANCELLED: ...] words in wordCount.
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

5. SPELLING DETECTION — CONTEXTUAL (not dictionary-only):
   - Flag every visibly misspelled word that you are 80%+ confident is genuinely misspelled.
   - Valid English words used correctly in context are NOT errors ("met", "had", "get", "we", "family").
   - Provide confidence (0-100) and reason for each candidate.
   - Do not omit repeated spelling errors. If the student writes the same misspelling more than once, include each occurrence.

Grade context: ${grade}

RETURN ONLY THIS JSON (no markdown fences, no extra text):
{
  "transcription": "verbatim text preserving errors, \\n for line breaks, [CANCELLED: word] for crossed-out",
  "wordCount": 0,
  "cancelledWords": ["word1", "word2"],
  "uncertainWords": [{ "word": "ambiguous", "confidence": 45, "possibleAlternatives": ["alt1"] }],

  "spellingErrors": [
    { "written": "gettogether", "intended": "get-together", "gradeLevel": "3rd grade", "confidence": 95, "reason": "written as one word without hyphen" }
  ],

  "grammarMistakes": [
    { "type": "agreement|plural|syntax|other", "example": "exact phrase" }
  ],
  "runOnSentences": 0,
  "missingCapitals": 0,
  "missingPunctuation": 0,

  "pastTenseErrors": 0,

  "letterFormationObservations": [
    "specific visual observation e.g. poorly closed loops on a and o"
  ],
  "alignmentObservations": [
    "specific visual observation e.g. mild drift below baseline in lines 3-4"
  ],
  "spacingObservations": [
    "specific visual observation e.g. irregular word spacing"
  ],
  "lineQualityObservations": [
    "specific visual observation e.g. heavy pen pressure"
  ],

  "dsm5Traits": [
    "specific observable trait e.g. inconsistent letter sizing"
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
  "academicDiscrepancy": "2-3 sentences on areas 2+ grade levels below",
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
    "sentenceBoundaries": "2-3 sentence comment. ${evidence.missingCapitals} missing capitals, ${evidence.missingPunctuation} missing punctuation, ${evidence.runOnSentences} run-on sentences",
    "grammar": "2-3 sentence comment. ${evidence.grammarMistakes.length} grammar issues",
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
    academicDiscrepancy: existingSummary.academicDiscrepancy || `${impairedDomains.length ? `Concern areas include ${impairedDomains.join(', ')}.` : 'No broad academic discrepancy was calculated from the extracted scores.'}`,
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
      sentenceBoundaries: languageSkills.sentenceBoundaries || `${evidence.missingCapitals} missing capitals, ${evidence.missingPunctuation} missing punctuation, ${evidence.runOnSentences} run-on sentences observed.`,
      grammar: languageSkills.grammar || `${evidence.grammarMistakes.length} grammar issue${evidence.grammarMistakes.length === 1 ? '' : 's'} observed.`,
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

    // Use AI OCR word count directly
    const wordCount = extracted.wordCount && extracted.wordCount > 0
      ? extracted.wordCount
      : countWords(extracted.transcription);
    const norm      = getWpmNorm(grade_p);
    const wpm       = (timeTaken && wordCount > 0) ? Math.round(wordCount / timeTaken) : 0;

    // Filter spelling by confidence >= 80
    const spellingErrors = (extracted.spellingErrors || [])
      .filter((e: any) => (e.confidence ?? 100) >= 80)
      .map((e: any) => ({ written: e.written, intended: e.intended, gradeLevel: e.gradeLevel || 'unknown' }));

    const evidenceData: EvidenceData = {
      transcription:              extracted.transcription,
      wordCount,
      cancelledWords:             extracted.cancelledWords || [],
      spellingErrors,
      grammarMistakes:            extracted.grammarMistakes || [],
      runOnSentences:             extracted.runOnSentences || 0,
      missingCapitals:            extracted.missingCapitals || 0,
      missingPunctuation:         extracted.missingPunctuation || 0,
      pastTenseErrors:            extracted.pastTenseErrors || 0,
      letterFormationObservations: extracted.letterFormationObservations || [],
      alignmentObservations:      extracted.alignmentObservations || [],
      spacingObservations:        extracted.spacingObservations || [],
      lineQualityObservations:    extracted.lineQualityObservations || [],
      wpm,
      rtiImprovement,
      dsm5Traits:                 extracted.dsm5Traits || [],
      features:                   extracted.features || {},
      ocrConfidence:              extracted.ocrConfidence || 80,
      dysgraphiaIndicators:       extracted.dsm5Traits || [],
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
