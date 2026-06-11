// API calls go through the local backend proxy to avoid CORS issues
const API_BASE = "/api";

export interface AnalysisResult {
  report: string;
  image?: string;
  summary: {
    alignment: string;
    lineQuality: string;
    lineFormation: string;
    mechanics: string;
    spellingErrors: string[];
    dysgraphiaIndicators: string[];
    assessmentRecommendation: string;
    probabilityEstimate: string;
    spellingScore: string;
    academicDiscrepancy: string;
    horizontalAnalysis: string;
    verticalAnalysis: string;
    wordCount: number;
    transcription: string;
    fluencyAnalysis: string;
    wpm: number;
    basalLevel: string;
    ceilingLevel: string;
    languageSkills: {
      sentenceBoundaries: string;
      grammar: string;
      pastTenseUsage: string;
    };
    scores: {
      alignment: number;
      lineQuality: number;
      mechanics: number;
      spelling: number;
      horizontal: number;
      vertical: number;
      spatialOrganisation: number;
      writingSpeed: number;
      letterFormation: number;
      grammar: number;
      sentenceBoundaries: number;
      pastTenseUsage: number;
    };
  };
}

export interface InterventionHistory {
  tried: boolean;
  improved: 'yes' | 'no' | 'partial';
  details: string;
}

