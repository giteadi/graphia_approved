import { Response } from 'express';
import { openaiClient } from '../config/openai.js';
import { query } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import OpenAI from 'openai';

// ─── Step 1: OCR Prompt ───────────────────────────────────────────────────────
function buildOCRPrompt(): string {
  return `You are a forensic OCR specialist analyzing a handwritten document.

Your ONLY job in this step is accurate transcription. Do NOT perform any clinical analysis.

RULES:
1. Transcribe character-by-character. Do NOT autocorrect.
2. Preserve ALL errors exactly as written (e.g., "thouse" stays "thouse").
3. Crossed-out/cancelled text: wrap as [cancelled: word]. If illegible, write [cancelled: illegible].
4. Ambiguous characters: write your best read, then note it in uncertainWords.
5. Preserve original line breaks with \\n.

Return ONLY this JSON (no markdown, no explanation):
{
  "transcription": "full verbatim text with \\n for line breaks",
  "wordCount": number,
  "ocrConfidence": number (0-100, overall confidence),
  "uncertainWords": [
    {
      "word": "transcribed_word",
      "confidence": number (0-100),
      "possibleAlternatives": ["alt1", "alt2"]
    }
  ],
  "cancelledWords": ["word1", "word2"]
}`;
}

// ─── Step 2: Clinical Analysis Prompt ────────────────────────────────────────
function buildClinicalPrompt(params: {
  grade: string;
  age?: string;
  timeGiven?: number;
  timeTaken?: number;
  writingPrompt?: string;
  paperType?: string;
  writingInstrument?: string;
  wordCountInput?: string;
  knownDiagnoses?: string[];
  studentContext?: string;
  observationalNotes?: string;
  observations?: string[];
  dataSources?: string[];
  interventionHistory?: { tried: boolean; improved: string; details: string };
  ocrResult: {
    transcription: string;
    wordCount: number;
    ocrConfidence: number;
    uncertainWords: any[];
  };
}): string {
  const {
    grade, age, timeGiven, timeTaken, writingPrompt, paperType,
    writingInstrument, wordCountInput, knownDiagnoses, studentContext,
    observationalNotes, observations, dataSources, interventionHistory,
    ocrResult,
  } = params;

  const wpm = timeTaken && ocrResult.wordCount
    ? (ocrResult.wordCount / timeTaken).toFixed(1)
    : null;

  return `You are an expert in Educational Psychology, Occupational Therapy, and Special Education, specializing in Dysgraphia and SLD.

VERIFIED TRANSCRIPTION (from OCR step — treat as ground truth):
"""
${ocrResult.transcription}
"""
Word Count: ${ocrResult.wordCount} | OCR Confidence: ${ocrResult.ocrConfidence}%
${wpm ? `Calculated WPM: ${wpm}` : ''}

STUDENT DETAILS:
- Grade: ${grade}
${age ? `- Age: ${age}` : ''}
${timeGiven ? `- Time Given: ${timeGiven} min` : ''}
${timeTaken ? `- Time Taken: ${timeTaken} min` : ''}
${writingPrompt ? `- Prompt: ${writingPrompt}` : ''}
${paperType ? `- Paper: ${paperType}` : ''}
${writingInstrument ? `- Instrument: ${writingInstrument}` : ''}
${wordCountInput ? `- Manual Word Count: ${wordCountInput}` : ''}
${knownDiagnoses?.length ? `- Known Diagnoses: ${knownDiagnoses.join(', ')}` : ''}
${studentContext ? `- Context: ${studentContext}` : ''}
${observationalNotes ? `- Assessor Notes: ${observationalNotes}` : ''}
${observations?.length ? `- Clinical Observations: ${observations.join(', ')}` : ''}
${dataSources?.length ? `- Data Sources: ${dataSources.join(', ')}` : ''}

RTI HISTORY: ${interventionHistory?.tried
    ? `Tried: Yes | Improved: ${interventionHistory.improved.toUpperCase()} | ${interventionHistory.details}`
    : 'Not reported'}

CRITICAL RULES:
1. SPELLING ERRORS — Before flagging any word:
   a. Verify the word is NOT a valid English word in its sentence context.
   b. "met", "had", "was", "an" etc. are valid words — do NOT flag them.
   c. Distinguish spelling errors from grammar errors.
   d. Only flag words that are genuinely misspelled.

2. DYSGRAPHIA PROBABILITY — Only rate Moderate/High if:
   - AT LEAST 3 independent domains show impairment AND
   - Deficits are 2+ grade levels below expectations for Grade ${grade}.
   - If fewer than 3 domains impaired, rate as Low regardless of severity.

3. RTI RULE — If interventions were tried AND improvement was shown, do NOT recommend formal psycho-educational evaluation.

4. VALIDITY WARNING — If word count < 75, include a VALIDITY WARNING at the top of the report.

5. PARENT-FRIENDLY LANGUAGE — Clear, supportive tone. Explain jargon.

6. GRADE NORMS for WPM:
   G1: 5-10 | G2: 8-12 | G3: 10-15 | G4: 12-18 | G5: 15-20 | G6-12: 20-30 | College: 30+

REPORT FORMAT:
- Title: "Writing Assessment Report"
- Bold ONLY headings (**Heading**)
- NO bullet symbols (* or -). Use numbered lists or paragraphs.
- Sections: Mechanics | Spelling & Transcription | Fluency | Language Skills | Clinical Levels | Interpretation & Next Steps

OUTPUT: Write the Markdown report, then append this exact JSON block:

\`\`\`json
{
  "alignment": "summary",
  "lineQuality": "summary",
  "lineFormation": "summary",
  "mechanics": "summary",
  "spellingErrors": ["misspelled_word (intended) - grade level: X"],
  "dysgraphiaIndicators": ["indicator"],
  "assessmentRecommendation": "recommendation",
  "probabilityEstimate": "Low/Moderate/High — specific reasoning citing 3+ domains if Moderate/High",
  "spellingScore": "Significantly Below / Below / At / Above Grade Level — brief justification",
  "academicDiscrepancy": "summary of 2-grade-level gaps found",
  "horizontalAnalysis": "summary",
  "verticalAnalysis": "summary",
  "wordCount": ${ocrResult.wordCount},
  "transcription": "${ocrResult.transcription.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  "fluencyAnalysis": "qualitative assessment",
  "wpm": ${wpm || 0},
  "basalLevel": "consistently demonstrated skills",
  "ceilingLevel": "highest level before breakdown",
  "ocrConfidence": ${ocrResult.ocrConfidence},
  "uncertainWords": ${JSON.stringify(ocrResult.uncertainWords || [])},
  "features": {
    "baselineDeviation": "mild/moderate/severe",
    "spacingConsistency": "good/poor",
    "letterSizeConsistency": "good/poor",
    "slant": "left/right/mixed/upright",
    "pressureIndicators": "light/normal/heavy"
  },
  "languageSkills": {
    "sentenceBoundaries": "comment",
    "grammar": "comment",
    "pastTenseUsage": "comment"
  },
  "scores": {
    "alignment": 0,
    "lineQuality": 0,
    "mechanics": 0,
    "spelling": 0,
    "horizontal": 0,
    "vertical": 0,
    "spatialOrganisation": 0,
    "writingSpeed": 0,
    "letterFormation": 0,
    "grammar": 0,
    "sentenceBoundaries": 0,
    "pastTenseUsage": 0
  }
}
\`\`\``;
}

