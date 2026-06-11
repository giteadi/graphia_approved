// API calls go through the local backend proxy (OpenAI) to avoid CORS issues
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
  timeGiven?: number,
  observationalNotes?: string
): Promise<AnalysisResult> {
  const model = "gpt-4o";
  
    const prompt = [
      'GraphiaCheck handwriting analysis request.',
      '- Grade: ' + grade,
      age ? '- Chronological Age: ' + age : '',
      timeGiven ? '- Time Given (Allotted Time): ' + timeGiven + ' minutes' : '',
      timeTaken ? '- Time Taken (Actual Time Spent): ' + timeTaken + ' minutes' : '',
      writingPrompt ? '- Writing Prompt/Task Given: ' + writingPrompt : '',
      paperType ? '- Paper Type: ' + paperType : '',
      writingInstrument ? '- Writing Instrument: ' + writingInstrument : '',
      knownDiagnoses && knownDiagnoses.length > 0 ? '- Known Diagnoses: ' + knownDiagnoses.join(', ') : '',
      studentContext ? 'Additional Student Context: ' + studentContext : '',
      observationalNotes ? "Assessor's Observational Notes: " + observationalNotes : '',
      observations && observations.length > 0 ? 'Checkbox Clinical Observations: ' + observations.join(', ') : '',
      dataSources && dataSources.length > 0 ? 'Available Data Sources: ' + dataSources.join(', ') : '',
      'Response to Intervention (RTI) History:',
      interventionHistory?.tried
        ? '- Interventions Tried: Yes\n- Improvement Observed: ' + interventionHistory.improved.toUpperCase() + '\n- Intervention Details: ' + interventionHistory.details
        : '- Interventions Tried: No / Not Reported',
    ].filter(Boolean).join('\n');

  try {
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        grade: grade,
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
    
    // Check for rate limit / quota errors
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