export async function analyzeHandwriting(
  imageBase64: string,
  grade: string,
  studentContext?: string,
  observations?: string[],
  dataSources?: string[],
  timeTaken?: number,
  age?: string,
  interventionHistory?: InterventionHistory,
  knownDiagnoses?: string[],
  writingPrompt?: string,
  paperType?: string,
  writingInstrument?: string,
  wordCountInput?: string,
  timeGiven?: number,
  observationalNotes?: string
): Promise<AnalysisResult> {
  const model = "gpt-4o";
  
    const prompt = `
    You are an expert in Educational Psychology, Occupational Therapy, and Special Education, specializing in Dysgraphia and Specific Learning Disabilities (SLD).
    
    Analyze the provided handwriting sample for a student.
    **Student Demographics & Writing Sample Details**:
    - Grade: ${grade}
    ${age ? `- Chronological Age: ${age}` : ""}
    ${timeGiven ? `- Time Given (Allotted Time): ${timeGiven} minutes` : ""}
    ${timeTaken ? `- Time Taken (Actual Time Spent): ${timeTaken} minutes` : ""}
    ${writingPrompt ? `- Writing Prompt/Task Given: ${writingPrompt}` : ""}
    ${paperType ? `- Paper Type: ${paperType}` : ""}
    ${writingInstrument ? `- Writing Instrument: ${writingInstrument}` : ""}
    ${wordCountInput ? `- Student Word Count (Manual Count): ${wordCountInput}` : ""}
    ${knownDiagnoses && knownDiagnoses.length > 0 ? `- Known Diagnoses: ${knownDiagnoses.join(", ")}` : ""}
    
    ${studentContext ? `Additional Student Context: ${studentContext}` : ""}
    ${observationalNotes ? `Assessor's Observational Notes: ${observationalNotes}` : ""}
    ${observations && observations.length > 0 ? `Checkbox Clinical Observations: ${observations.join(", ")}` : ""}
    ${dataSources && dataSources.length > 0 ? `Available Data Sources: ${dataSources.join(", ")}` : ""}
    
    **Response to Intervention (RTI) History**:
    ${interventionHistory?.tried 
      ? `- Interventions Tried: Yes
- Improvement Observed: ${interventionHistory.improved.toUpperCase()}
- Intervention Details: ${interventionHistory.details}`
      : "- Interventions Tried: No / Not Reported"}
    
    **CRITICAL: Parent-Friendly Language**: Your report must be written in a supportive, clear, and accessible tone for parents. Avoid or clearly explain technical jargon. The goal is to empower parents with understanding.
    
    **STRICT FORMATTING REQUIREMENTS**:
    1. The report MUST start with the title: "Writing Assessment Report".
    2. Use BOLD text ONLY for headings and sub-headings (e.g., **1. Heading Name**). Do not use bold text within paragraphs.
    3. DO NOT use any BULLET SYMBOLS (no * or - for lists). Instead, use numbered lists (1., 2., etc.) or plain paragraphs.
    4. Use a formal, professional, yet accessible tone.
    5. Ensure all numbers are aligned with the text.
    
    **Diagnostic Framework**: Your analysis should be informed by the DSM-5 criteria for Specific Learning Disorder (with impairment in written expression), the Texas Dyslexia Handbook (2018), and established dysgraphia evaluation areas. You MUST also apply the Response to Intervention (RTI) model.
    
    **RTI Model Rule**: If corrective measures (interventions) have been implemented and the child has shown significant improvement (Response to Intervention), you SHOULD NOT recommend a formal psycho-educational evaluation at this time. Instead, recommend continued monitoring and support. Only recommend a formal evaluation if the child has NOT improved despite targeted interventions.
    
    **Orientation Note**: If the image is not oriented correctly, please mentally rotate it to the correct upright position before performing the analysis.
    
    **Clinical Validity Requirement (75 Words)**: A clinically standard dyslexia/dysgraphia screening typically requires a sample of at least 75 words for reliable qualitative and quantitative analysis. 
    1. Count the words accurately.
    2. If the sample is less than 75 words, you MUST include a "VALIDITY WARNING" at the very beginning of the report (after the title) clearly explaining that the provided sample is below the recommended 75-word threshold, which may limit the reliability of certain quantitative metrics (like WPM) and qualitative patterns.
    
    **Transcription Accuracy & OCR Precision**:
    - Act as a high-precision OCR engine. You MUST transcribe the handwriting character-by-character.
    - **DO NOT AUTOCORRECT**: If a student spells "those" as "thouse", or "citizens" as "ciezens", your transcription MUST reflect exactly what is on the page.
    - **CANCELLED WORDS**: If text is crossed out, struck through, or cancelled by the student, YOU MUST STILL TRANSCRIBE IT but wrap it in brackets like this: [cancelled: transcribed_word].
    - Preserving these errors and cancellations is CRITICAL for diagnostic accuracy and understanding the student's self-correction process.

    Provide a comprehensive analysis covering:
    
    1. Handwriting Mechanics & Geometric Elements (explained simply):
       - Letter Formation Analysis: Evaluate correct shape, directionality, size, legibility, and consistency relative to Grade ${grade}.
       - Alignment Analysis: Evaluate if writing stays on the line, has a stable baseline, and follows margins.
       - Spatial Organisation Analysis: Evaluate appropriate spacing between letters, words, and lines, as well as overall page organization.
       - Writing Speed Analysis: Evaluate if there is adequate output within the given time, checking for fluency and task completion.
       - Horizontal Spatial Analysis: How the writing moves across the page.
       - Vertical Spatial Analysis: How the writing is organized from top to bottom.
       - Line Quality: How the pen/pencil was used (pressure, tremor, flow).
       - Line Formation: Geometric construction of letters.
    
    2. Written Language Skills Diagnostic Table:
       - Sentence Boundaries: Analyze use of capitals, punctuation, and complete sentence separation.
       - Grammar: Analyze sentence structure, word order, agreement, syntax.
       - Past Tense Usage: Evaluate correct use of regular/irregular past tense in context.
       - Assign scores and descriptive comments for each.

    3. Clinical Developmental Levels:
       - Basal Level: Identify skills that are consistently demonstrated by the student.
       - Ceiling Level: Identify the highest level of performance reached before breakdown or errors increase significantly. Note: For a clinical indication of dysgraphia, the functional ceiling must be at least 2 grade levels below the current Grade ${grade}.
    
    4. Dysgraphia Threshold Rule:
       - **CRITICAL**: For calculating "Dysgraphia Features" or probability, all parameters (Letter Formation, Spelling, Fluency, etc.) must be at least 2 grade levels below the expected norms for Grade ${grade}. Explicitly state when a skill falls below this threshold.

    5. Transcription & Spelling Accuracy:
       - **Full Verbatim Transcription**: Provide the text exactly as written, preserving all misspellings, capitalization errors, punctuation, and [cancelled: words].
       - Identify specific spelling patterns: 
         - Phonetic substitutions (e.g., "thouse" for "those", "ciezens" for "citizens").
         - Missing letters, extra letters, or letter swapping.
         - Identifying specific "High-Frequency" word errors.
       - **GRADE LEVEL DISCREPANCY**: For every spelling error, determine its approximate grade level. Explicitly flag and list any words that are spelled at a level 2 or more grade levels below the student's current Grade ${grade}.
       - Explain these patterns in simple terms related to orthographic processing or phonological awareness.
       - Spelling Score: Provide a qualitative spelling score relative to the expected performance for Grade ${grade}. Use a scale like: "Significantly Below Grade Level", "Below Grade Level", "At Grade Level", "Above Grade Level". Provide a brief, supportive justification.
    
    3. Academic Discrepancy Analysis:
       - Evaluate if the writing sample is at least two grade levels below the student's expected ability for Grade ${grade} in the following areas:
         - Spelling accuracy and patterns.
         - Writing Fluency (speed and ease of production).
         - Grammar and Punctuation (sentence structure, capitalization, ending marks).
         - Ideation (clarity of thought, organization of ideas, vocabulary usage).
       - Explicitly state if the sample appears to be "at least two grade levels below" in any of these specific areas.
    
    4. Fluency Analysis (Words Per Minute):
       - Calculate the writing speed in Words Per Minute (WPM) using the formula: Total Words / Time Taken.
       - Compare this to standard fluency norms for Grade ${grade}.
       - Standard Norms Reference (Approximate):
         - Grade 1: 5-10 WPM
         - Grade 2: 8-12 WPM
         - Grade 3: 10-15 WPM
         - Grade 4: 12-18 WPM
         - Grade 5: 15-20 WPM
         - Grade 6-12: 20-30 WPM
         - College (13th-15th Year): 30+ WPM
       - Provide a qualitative assessment of fluency (e.g., "Slow/Labored", "Developing", "Functional", "Fluent").
    
    5. Learning & Motor Indicators:
       - Integrate the provided Clinical Observations (if any) with the visual evidence in the sample.
       - Identify features that might suggest Dysgraphia or other learning needs based on DSM-5 criteria.
       - Note concerns related to fine motor control and spatial awareness.
    
    6. Clinical Interpretation & Next Steps (Supportive Tone):
       - Assessment Recommendation: Clearly explain if you recommend a formal "Psycho-Educational Assessment" and *why* in simple terms. **CRITICAL**: Follow the RTI rule—if interventions led to improvement, do not recommend an evaluation.
       - Probability Estimate: Provide a qualitative estimate (Low, Moderate, High) of the likelihood that a formal assessment would find a specific learning need (Dysgraphia/SLD in Written Expression) based on DSM-5 criteria. **CRITICAL**: Be very specific in your reasoning. Mention specific observed traits such as "poor formation of letters", "irregular letter sizing", "difficulty with line orientation", or "inconsistent spacing". Explicitly address the "at least two grade levels below" criteria and the RTI findings in your reasoning. Use precise clinical language for dysgraphia traits while keeping the overall tone parent-friendly.
       - Actionable Strategies: Provide 3-5 specific things a parent or teacher can do *immediately* to help the student.
    
    **Word Count & OCR Transcription**:
    - Please provide a full, machine-readable transcription of the handwriting in the sample.
    - Count the total number of words based on this transcription.
    ${timeTaken ? `- Based on the provided Time Taken (${timeTaken} minutes), calculate the writing speed in words per minute.` : ""}

    - **OCR Precision**: You are a forensic OCR specialist. Look for every single stroke. If a letter is ambiguous, note it.
    - **Visual Evidence**: Every finding in your report MUST point back to visual evidence in the image. If you say "irregular letter sizing", it must be clearly visible in the provided sample.
    - **Grade Level Accuracy**: You have been programmed with standard spelling grade level lists. Use them strictly to determine if a word is reaching the "2 grade levels below" threshold.

    Format the output as a structured report in Markdown.
    Also, provide a JSON summary at the end of the response with the following structure:
    \`\`\`json
    {
      "alignment": "simple summary",
      "lineQuality": "simple summary",
      "lineFormation": "simple summary",
      "mechanics": "simple summary",
      "spellingErrors": ["erroneous_word (intended_word) - approximate grade level: X", "ciezens (citizens) - level: 2nd grade"],
      "dysgraphiaIndicators": ["indicator1", "indicator2"],
      "assessmentRecommendation": "Clear recommendation with simple reasoning",
      "probabilityEstimate": "Low/Moderate/High with specific reasoning mentioning traits like poor letter formation, etc.",
      "spellingScore": "Qualitative score with simple reasoning",
      "academicDiscrepancy": "Summary of whether the sample is at least two grade levels below in spelling, fluency, grammar, punctuation, or ideation",
      "horizontalAnalysis": "simple summary of horizontal spacing",
      "verticalAnalysis": "simple summary of vertical spacing",
      "wordCount": number (total words counted),
      "transcription": "Full machine-readable text from the image",
      "fluencyAnalysis": "Qualitative assessment of fluency based on WPM norms",
      "wpm": number (calculated words per minute),
      "basalLevel": "Description of consistently demonstrated skills",
      "ceilingLevel": "Description of highest level before breakdown",
      "languageSkills": {
        "sentenceBoundaries": "Descriptive comment",
        "grammar": "Descriptive comment",
        "pastTenseUsage": "Descriptive comment"
      },
      "scores": {
        "alignment": number (0-100),
        "lineQuality": number (0-100),
        "mechanics": number (0-100),
        "spelling": number (0-100),
        "horizontal": number (0-100),
        "vertical": number (0-100),
        "spatialOrganisation": number (0-100),
        "writingSpeed": number (0-100),
        "letterFormation": number (0-100),
        "grammar": number (0-100),
        "sentenceBoundaries": number (0-100),
        "pastTenseUsage": number (0-100)
      }
    }
    \`\`\`
  `;

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = (errData as any)?.error || `HTTP ${response.status}`;
      if (response.status === 429) {
        throw new Error("API_QUOTA_EXCEEDED: The AI service is currently busy or the rate limit has been reached. Please wait a minute and try again.");
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const text = data.choices[0]?.message?.content || "";
    
    if (!text.trim()) {
      throw new Error("AI returned an empty response. This may be due to safety filters or image clarity issues.");
    }
    
    // Extract JSON summary
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    let summary = {
      alignment: "Not analyzed",
      lineQuality: "Not analyzed",
      lineFormation: "Not analyzed",
      mechanics: "Not analyzed",
      spellingErrors: [],
      dysgraphiaIndicators: [],
      assessmentRecommendation: "Not analyzed",
      probabilityEstimate: "Not analyzed",
      spellingScore: "Not analyzed",
      academicDiscrepancy: "Not analyzed",
      horizontalAnalysis: "Not analyzed",
      verticalAnalysis: "Not analyzed",
      wordCount: 0,
      transcription: "Not available",
      fluencyAnalysis: "Not analyzed",
      wpm: 0,
      basalLevel: "Not analyzed",
      ceilingLevel: "Not analyzed",
      languageSkills: {
        sentenceBoundaries: "Not analyzed",
        grammar: "Not analyzed",
        pastTenseUsage: "Not analyzed",
      },
      scores: {
        alignment: 0,
        lineQuality: 0,
        mechanics: 0,
        spelling: 0,
        horizontal: 0,
        vertical: 0,
        spatialOrganisation: 0,
        writingSpeed: 0,
        letterFormation: 0,
        grammar: 0,
        sentenceBoundaries: 0,
        pastTenseUsage: 0,
      },
    };

    if (jsonMatch) {
      try {
        summary = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse summary JSON", e);
      }
    }

    // Remove the JSON block from the report text for cleaner display
    const report = text.replace(/```json\s*[\s\S]*?\s*```/, "").trim();

    return {
      report,
      summary,
    };
  } catch (error: any) {
    console.error("OpenAI Analysis Error:", error);
    
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("rate limit")) {
      throw new Error("API_QUOTA_EXCEEDED: The AI service is currently busy or the rate limit has been reached. Please wait a minute and try again.");
    }
    
    if (errorMessage.toLowerCase().includes("safety")) {
      throw new Error("SAFETY_FILTER: The analysis could not be completed because the content triggered a safety filter. Please ensure the image is clear and contains educational content.");
    }

    throw error;
  }
}
