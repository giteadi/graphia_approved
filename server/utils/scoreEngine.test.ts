import { calculateScoresWithNorm, calculateProbability, EvidenceData } from './scoreEngine.js';

const g10ReferenceEvidence: EvidenceData = {
  transcription: 'Reference My Family sample',
  wordCount: 125,
  confirmedCancellations: [],
  uncertainCancellations: [],
  spellingErrors: [
    { written: 'get-togethir', intended: 'get-together', gradeLevel: 'below grade' },
    { written: 'theire', intended: 'their', gradeLevel: 'below grade' },
    { written: 'function', intended: 'functions', gradeLevel: 'below grade' },
    { written: 'get-togthr', intended: 'get-together', gradeLevel: 'below grade' },
    { written: 'lifes', intended: 'lives', gradeLevel: 'below grade' },
    { written: 'alot', intended: 'a lot', gradeLevel: 'below grade' },
    { written: 'ad', intended: 'and', gradeLevel: 'below grade' },
  ],
  grammarMistakes: [
    { type: 'syntax', example: 'met and talk about thing that are happening' },
    { type: 'agreement', example: 'family function' },
    { type: 'plural', example: 'our lifes' },
  ],
  runOnSentences: 0,
  missingCapitals: 1,
  missingPunctuation: 2,
  pastTenseErrors: 2,
  letterFormationObservations: [
    'inconsistent letter formation',
    'variable letter size',
    'irregular joins and closures',
  ],
  alignmentObservations: ['slight baseline drift'],
  spacingObservations: [],
  lineQualityObservations: [],
  wpm: 8,
  rtiImprovement: false,
  dsm5Traits: [],
};

const scores = calculateScoresWithNorm(g10ReferenceEvidence, 'Grade 11');
const probability = calculateProbability(scores, false, g10ReferenceEvidence.wpm, 'Grade 11');

const expected = {
  sentenceBoundaries: 85,
  grammar: 50,
  pastTenseUsage: 60,
  spelling: 94,  // Updated: (125 - 7) / 125 * 100 = 118/125 * 100 = 94.4 ≈ 94
  letterFormation: 65,
  alignment: 75,
  writingSpeed: 40,
  probability: 'MODERATE',
};

const actual = {
  sentenceBoundaries: scores.sentenceBoundaries,
  grammar: scores.grammar,
  pastTenseUsage: scores.pastTenseUsage,
  spelling: scores.spelling,
  letterFormation: scores.letterFormation,
  alignment: scores.alignment,
  writingSpeed: scores.writingSpeed,
  probability,
};

for (const [key, value] of Object.entries(expected)) {
  if (actual[key as keyof typeof actual] !== value) {
    throw new Error(`g10 reference calibration failed for ${key}: expected ${value}, got ${actual[key as keyof typeof actual]}`);
  }
}

console.log('g10 reference score calibration passed:', JSON.stringify(actual));