// ─── Controller ───────────────────────────────────────────────────────────────
export async function analyzeHandler(req: AuthRequest, res: Response): Promise<void> {
  console.log('[analyzeController] POST /api/analyze — user:', req.userEmail);

  // Frontend sends { messages, model, max_tokens, grade }
  // messages[0].content = [{ type: 'text', text: prompt }, { type: 'image_url', ... }]
  const { messages, grade } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages field is required and must be an array' });
    return;
  }

  // Extract image URL from the frontend message
  const userContent = messages[0]?.content;
  const imageUrlObj = Array.isArray(userContent)
    ? userContent.find((c: any) => c.type === 'image_url')
    : null;
  const imageUrl: string | null = imageUrlObj?.image_url?.url || null;

  // Extract all params from the text part (for clinical prompt)
  const textPart = Array.isArray(userContent)
    ? userContent.find((c: any) => c.type === 'text')?.text || ''
    : '';

  // Parse student params from the original prompt text sent by frontend
  function extractParam(text: string, key: string): string | undefined {
    const match = text.match(new RegExp(`- ${key}:\\s*(.+)`));
    return match?.[1]?.trim();
  }

  const grade_parsed = extractParam(textPart, 'Grade') || grade || '';
  const age_parsed = extractParam(textPart, 'Chronological Age');
  const timeGiven_parsed = extractParam(textPart, 'Time Given \\(Allotted Time\\)');
  const timeTaken_parsed = extractParam(textPart, 'Time Taken \\(Actual Time Spent\\)');
  const writingPrompt_parsed = extractParam(textPart, 'Writing Prompt/Task Given');
  const paperType_parsed = extractParam(textPart, 'Paper Type');
  const writingInstrument_parsed = extractParam(textPart, 'Writing Instrument');
  const wordCount_parsed = extractParam(textPart, 'Student Word Count \\(Manual Count\\)');
  const diagnoses_parsed = extractParam(textPart, 'Known Diagnoses');

  const interventionTried = textPart.includes('Interventions Tried: Yes');
  const improvedMatch = textPart.match(/Improvement Observed: (\w+)/);
  const detailsMatch = textPart.match(/Intervention Details: (.+)/);

  try {
    // ── STEP 1: OCR ──────────────────────────────────────────────────────────
    console.log('[analyzeController] Step 1: OCR...');

    if (!imageUrl) {
      res.status(400).json({ error: 'No image found in messages' });
      return;
    }

    const ocrMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildOCRPrompt() },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ];

    const ocrResponse = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: ocrMessages,
      max_tokens: 1024,
    });

    const ocrRaw = ocrResponse.choices[0]?.message?.content || '{}';
    console.log('[analyzeController] OCR done ✓');

    let ocrResult = {
      transcription: '',
      wordCount: 0,
      ocrConfidence: 0,
      uncertainWords: [] as any[],
      cancelledWords: [] as string[],
    };

    try {
      // Strip any accidental markdown fences
      const cleaned = ocrRaw.replace(/```json\n?|\n?```/g, '').trim();
      ocrResult = JSON.parse(cleaned);
    } catch (e) {
      console.error('[analyzeController] OCR JSON parse failed, using raw text');
      ocrResult.transcription = ocrRaw;
      ocrResult.wordCount = ocrRaw.split(/\s+/).length;
      ocrResult.ocrConfidence = 50;
    }

    console.log(`[analyzeController] OCR: ${ocrResult.wordCount} words, confidence: ${ocrResult.ocrConfidence}%`);

    // ── STEP 2: Clinical Analysis ─────────────────────────────────────────────
    console.log('[analyzeController] Step 2: Clinical Analysis...');

    const clinicalPrompt = buildClinicalPrompt({
      grade: grade_parsed,
      age: age_parsed,
      timeGiven: timeGiven_parsed ? parseFloat(timeGiven_parsed) : undefined,
      timeTaken: timeTaken_parsed ? parseFloat(timeTaken_parsed) : undefined,
      writingPrompt: writingPrompt_parsed,
      paperType: paperType_parsed,
      writingInstrument: writingInstrument_parsed,
      wordCountInput: wordCount_parsed,
      knownDiagnoses: diagnoses_parsed ? diagnoses_parsed.split(',').map(d => d.trim()) : [],
      studentContext: undefined,
      observationalNotes: undefined,
      observations: [],
      dataSources: [],
      interventionHistory: {
        tried: interventionTried,
        improved: improvedMatch?.[1] || 'no',
        details: detailsMatch?.[1] || '',
      },
      ocrResult,
    });

    const clinicalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: clinicalPrompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ];

    const clinicalResponse = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: clinicalMessages,
      max_tokens: 4096,
    });

    console.log('[analyzeController] Clinical analysis done ✓ | usage:', clinicalResponse.usage);

    const reportText = clinicalResponse.choices[0]?.message?.content || '';

    // Save to DB
    if (req.userId) {
      await query(
        'INSERT INTO reports (user_id, grade, report_text) VALUES (?, ?, ?)',
        [req.userId, grade_parsed || null, reportText]
      );
      console.log(`[analyzeController] Report saved for user ${req.userId} ✓`);
    }

    // Return in same format as OpenAI response so frontend works unchanged
    res.json(clinicalResponse);

  } catch (error: any) {
    console.error('[analyzeController] Error:', error?.message);
    const status = error?.status || 500;
    res.status(status).json({ error: error?.message || 'Internal server error' });
  }
}
