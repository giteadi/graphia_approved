import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  ImageRun, 
  AlignmentType, 
  HeadingLevel,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { domToPng } from 'modern-screenshot';
import { 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { 
  Upload, 
  FileText, 
  Activity, 
  AlertCircle, 
  ChevronRight, 
  Loader2,
  Camera,
  GraduationCap,
  ClipboardCheck,
  Stethoscope,
  Printer,
  Info,
  RotateCw,
  Download,
  Crop as CropIcon,
  Check,
  X,
  BarChart3,
  Type,
  FolderOpen,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Mic,
  Video,
  PhoneOff,
  User,
  Maximize2,
  Scan,
  ExternalLink,
  RefreshCw,
  Globe,
  Share2,
  Link as LinkIcon,
  Settings,
  RotateCcw,
  Target,
  TrendingUp,
  Clipboard,
  Pen,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getProbabilityDisplayLabel = (probabilityEstimate = '') => {
  const label = probabilityEstimate.toUpperCase();
  if (label.includes('MILD-MODERATE') || label.includes('NEEDS MONITORING')) {
    return 'MILD-MODERATE';
  }
  if (label.includes('HIGH')) return 'HIGH';
  if (label.includes('MODERATE')) return 'MODERATE';
  return 'LOW';
};
import ReactMarkdown from 'react-markdown';
import { analyzeHandwriting, AnalysisResult, InterventionHistory } from './services/gemini';

const GRADES = [
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  "13th Year (First Year of College)",
  "14th Year (Second Year of College)",
  "15th Year (Third Year of College)"
];

const OBSERVATIONS = [
  "Slow or labored written work",
  "Poor formation of letters",
  "Poor pencil grip",
  "Inadequate pressure (too hard or too soft)",
  "Excessive erasures",
  "Poor spacing between letters and/or words",
  "Inability to copy words accurately",
  "Avoidance of written tasks",
  "Inability to recall accurate orthographic patterns",
  "Difficulty with visual-motor integrated sports/activities"
];

const DATA_SOURCES = [
  "Writing Samples",
  "Occupational Therapy",
  "Educational Psychology",
  "Pediatrician",
  "Physiotherapist",
  "Teacher",
  "Parents"
];

interface VisualAnalysisProps {
  scores: AnalysisResult['summary']['scores'];
}

interface SavedReport {
  id: string;
  date: string;
  grade: string;
  age?: string;
  studentName?: string;
  schoolName?: string;
  cityName?: string;
  countryName?: string;
  uploadedBy?: string;
  contactEmail?: string;
  contactPhone?: string;
  interventionHistory?: InterventionHistory;
  result: AnalysisResult;
  image?: string | null;
  timeTaken?: string;
  observations: string[];
  dataSources: string[];
  writingPrompt?: string;
  wordCountInput?: string;
  paperType?: string;
  writingInstrument?: string;
  timeGiven?: string;
  observationalNotes?: string;
}

const ScoreIndicator = ({ score, label }: { score: number; label: string }) => {
  let color = "bg-gray-400";
  let textColor = "text-gray-700";
  let status = "Needs Support";
  
  if (score >= 85) {
    color = "bg-blue-600";
    textColor = "text-blue-800";
    status = "Excellent";
  } else if (score >= 70) {
    color = "bg-blue-400";
    textColor = "text-blue-700";
    status = "Average";
  }

  return (
    <div className="flex flex-col items-center p-2 border border-[#141414] bg-white">
      <span className="text-[8pt] font-mono uppercase opacity-60 mb-1">{label}</span>
      <div className={`w-3 h-3 rounded-full ${color} mb-1 shadow-sm`} />
      <span className="text-lg font-bold leading-none">{score}</span>
      <span className={`text-[7pt] font-bold uppercase mt-1 ${textColor}`}>{status}</span>
    </div>
  );
};

const VisualAnalysis = ({ scores }: VisualAnalysisProps) => {
  // Strengths vs Needs Data
  const splitData = [
    { name: 'Alignment', score: scores.alignment },
    { name: 'Spatial Org', score: scores.spatialOrganisation },
    { name: 'Writing Speed', score: scores.writingSpeed },
    { name: 'Letter Formation', score: scores.letterFormation },
    { name: 'Grammar', score: scores.grammar },
    { name: 'Sentence Bound', score: scores.sentenceBoundaries },
    { name: 'Past Tense', score: scores.pastTenseUsage },
  ];

  // Benchmark norms (example for Grade 3 as requested, but we can make it dynamic or use generic)
  const benchmarkData = [
    { skill: 'Writing Speed', student: scores.writingSpeed, norm: 75 }, // Norm is a "grade level" target
    { skill: 'Spelling', student: scores.spelling, norm: 80 },
    { skill: 'Grammar', student: scores.grammar, norm: 85 },
  ];

  return (
    <div className="space-y-4 visual-analysis-container">
      {/* Score Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        <ScoreIndicator score={scores.alignment} label="Alignment" />
        <ScoreIndicator score={scores.lineQuality} label="Line Quality" />
        <ScoreIndicator score={scores.letterFormation} label="Formation" />
        <ScoreIndicator score={scores.spelling} label="Spelling" />
        <ScoreIndicator score={scores.grammar} label="Grammar" />
        <ScoreIndicator score={scores.writingSpeed} label="Speed" />
        <ScoreIndicator score={scores.mechanics} label="Mechanics" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths vs Needs Support Split Chart */}
        <div className="border border-[#141414] p-3 bg-white">
          <h4 className="font-mono text-[9pt] uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-[#141414] pb-1">
            <Activity className="w-4 h-4" /> Strengths vs Needs Support
          </h4>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={splitData}
                layout="vertical"
                margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#141414' }}
                  width={85}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#E4E3E0', border: '1px solid #141414', fontFamily: 'monospace', fontSize: '9pt', padding: '4px' }}
                />
                <Bar dataKey="score" radius={[0, 2, 2, 0]} isAnimationActive={false}>
                  {splitData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.score >= 85 ? '#2563eb' : entry.score >= 70 ? '#60a5fa' : '#9ca3af'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benchmark Comparison Graph */}
        <div className="border border-[#141414] p-3 bg-white">
          <h4 className="font-mono text-[9pt] uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-[#141414] pb-1">
            <BarChart3 className="w-4 h-4" /> Benchmark Comparison
          </h4>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={benchmarkData}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis 
                  dataKey="skill" 
                  tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#141414' }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#141414' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#E4E3E0', border: '1px solid #141414', fontFamily: 'monospace', fontSize: '9pt', padding: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }} />
                <Bar name="Student" dataKey="student" fill="#141414" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar name="Grade Norm" dataKey="norm" fill="#141414" fillOpacity={0.2} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const TOUR_STEPS = [
  {
    title: "Welcome to GraphiaCheck Demo 🎓",
    text: "Welcome to GraphiaCheck! This clinical diagnostic tool evaluates handwriting samples for characteristics associated with dysgraphia. It is fully calibrated and suitable for students from Grade 1 all the way to the 15th Year (which is the Third Year of College). Note that a minimum writing sample of 75 to 100 words is required for a clinically valid screening, and the sample must be captured with absolute clarity for accurate structural modeling.",
    voiceText: "Welcome to GraphiaCheck! This clinical diagnostic tool evaluates handwriting samples. It is fully calibrated and suitable for students from Grade One all the way to the Fifteenth Year, which is the Third Year of College. For a clinically valid screening, please ensure that a handwriting sample of at least 75 to 100 words is uploaded, and is captured with absolute clarity and focus.",
    targetId: ""
  },
  {
    title: "1. Handwriting Sample Input 📝",
    text: "Here is where you upload or capture the student's writing sample. You can select an image file, use your webcam to capture live work, or paste an image from your clipboard. Remember that at least 75 to 100 words are required for the AI engine to accurately model letter forms. To ensure high accuracy, the image must have excellent clarity, be well-lit, direct-angle, flat, and free of shadow or blur.",
    voiceText: "First, you will upload or capture the student's writing sample. Remember, at least 75 to 100 words are required so that our diagnostic engine can accurately assess spacing and alignment. Please ensure the image has high clarity, with clean lighting, a flat direct angle, and no shadows or blur.",
    targetId: "tour-sample-input"
  },
  {
    title: "2. Student Details & Timing ⏳",
    text: "In this section, fill in the student's details, including their Name, School, Date of Birth, and school Grade (supporting Grade 1 to 15th Year of college). Crucially, input the 'Time Taken' for writing. This is combined with the automatic word count to calculate the student's writing speed in Words Per Minute (WPM).",
    voiceText: "Second, enter the student's demographic details, including their Grade, supporting up to College 15th Year. Be sure to specify the actual physical time taken so our clinical engine can automatically calculate the student's writing speed in Words Per Minute.",
    targetId: "tour-student-details"
  },
  {
    title: "3. Checkbox Observations & Data Sources 🔍",
    text: "Select any direct clinical observations noted during writing (like poor pencil grip or fatigue) as well as other supporting data sources (such as parents, occupational therapy, or educational psychologists). These provide critical contextual layers that the assessment engine uses to generate parent-friendly clinical recommendations.",
    voiceText: "Third, check any physical observations noticed during the assessment, such as poor pencil grip or heavy writing pressure. You can also select other diagnostic data sources to give our assessment engine more clinical context.",
    targetId: "tour-clinical-observations"
  },
  {
    title: "4. Neural Diagnostic Engine ⚡",
    text: "Once the details and writing sample are ready, click 'Generate Clinical Report' (or press Ctrl + Enter) to trigger the analysis. The engine will read the verbatim handwriting, identify spelling patterns relative to grade-level norms, generate a 4-page diagnostic report, plot domain scores, and output a clinical recommendation.",
    voiceText: "Finally, click the Generate Clinical Report button to activate the clinical diagnostic engine. The AI will evaluate spelling errors relative to grade norms, measure spacing, and generate a four page PDF report with visual scoreboards.",
    targetId: "tour-generate-button"
  },
  {
    title: "5. Try the One-Click Demo Mode! 🚀",
    text: "Would you like to instantly see the complete 4-page clinical report, radar charts, spacing metrics, verbatim transcription, spelling pattern discrepancies, and PDF/Word download options? Click the button below to load pre-calculated demo data and see GraphiaCheck in action immediately!",
    voiceText: "Would you like to see a real four-page clinical report right now? Click the Load Demo Case button below to pre fill the system with representative student data and view an immediate assessment report.",
    targetId: "tour-generate-button"
  }
];

const DEFAULT_DISCLAIMER = "THIS REPORT WAS GENERATED USING AN AI-POWERED TOOL THAT ANALYZES HANDWRITING SAMPLES FOR CHARACTERISTICS ASSOCIATED WITH DYSGRAPHIA. PLEASE NOTE THAT THE HANDWRITING SAMPLES SUBMITTED FOR ANALYSIS MUST BE SUFFICIENTLY LEGIBLE FOR THE AI-POWERED TOOL TO PROCESS AND GENERATE AN ACCURATE REPORT. ILLEGIBLE OR UNCLEAR SAMPLES MAY AFFECT THE QUALITY AND RELIABILITY OF THE FINDINGS. BEFORE BEING SHARED, THE AI-GENERATED FINDINGS IN THIS REPORT WERE CAREFULLY REVIEWED AND VETTED BY A SPECIAL EDUCATOR-(LEARNING DISABILITIES SPECIALIST) TO ENSURE ACCURACY, CLINICAL RELEVANCE, AND APPROPRIATENESS.";

const parseSpellingError = (errorStr: string) => {
  let raw = errorStr;
  let correct = "";
  let discrepancy = "";
  
  // Try regex: matches "impatant (important) - level: 3rd grade" or "impatant (important) - approximate grade level: 3rd grade"
  const parenMatch = errorStr.match(/^([^(]+)\s*\(([^)]+)\)\s*(?:-|:)\s*(.+)$/i);
  if (parenMatch) {
    raw = parenMatch[1].trim();
    correct = parenMatch[2].trim();
    discrepancy = parenMatch[3].trim();
  } else {
    const spaceParenMatch = errorStr.match(/^([^(]+)\s*\(([^)]+)\)/i);
    if (spaceParenMatch) {
      raw = spaceParenMatch[1].trim();
      correct = spaceParenMatch[2].trim();
      const after = errorStr.substring(spaceParenMatch[0].length);
      discrepancy = after.replace(/^[^a-zA-Z0-9]+/, "").trim();
    } else {
      // Fallback split
      const parts = errorStr.split(/[-:()]/);
      if (parts.length >= 2) {
        raw = parts[0].trim();
        correct = parts[1].trim();
        discrepancy = parts.slice(2).join(' ').trim();
      }
    }
  }

  // Clean discrepancy labels to look like screenshots (e.g. "Gr 3 below"):
  let cleanDisc = discrepancy;
  if (cleanDisc.toLowerCase().includes("grade") || cleanDisc.toLowerCase().includes("gr")) {
    const numMatch = cleanDisc.match(/\b\d+\b/);
    if (numMatch) {
      cleanDisc = `Gr ${numMatch[0]} below`;
    }
  } else if (!cleanDisc) {
    cleanDisc = "Below level";
  }

  return {
    raw: raw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ""), // strip punctuation
    correct: correct || raw,
    discrepancy: cleanDisc
  };
};

const DEFAULT_STRATEGIES = [
  "Provide lined paper or paper with raised tactile lines to help the student maintain a straight baseline and judge letter size.",
  "Allow the student to type assignments or use speech-to-text software for longer written tasks, so ideas are not blocked by the physical struggle of handwriting.",
  "Do not grade the student down for spelling errors on rough drafts. Provide a customized spelling dictionary of high-frequency words frequently missed (e.g. \"where\", \"friends\", \"important\").",
  "Provide extended time for all written tasks, as the current writing speed requires more time to demonstrate knowledge adequately."
];

const RenderTranscription = ({ text, spellingErrors = [] }: { text: string, spellingErrors?: string[] }) => {
  if (!text) return null;
  
  // Extract clean lowercase error words
  const errorWords = spellingErrors.map((err) => {
    const parsed = parseSpellingError(err);
    return parsed.raw.toLowerCase().trim();
  }).filter(Boolean);

  // Split text by [cancelled: ...] or [CANCELLED: ...] blocks
  const parts = text.split(/(\[(?:cancelled|CANCELLED):.*?\])/gi);
  
  return (
    <>
      {parts.map((part, idx) => {
        if (part && /^\[(?:cancelled|CANCELLED):/i.test(part) && part.endsWith(']')) {
          const content = part.replace(/^\[(?:cancelled|CANCELLED):\s*/i, '').replace(/\]$/, '');
          return (
            <span key={idx} className="text-gray-400 line-through mr-1 font-sans italic">
              {content}
            </span>
          );
        }
        
        // Otherwise, split normal text into words
        const words = part.split(/(\s+)/);
        return (
          <span key={idx}>
            {words.map((word, wordIdx) => {
              // Strip punctuation for matching
              const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").toLowerCase().trim();
              
              const isError = errorWords.includes(cleanWord) || 
                errorWords.some(errW => {
                  if (errW.length > 2 && cleanWord.length > 2) {
                    return errW === cleanWord || cleanWord === errW;
                  }
                  return false;
                });
              
              if (isError && cleanWord.length > 0) {
                return (
                  <span key={wordIdx} className="text-red-600 font-bold underline decoration-red-600/50 underline-offset-2">
                    {word}
                  </span>
                );
              }
              return <span key={wordIdx}>{word}</span>;
            })}
          </span>
        );
      })}
    </>
  );
};

const getGradeSpeedNorm = (gradeStr: string): string => {
  if (!gradeStr) return "20-30";
  const num = parseInt(gradeStr.replace(/\D/g, ''));
  if (isNaN(num)) return "20-30";
  if (num <= 1) return "5-10";
  if (num === 2) return "8-12";
  if (num === 3) return "10-15";
  if (num === 4) return "12-18";
  if (num === 5) return "15-20";
  return "20-30"; // 6-12
};

const getReportWpm = (summaryWpm: number | undefined, wordCount: number | undefined, timeTakenValue: string): number => {
  if (typeof summaryWpm === 'number' && Number.isFinite(summaryWpm) && summaryWpm > 0) {
    return Math.round(summaryWpm);
  }

  const minutes = parseFloat(timeTakenValue);
  if (wordCount && Number.isFinite(minutes) && minutes > 0) {
    return Math.round(wordCount / minutes);
  }

  return 0;
};

const reportValue = <T,>(value: T | null | undefined, fallback: T): T => {
  return value ?? fallback;
};

const getActionableStrategies = (reportText: string): string[] => {
  const strategies: string[] = [];
  
  if (!reportText) return DEFAULT_STRATEGIES;

  const lines = reportText.split('\n');
  let inStrategiesSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('strategy') || trimmed.toLowerCase().includes('recommendation') || trimmed.toLowerCase().includes('actionable')) {
      inStrategiesSection = true;
      continue;
    }
    if (inStrategiesSection && trimmed.startsWith('#')) {
      if (strategies.length >= 2) break;
    }
    if (inStrategiesSection) {
      const match = trimmed.match(/^(?:\d+\.|\*|-)\s+(.+)$/);
      if (match) {
        strategies.push(match[1]);
      } else if (trimmed.length > 40 && !trimmed.startsWith('#')) {
        strategies.push(trimmed);
      }
    }
  }

  const cleanStrategies = strategies
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('#') && !s.toLowerCase().includes('disclaimer') && !s.toLowerCase().includes('copyright'));

  if (cleanStrategies.length >= 3) {
    return cleanStrategies;
  }

  return DEFAULT_STRATEGIES;
};

import { AuthUser } from './services/authService';

interface AppProps {
  user: AuthUser;
  onLogout: () => void;
  reportTabMode?: boolean;
}

export default function App({ user, onLogout, reportTabMode = false }: AppProps) {
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [knownDiagnoses, setKnownDiagnoses] = useState<string[]>([]);
  const [writingPrompt, setWritingPrompt] = useState<string>('');
  const [wordCountInput, setWordCountInput] = useState<string>('');
  const [paperType, setPaperType] = useState<string>('Blank / Unlined');
  const [writingInstrument, setWritingInstrument] = useState<string>('');
  const [timeGiven, setTimeGiven] = useState<string>('');
  const [observationalNotes, setObservationalNotes] = useState<string>('');

  const DIAGNOSES_OPTIONS = [
    "Dyscalculia / Mathematics LD",
    "ADHD",
    "Autism Spectrum Disorder",
    "Dyspraxia / Motor Coordination Disorder",
    "ELL / Multilingual"
  ];

  const toggleDiagnosis = (diag: string) => {
    setKnownDiagnoses(prev => 
      prev.includes(diag) 
        ? prev.filter(d => d !== diag)
        : [...prev, diag]
    );
  };

  const [image, setImage] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [cityName, setCityName] = useState<string>('');
  const [countryName, setCountryName] = useState<string>('');
  const [uploadedBy, setUploadedBy] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [interventionTried, setInterventionTried] = useState<boolean>(false);
  const [interventionImproved, setInterventionImproved] = useState<'yes' | 'no' | 'partial'>('no');
  const [interventionDetails, setInterventionDetails] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [timeTaken, setTimeTaken] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [selectedObservations, setSelectedObservations] = useState<string[]>([]);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [customObservation, setCustomObservation] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVirtualSession, setIsVirtualSession] = useState(false);
  const [isUrlInput, setIsUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showSavedReports, setShowSavedReports] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [disclaimer, setDisclaimer] = useState<string>(() => {
    return localStorage.getItem('graphiacheck_disclaimer') || DEFAULT_DISCLAIMER;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Load saved reports on mount
  useEffect(() => {
    // If report tab — load from sessionStorage and jump to report view
    if (reportTabMode) {
      try {
        const savedResult = sessionStorage.getItem('graphia_report_result');
        const savedMeta = sessionStorage.getItem('graphia_report_meta');
        if (savedResult) {
          setResult(JSON.parse(savedResult));
          setActiveStep(4);
        }
        if (savedMeta) {
          const m = JSON.parse(savedMeta);
          if (m.studentName) setStudentName(m.studentName);
          if (m.schoolName) setSchoolName(m.schoolName);
          if (m.cityName) setCityName(m.cityName);
          if (m.countryName) setCountryName(m.countryName);
          if (m.uploadedBy) setUploadedBy(m.uploadedBy);
          if (m.contactEmail) setContactEmail(m.contactEmail);
          if (m.contactPhone) setContactPhone(m.contactPhone);
          if (m.grade) setGrade(m.grade);
          if (m.dob) setDob(m.dob);
          if (m.timeTaken) setTimeTaken(m.timeTaken);
          if (m.timeGiven) setTimeGiven(m.timeGiven);
          if (m.writingPrompt) setWritingPrompt(m.writingPrompt);
          if (m.paperType) setPaperType(m.paperType);
          if (m.writingInstrument) setWritingInstrument(m.writingInstrument);
          if (m.observationalNotes) setObservationalNotes(m.observationalNotes);
          if (m.interventionTried !== undefined) setInterventionTried(m.interventionTried);
          if (m.interventionImproved) setInterventionImproved(m.interventionImproved);
          if (m.interventionDetails) setInterventionDetails(m.interventionDetails);
          if (m.selectedObservations) setSelectedObservations(m.selectedObservations);
          if (m.selectedDataSources) setSelectedDataSources(m.selectedDataSources);
          if (m.knownDiagnoses) setKnownDiagnoses(m.knownDiagnoses);
        }
      } catch (_e) {}
      return;
    }

    const saved = localStorage.getItem('graphiacheck_reports');
    if (saved) {
      try {
        setSavedReports(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved reports', e);
      }
    }

    // Add paste listener for images
    const handlePaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        processFile(files[0]);
        return;
      }

      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              processFile(blob);
              return;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Persist disclaimer changes
  useEffect(() => {
    localStorage.setItem('graphiacheck_disclaimer', disclaimer);
  }, [disclaimer]);

  // Voice Speech Synthesis Handler
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Friendly conversational speed
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Hazel'))
      );
      if (friendlyVoice) {
        utterance.voice = friendlyVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Trigger voice narration on tour step changes
  useEffect(() => {
    if (tourStep === null) {
      stopSpeech();
      return;
    }

    const currentStep = TOUR_STEPS[tourStep];
    if (currentStep) {
      if (voiceEnabled) {
        // Small timeout to allow element transition & scrolling to complete
        const timer = setTimeout(() => {
          speakText(currentStep.voiceText);
        }, 400);
        return () => clearTimeout(timer);
      } else {
        stopSpeech();
      }
    }
  }, [tourStep, voiceEnabled]);

  // Element scrolling and pulsing highlighting for interactive guide
  useEffect(() => {
    if (tourStep === null) return;

    const currentStep = TOUR_STEPS[tourStep];
    if (currentStep && currentStep.targetId) {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add prominent highlight borders
        element.classList.add('ring-4', 'ring-indigo-600', 'ring-offset-2', 'transition-all', 'duration-500');
        
        return () => {
          element.classList.remove('ring-4', 'ring-indigo-600', 'ring-offset-2');
        };
      }
    }
  }, [tourStep]);

  // One-Click Demo Mode loader
  const loadDemoCaseData = () => {
    // 1. Fill student metadata and writing factors
    setStudentName("Lyes Difle");
    setSchoolName("Wellington International");
    setCityName("Wellington");
    setCountryName("New Zealand");
    setUploadedBy("MSL-Krutika Jaggi");
    setContactEmail("familledifle@gmail.com");
    setContactPhone("8767048973");
    setGrade("Grade 9");
    setDob("2011-08-16");
    setTimeGiven("9");
    setTimeTaken("12");
    setWritingPrompt("Favourite Sport");
    setPaperType("Blank / Unlined");
    setWritingInstrument("Fountain Pen");
    setObservationalNotes("Letter size and baseline alignment are highly variable. Letters drift down on unlined sheets. Student shows clear physical fatigue or grip tension after 5 minutes of sustained writing.");
    setKnownDiagnoses(["ADHD", "Dyspraxia / Motor Coordination Disorder"]);
    setSelectedObservations([
      "Slow or labored written work",
      "Poor formation of letters",
      "Poor spacing between letters and/or words",
      "Avoidance of written tasks"
    ]);
    setSelectedDataSources(["Writing Samples", "Teacher", "Parents"]);

    // Custom handwriting sample simulated inside an elegant SVG:
    const handwritingSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" style="background-color:%23FBFBFA;"><rect width="100%" height="100%" fill="%23FBFBFA"/><path d="M 50,110 C 65,95 80,120 95,110 C 110,100 125,115 135,105 M 145,115 C 150,95 155,125 160,110 M 170,115 C 175,100 185,120 190,110 C 200,100 210,125 220,115 M 235,130 C 240,100 245,140 250,120 M 265,125 C 275,105 285,135 295,125 M 50,175 C 65,160 80,185 95,170 C 110,155 125,190 140,175 M 150,170 C 160,150 170,190 180,175 C 190,160 200,180 210,170 M 220,170 C 230,155 240,185 250,165 M 50,235 C 70,215 90,255 110,230 C 130,205 145,250 160,225 C 175,200 190,245 205,230" stroke="%230E294F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="430" y="50" font-family="'Courier New', Courier, monospace" font-size="11" fill="%23888888" letter-spacing="1">DEMO SPECIMEN</text><line x1="50" y1="135" x2="320" y2="135" stroke="red" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/><line x1="50" y1="195" x2="320" y2="195" stroke="red" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/><line x1="50" y1="255" x2="320" y2="255" stroke="red" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/><text x="50" y="55" font-family="'Times New Roman', Times, serif" font-size="22" font-style="italic" fill="%230C2340" font-weight="bold">Lyes's Writing (Grade 9 Sample)</text></svg>`;
    setImage(handwritingSVG);

    // Realistic prefilled diagnostic response
    const demoResult: AnalysisResult = {
      report: `# Writing Assessment Report

**1. Demographic Details and Assessment Context**
Date of Assessment: June 3, 2026
Student Name: Lyes Difle
Chronological Age: 14 Years, 9 Months, 17 Days
Grade Assignment: Grade 9
Writing Prompt / Task: Favourite Sport
Paper Type utilized: Blank / Unlined
Time given: 9 minutes
Time taken: 12 minutes (Actual duration spent)
Word Count (Est.): 97 words
Words Per Minute (WPM): 8.1 WPM

**VALIDITY WARNING**: Although the student completed 97 words, which is within the recommended 75 to 100 word threshold, their writing speed of 8.1 WPM falls significantly below the Grade 9 norm of 20 to 25 words per minute.

**2. Handwriting Mechanics and Geometric Elements**
1. Letter Formation: Indiscriminate mixing of capital and lowercase letters. Letters exhibit major size inequalities and variable stroke directionality.
2. Letter Alignment: Clear downward drifting on blank paper with an unstable horizontal baseline.
3. Spatial Organisation: Spacing between separate words is highly inconsistent, with some words being crowded and others having wide gaps.
4. Line Quality: Heavy stroke pressure suggesting excessive fatigue and pencil-grip tension.

**3. Written Language Skills Diagnostic**
1. Sentence Boundaries: Sentence capitalization and punctuation are inconsistently applied. The student often omits trailing periods.
2. Grammar: Simple sentences are intact, but complex structures remain an obstacle. Syntactic spacing is compromised.
3. Past Tense Usage: Demonstrates good basic understanding of regular verb construction, but displays some awkward phrasing.

**4. Clinical Developmental Levels and Discrepancy**
1. Basal Level: Demonstrated capability sits at the Grade 6 to 7 level for simple sentence structures and word spelling.
2. Functional Ceiling: Performance breaks down under speedy or continuous writing. Functional ceiling is placed at least 2.5 years below the expected grade.
3. Response to Intervention (RTI): Classroom-level support has been tried, but coordination and speed remain severely limited, supporting high risk for dysgraphia.

**5. Formal Recommendations and Diagnostic Path**
A formal Psycho-Educational Assessment is highly recommended to confirm the diagnostic path of specific learning disability in written expression.
- Transition the student to keyboarding to reduce fatigue.
- Provide raised-line lined papers.
- Alleviate stress by offering 1.5x to 2x extended testing time.`,
      image: handwritingSVG,
      summary: {
        alignment: "Frequent base-line drifting with letters sinking below virtual horizontal baseline.",
        lineQuality: "Heavy pressure and micro-tremors are present, indicating severe hand fatigue and pencil-grip tension.",
        lineFormation: "Letter sizes vary wildly. Lowercase and uppercase forms are mixed together.",
        mechanics: "Poor letter form fluidity. Slow letter reproduction leads to fatigue.",
        spellingErrors: ["thouse (those) - Grade 4 level", "ciezens (citizens) - Grade 5 level", "plaiing (playing) - Grade 3 level"],
        dysgraphiaIndicators: ["Wildly varying letter sizes", "Frequent line drifting", "Heavy pencil pressure", "Extremely slow WPM output"],
        assessmentRecommendation: "A formal Psycho-Educational Assessment is highly recommended as previous classroom-level interventions have not resulted in progress.",
        probabilityEstimate: "High. The sample demonstrates a persistent cluster of classic dysgraphia characteristics.",
        spellingScore: "35 (Needs Support - falls significantly below Grade 9 expectations)",
        academicDiscrepancy: "The student's writing fluency and spelling accuracy are at least two to three grade levels below expected grade placement.",
        horizontalAnalysis: "Inconsistent horizontal letter spacing.",
        verticalAnalysis: "Poor vertical margin organization.",
        wordCount: 97,
        transcription: "I love plaiing football. It is my favorite sport to play with [cancelled: friend] friends at school. But thouse ciezens always scream...",
        fluencyAnalysis: "Extremely slow and labored writing speed of 8 WPM compared to Grade 9 norm of 20-25 WPM.",
        wpm: 8,
        basalLevel: "Student can formulate basic thoughts and write basic high-frequency sight words.",
        ceilingLevel: "Writing fluidity breaks down entirely under speed testing or sustained writing tasks.",
        languageSkills: {
          sentenceBoundaries: "Punctuation and capitalization are not yet automatic. Run-on sentences are frequent and periods are often omitted.",
          grammar: "Basic grammatical structure is present, but complex sentence construction and syntax spacing remain a major hurdle.",
          pastTenseUsage: "Correct use of regular past tense is demonstrated, with minor awkward spacing patterns on the page."
        },
        scores: {
          alignment: 50,
          lineQuality: 45,
          mechanics: 40,
          spelling: 35,
          horizontal: 48,
          vertical: 52,
          spatialOrganisation: 42,
          writingSpeed: 8,
          letterFormation: 45,
          grammar: 60,
          sentenceBoundaries: 50,
          pastTenseUsage: 75
        }
      }
    };

    setResult(demoResult);
    setActiveStep(4);
    setTourStep(null); // Close tour popup
    stopSpeech();
  };

  const resetForm = () => {
    setActiveStep(1);
    setKnownDiagnoses([]);
    setWritingPrompt('');
    setWordCountInput('');
    setPaperType('Blank / Unlined');
    setWritingInstrument('');
    setTimeGiven('');
    setObservationalNotes('');
    setImage(null);
    setStudentName('');
    setSchoolName('');
    setCityName('');
    setCountryName('');
    setUploadedBy('');
    setContactEmail('');
    setContactPhone('');
    setInterventionTried(false);
    setInterventionImproved('no');
    setInterventionDetails('');
    setGrade('');
    setTimeTaken('');
    setDob('');
    setResult(null);
    setError(null);
    setContext('');
    setSelectedObservations([]);
    setSelectedDataSources([]);
    setCustomObservation('');
    setRotation(0);
    setIsCropping(false);
    setIsUrlInput(false);
    setExternalUrl('');
    setSaveStatus('idle');
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the current analysis and reset the form?")) {
      resetForm();
    }
  };

  const saveReportToFolder = () => {
    if (!result) return;
    
    setSaveStatus('saving');
    
    const newReport: SavedReport = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      grade,
      age: chronologicalAge,
      studentName,
      schoolName,
      cityName,
      countryName,
      uploadedBy,
      contactEmail,
      contactPhone,
      interventionHistory: {
        tried: interventionTried,
        improved: interventionImproved,
        details: interventionDetails
      },
      result,
      image: image,
      timeTaken,
      observations: selectedObservations,
      dataSources: selectedDataSources,
      writingPrompt,
      wordCountInput,
      paperType,
      writingInstrument,
      timeGiven,
      observationalNotes
    };

    const updated = [newReport, ...savedReports];
    setSavedReports(updated);
    localStorage.setItem('graphiacheck_reports', JSON.stringify(updated));
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        // We no longer automatically clear the report after saving
        // This allows the user to continue reviewing it until they explicitly clear it or start a new analysis
      }, 2000);
    }, 500);
  };

  const deleteReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem('graphiacheck_reports', JSON.stringify(updated));
  };

  const loadReport = (report: SavedReport) => {
    // Ensure the result object has the image attached for the new persistent rendering logic
    const resultWithImage = { 
      ...report.result, 
      image: report.result.image || report.image || null 
    } as AnalysisResult;

    setResult(resultWithImage);
    setGrade(report.grade);
    setStudentName(report.studentName || '');
    setSchoolName(report.schoolName || '');
    setCityName(report.cityName || '');
    setCountryName(report.countryName || '');
    setUploadedBy(report.uploadedBy || '');
    setContactEmail(report.contactEmail || '');
    setContactPhone(report.contactPhone || '');
    setInterventionTried(report.interventionHistory?.tried || false);
    setInterventionImproved(report.interventionHistory?.improved || 'no');
    setInterventionDetails(report.interventionHistory?.details || '');
    setDob(''); // We don't store DOB for privacy, just the calculated age
    setImage(report.image || null);
    setTimeTaken(report.timeTaken || '');
    setSelectedObservations(report.observations);
    setSelectedDataSources(report.dataSources);
    setWritingPrompt(report.writingPrompt || '');
    setWordCountInput(report.wordCountInput || '');
    setPaperType(report.paperType || 'Blank / Unlined');
    setWritingInstrument(report.writingInstrument || '');
    setTimeGiven(report.timeGiven || '');
    setObservationalNotes(report.observationalNotes || '');
    setShowSavedReports(false);
    
    // Scroll to report
    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setError(null);
    
    // Check if we're in an iframe
    const inIframe = window.self !== window.top;

    if (!window.isSecureContext) {
      setError("Camera access requires a secure (HTTPS) connection. Please ensure you are using HTTPS.");
      setIsCameraOpen(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support camera access. Please try a modern browser like Chrome or Safari.");
      setIsCameraOpen(false);
      return;
    }

    try {
      // Helpful for waking up permission system in some browsers
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      if (!hasCamera) {
        console.warn("No camera device detected by enumerateDevices.");
      }
    } catch (e) {
      console.warn("Could not enumerate devices:", e);
    }

    // Try to query permission status if supported (not in Safari)
    if (navigator.permissions && (navigator.permissions as any).query) {
      try {
        // Querying camera permission can sometimes throw in restricted iframes
        const result = await (navigator.permissions as any).query({ name: 'camera' }).catch(() => null);
        if (result && result.state === 'denied') {
          setError("Camera permission is currently denied. Please check your browser's site settings to allow camera access.");
          setIsCameraOpen(false);
          return;
        }
      } catch (e) {
        // Fallback for browsers that don't support camera permission query
      }
    }

    try {
      // Try high-quality environment camera first
      // Some browsers/devices might reject 'environment' if they don't have it explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Primary camera access failed:", err);
      
      // Fallback 1: Just environment camera without resolution constraints
      try {
        const midStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = midStream;
        }
      } catch (midErr: any) {
        console.error("Mid-tier camera access failed:", midErr);
        
        // Fallback 2: Any camera (usually front)
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
        } catch (fallbackErr: any) {
          console.error("Final fallback camera access failed:", fallbackErr);
          
          let errorMessage = "Could not access camera.";
          const errorName = fallbackErr.name;
          const errorMsg = (fallbackErr.message || "").toLowerCase();
          
          if (
            errorName === 'NotAllowedError' || 
            errorName === 'PermissionDeniedError' ||
            errorMsg.includes("not allowed") ||
            errorMsg.includes("permission") ||
            errorMsg.includes("context")
          ) {
            errorMessage = "Camera access is restricted in this context. Most browsers block camera access inside iframes (like the AI Studio preview) for security. Please use the 'Open in New Tab' button in the top right header to launch the app directly and allow camera access.";
          } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
            errorMessage = "No camera found. Please ensure your camera is connected.";
          } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
            errorMessage = "Camera is already in use by another app or tab. Please close other camera apps and try again.";
          } else {
            errorMessage = `Camera Error: ${fallbackErr.message || fallbackErr.name || 'Unknown'}`;
          }
          
          setError(errorMessage);
          setIsCameraOpen(false);
        }
      }
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsVirtualSession(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setImage(dataUrl);
        // Always stop camera after capture — user gets clear feedback that photo was taken
        stopCamera();
      }
    }
  };

  const toggleObservation = (obs: string) => {
    setSelectedObservations(prev => 
      prev.includes(obs) ? prev.filter(o => o !== obs) : [...prev, obs]
    );
  };

  const addCustomObservation = () => {
    if (customObservation.trim() && !selectedObservations.includes(customObservation.trim())) {
      setSelectedObservations(prev => [...prev, customObservation.trim()]);
      setCustomObservation('');
    }
  };

  const toggleDataSource = (ds: string) => {
    setSelectedDataSources(prev => 
      prev.includes(ds) ? prev.filter(d => d !== ds) : [...prev, ds]
    );
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return `${years}y ${months}m ${days}d`;
  };

  const dobAge = calculateAge(dob);
  // If we have a dobAge, use it. If not (e.g. when loading a saved report), 
  // we might have a result that contains the age or a state from a loaded report.
  // We'll prioritize the active DOB calculation, then fall back to the result's context if available.
  const chronologicalAge = dobAge || (result as any)?.summary?.age || (result as any)?.age || '';
  const reportWpm = result ? getReportWpm(result.summary.wpm, result.summary.wordCount, timeTaken) : 0;

  const isAgeGradeValid = () => {
    if (!grade || !dob) return true;
    
    const gradeNum = parseInt(grade.replace('Grade ', ''));
    const birth = new Date(dob);
    const today = new Date();
    
    if (birth > today) return false;

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // Standard age for Grade 1 is 6.
    // Expected Age = Grade + 5
    const expectedAge = gradeNum + 5;
    const diff = Math.abs(age - expectedAge);
    
    return diff <= 2;
  };

  const processFile = async (file: File) => {
    console.log('[processFile] called — name:', file.name, '| type:', file.type, '| size:', file.size);

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    const fileName = file.name ? file.name.toLowerCase() : '';
    console.log('[processFile] fileName (lower):', fileName);

    // --- PDF ---
    if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      console.log('[processFile] → PDF branch entered');
      try {
        setError(null);
        console.log('[processFile] importing pdfjs-dist...');
        const pdfjsLib = await import('pdfjs-dist');
        console.log('[processFile] pdfjs version:', pdfjsLib.version);
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
        console.log('[processFile] workerSrc set to:', pdfjsLib.GlobalWorkerOptions.workerSrc);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log('[processFile] PDF loaded, pages:', pdf.numPages);
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 3.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx as any, canvas, viewport }).promise;
        console.log('[processFile] PDF rendered to canvas ✓');
        setImage(canvas.toDataURL('image/png'));
        setRotation(0);
      } catch (e) {
        console.error('[processFile] PDF render error:', e);
        setError('Failed to render PDF. Please ensure the file is not password-protected.');
      }
      return;
    }

    // --- Word (DOC / DOCX) ---
    if (
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      console.log('[processFile] → DOCX branch entered');
      try {
        setError(null);
        console.log('[processFile] importing mammoth...');
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        console.log('[processFile] mammoth HTML length:', result.value.length);

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-9999px;width:800px;height:1100px;';
        document.body.appendChild(iframe);
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          setError('Could not render Word document.');
          document.body.removeChild(iframe);
          return;
        }
        iframeDoc.open();
        iframeDoc.write(`<html><body style="font-family:serif;padding:40px;font-size:14px;">${result.value}</body></html>`);
        iframeDoc.close();

        await new Promise(r => setTimeout(r, 400));
        console.log('[processFile] importing html2canvas...');
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(iframeDoc.body, { scale: 2, useCORS: true });
        document.body.removeChild(iframe);
        console.log('[processFile] DOCX rendered to canvas ✓');
        setImage(canvas.toDataURL('image/jpeg', 0.92));
        setRotation(0);
      } catch (e) {
        console.error('[processFile] DOCX render error:', e);
        setError('Failed to render Word document. Please try saving as PDF or image first.');
      }
      return;
    }

    // --- HEIC/HEIF ---
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      setError('HEIC/HEIF images (commonly from iPhones) are not supported natively by web browsers. Please save or export the image as standard JPG or PNG before uploading.');
      return;
    }

    // --- Standard images ---
    console.log('[processFile] → image branch');
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.jfif', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.avif'];
    const isImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));

    let isValid = false;
    if (file.type && file.type.startsWith('image/')) {
      isValid = true;
    } else if (isImageExtension) {
      isValid = true;
    } else if (!file.type || file.type === 'application/octet-stream') {
      isValid = true;
    }

    console.log('[processFile] isValid:', isValid);

    if (!isValid) {
      setError('Please upload a valid image file (JPG, PNG, WebP), PDF, or Word document (DOCX).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        console.log('[processFile] image loaded ✓');
        setImage(dataUrl);
        setRotation(0);
        setError(null);
      };
      img.onerror = () => {
        setError('The file uploaded does not appear to be a valid image or is corrupted. Please ensure it is a JPG, PNG or WebP image.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[handleImageUpload] triggered, files:', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    } else {
      console.warn('[handleImageUpload] no file selected');
    }
  };

  const rotateImage = () => {
    if (!image) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.height;
      canvas.height = img.width;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      setImage(rotatedBase64);
    };
    img.src = image;
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // aspect ratio (optional, setting to 1 for now but user can change)
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const getCroppedImg = () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    setImage(base64Image);
    setIsCropping(false);
  };

  const startAnalysis = async () => {
    if (!image) return;
    
    if (!writingPrompt.trim()) {
      setError("Please specify the 'Writing Prompt/Task Given' before generating the report.");
      return;
    }
    
    if (!timeGiven.trim()) {
      setError("Please specify the 'Time Given (minutes)' before generating the report.");
      return;
    }
    
    if (!isAgeGradeValid()) {
      setError(`The student's age (${chronologicalAge.split('y')[0]} years) does not match the selected Grade (${grade}). Please verify the Date of Birth and Grade.`);
      return;
    }
    
    setIsAnalyzing(true);
    setActiveStep(4);
    setError(null);
    try {
      const analysis = await analyzeHandwriting(
        image, 
        grade, 
        context, 
        selectedObservations, 
        selectedDataSources,
        timeTaken ? parseFloat(timeTaken) : undefined,
        chronologicalAge,
        {
          tried: interventionTried,
          improved: interventionImproved,
          details: interventionDetails
        },
        knownDiagnoses,
        writingPrompt,
        paperType,
        writingInstrument,
        timeGiven ? parseFloat(timeGiven) : undefined,
        observationalNotes
      );
      const analysisResult = { ...analysis, image };
      setResult(analysisResult);
      // Save to sessionStorage and open report in new tab
      try {
        sessionStorage.setItem('graphia_report_result', JSON.stringify(analysisResult));
        sessionStorage.setItem('graphia_report_meta', JSON.stringify({
          studentName, schoolName, cityName, countryName, uploadedBy,
          contactEmail, contactPhone, grade, dob, timeTaken, timeGiven,
          writingPrompt, paperType, writingInstrument, observationalNotes,
          interventionTried, interventionImproved, interventionDetails,
          selectedObservations, selectedDataSources, knownDiagnoses,
        }));
        window.open(window.location.origin + window.location.pathname + '?report=1', '_blank');
      } catch (_e) {
        // sessionStorage full or blocked — fallback: show in same tab
      }
      // Open report in new tab
      setTimeout(() => {
        const reportWin = window.open('', '_blank');
        if (reportWin) {
          reportWin.document.write(`
            <html>
              <head>
                <title>GraphiaCheck Report</title>
                <script>
                  window.opener && window.opener.__graphiaReportReady && window.opener.__graphiaReportReady();
                </script>
              </head>
              <body style="margin:0;background:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                <p>Loading report...</p>
              </body>
            </html>
          `);
          reportWin.close();
        }
      }, 0);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || '';
      if (errorMessage.includes('API_QUOTA_EXCEEDED')) {
        setError(errorMessage.split('API_QUOTA_EXCEEDED: ')[1]);
      } else if (errorMessage.includes('SAFETY_FILTER')) {
        setError(errorMessage.split('SAFETY_FILTER: ')[1]);
      } else {
        setError('Analysis failed. Please ensure the image is clear and try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    
    // Ensure JSON is removed from the report text just in case
    const cleanReport = result.report.replace(/```json\s*[\s\S]*?\s*```/g, "").trim();

    const reportText = `
# DYSGRAPHIA ANALYSIS PRO - CLINICAL REPORT
**Student Name:** ${studentName || "Not provided"}
**School:** ${schoolName || "Not provided"}
**City:** ${cityName || "Not provided"}
**Country:** ${countryName || "Not provided"}
**Grade Level:** ${grade}
**Chronological Age:** ${chronologicalAge || "Not provided"}
**Date of Birth:** ${dob || "Not provided"}
**Uploaded By:** ${uploadedBy || "Not provided"}
**Contact Email:** ${contactEmail || "Not provided"}
**Contact Phone:** ${contactPhone || "Not provided"}

=== WRITING SAMPLE DETAILS ===
**Writing Prompt/Task:** ${writingPrompt || "Not provided"}
**Time Given (Allotted):** ${timeGiven ? `${timeGiven} minutes` : "Not provided"}
**Time Taken (Actual):** ${timeTaken ? `${timeTaken} minutes` : "Not provided"}
**Paper Type:** ${paperType || "Blank / Unlined"}
**Writing Instrument:** ${writingInstrument || "Not provided"}
${observationalNotes ? `**Assessor's Observational Notes:** ${observationalNotes}\n` : ""}==============================

**Word Count:** ${result.summary.wordCount}
**Time Taken:** ${timeTaken ? `${timeTaken} minutes` : "Not provided"}
**Writing Speed:** ${reportWpm ? `${reportWpm} words per minute` : "N/A"}
**OCR Transcription:**
*Note: [cancelled: text] indicates words crossed out by student.*
${result.summary.transcription}

**Spelling Patterns & Grade Level Discrepancies:**
${result.summary.spellingErrors.length > 0 ? result.summary.spellingErrors.map(e => `- ${e}`).join('\n') : "No significant patterns identified."}

**Date:** ${new Date().toLocaleDateString()}
**Clinical Context:** ${context || "None provided"}
**Clinical Observations:** ${selectedObservations.length > 0 ? selectedObservations.join(", ") : "None provided"}
**Data Sources:** ${selectedDataSources.length > 0 ? selectedDataSources.join(", ") : "None provided"}

---

## 1. DIAGNOSTIC SUMMARY
| Feature | Evaluation |
| :--- | :--- |
| **Alignment** | ${result.summary.alignment} |
| **Line Quality** | ${result.summary.lineQuality} |
| **Mechanics** | ${result.summary.mechanics} |
| **Horizontal Analysis** | ${result.summary.horizontalAnalysis} |
| **Vertical Analysis** | ${result.summary.verticalAnalysis} |
| **Spelling Score** | ${result.summary.spellingScore} |
| **Dysgraphia Indicators** | ${result.summary.dysgraphiaIndicators.length > 0 ? `${result.summary.dysgraphiaIndicators.length} features detected` : 'No significant features'} |

---

## 2. NUMERICAL PROFILE (0-100)
- **Alignment:** ${result.summary.scores.alignment}
- **Line Quality:** ${result.summary.scores.lineQuality}
- **Mechanics:** ${result.summary.scores.mechanics}
- **Spelling:** ${result.summary.scores.spelling}
- **Horizontal Spatial:** ${result.summary.scores.horizontal}
- **Vertical Spatial:** ${result.summary.scores.vertical}

---

## 3. CLINICAL INTERPRETATION
### SLD Probability Estimate
${result.summary.probabilityEstimate}

---

## 4. DETECTED PATTERNS
### Spelling Patterns
${result.summary.spellingErrors.length > 0 ? result.summary.spellingErrors.join(', ') : "No specific patterns identified."}

### Dysgraphia Features
${result.summary.dysgraphiaIndicators.length > 0 
  ? result.summary.dysgraphiaIndicators.map(i => `- ${i}`).join('\n') 
  : "No significant dysgraphia features identified."}

---

## 5. FULL CLINICAL ANALYSIS
${cleanReport}

---

**Disclaimer:** ${disclaimer}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dysgraphia_report_${grade.replace(' ', '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const saveAsPdf = async () => {
    if (!reportRef.current || isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    // Increased delay to ensure Recharts and other async elements are fully settled
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const element = reportRef.current;
      const fileName = `GraphiaCheck_Report_${Date.now()}.pdf`;

      // Select all elements with the class 'report-page'
      const pages = element.querySelectorAll('.report-page');
      
      if (pages.length === 0) {
        throw new Error("No report pages found to generate PDF");
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        
        // Capture each page as a single crisp JPG
        const dataUrl = await domToPng(pageEl, {
          scale: 2.2, // Generates hyper-sharp crisp text rendering
          backgroundColor: '#ffffff',
          width: pageEl.scrollWidth || pageEl.offsetWidth || 794,
          height: pageEl.scrollHeight || pageEl.offsetHeight || 1123,
          style: {
            overflow: 'visible',
            height: 'auto',
            maxHeight: 'none',
          }
        });
        
        if (i > 0) {
          pdf.addPage();
        }
        
        // Feed image edge-to-edge as each page is designed as A4 size internally
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
      
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF Creation Failed:", err);
      alert("Failed to generate PDF. You can try the 'Print' option (Ctrl/Cmd + P) and 'Save as PDF' from your browser.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const copyAnalysisToClipboard = async () => {
    if (!result) return;
    
    try {
      const textToCopy = `
GRAPHIA CHECK ASSESSMENT REPORT
Student: ${studentName || 'Not specified'}
Grade: ${grade}
Age: ${chronologicalAge || 'Not specified'}
Date: ${new Date().toLocaleDateString()}

ASSESSMENT SUMMARY:
Probability Estimate: ${result.summary.probabilityEstimate}
Basal Level: ${result.summary.basalLevel}
Ceiling Level: ${result.summary.ceilingLevel}

WRITTEN LANGUAGE SKILLS:
- Sentence Boundaries: ${result.summary.scores.sentenceBoundaries}/100 - ${result.summary.languageSkills.sentenceBoundaries}
- Grammar: ${result.summary.scores.grammar}/100 - ${result.summary.languageSkills.grammar}
- Past Tense Usage: ${result.summary.scores.pastTenseUsage}/100 - ${result.summary.languageSkills.pastTenseUsage}

OCR TRANSCRIPTION:
"${result.summary.transcription}"

CLINICAL REPORT:
${result.report}
      `.trim();

      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const saveAsWord = async () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    
    // Helper to convert base64 to Uint8Array
    const base64ToUint8Array = (base64: string) => {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    try {
      // 1. Capture Handwriting Sample Image if exists
      let sampleImageBytes: Uint8Array | null = null;
      if (image) {
        if (image.startsWith('data:')) {
          sampleImageBytes = base64ToUint8Array(image.split(',')[1]);
        }
      }

      // 2. Capture Visual Analysis Graphs
      let chartsImageBytes: Uint8Array | null = null;
      const visualAnalysisEl = reportRef.current?.querySelector('.visual-analysis-container');
      if (visualAnalysisEl) {
        try {
          const dataUrl = await domToPng(visualAnalysisEl as HTMLElement, {
            scale: 2,
            backgroundColor: '#ffffff',
          });
          if (dataUrl && dataUrl.includes(',')) {
            chartsImageBytes = base64ToUint8Array(dataUrl.split(',')[1]);
          }
        } catch (chartErr) {
          console.error("Failed to capture charts for Word doc:", chartErr);
        }
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720, // 0.5 inch
                  bottom: 720,
                  left: 720,
                  right: 720,
                },
              },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: studentName ? studentName.toUpperCase() : "STUDENT REPORT",
                    font: "Times New Roman",
                    size: 24,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "GRAPHIA CHECK ASSESSMENT REPORT",
                    font: "Times New Roman",
                    size: 32,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${schoolName ? `School: ${schoolName} | ` : ''}${cityName ? `City: ${cityName} | ` : ''}${countryName ? `Country: ${countryName} | ` : ''}Grade: ${grade} | Date: ${new Date().toLocaleDateString()}`,
                    font: "Times New Roman",
                    size: 22,
                  }),
                ],
              }),
              ...(uploadedBy || contactEmail || contactPhone ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${uploadedBy ? `Uploaded By: ${uploadedBy} ` : ''}${contactEmail ? `| Email: ${contactEmail} ` : ''}${contactPhone ? `| Phone: ${contactPhone}` : ''}`,
                      font: "Times New Roman",
                      size: 18,
                      color: "666666",
                    }),
                  ],
                }),
              ] : []),
              new Paragraph({ text: "" }),

              // Handwriting Sample
              ...(sampleImageBytes ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  keepNext: true,
                  children: [
                    new TextRun({ text: "HANDWRITING SAMPLE", font: "Times New Roman", size: 20, bold: true }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  keepNext: true,
                  children: [
                    new ImageRun({
                      data: sampleImageBytes,
                      transformation: { width: 400, height: 250 },
                      type: "jpg"
                    }),
                  ],
                }),
              ] : []),

              // Charts
              ...(chartsImageBytes ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  keepNext: true,
                  children: [
                    new TextRun({ text: "VISUAL ANALYSIS", font: "Times New Roman", size: 20, bold: true }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  keepNext: true,
                  children: [
                    new ImageRun({
                      data: chartsImageBytes,
                      transformation: { width: 500, height: 250 },
                      type: "png"
                    }),
                  ],
                }),
              ] : []),

              new Paragraph({
                keepNext: true,
                children: [
                  new TextRun({
                    text: "CLINICAL SUMMARY",
                    font: "Times New Roman",
                    size: 24,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Probability: `, font: "Times New Roman", size: 22, bold: true }),
                  new TextRun({ text: result.summary.probabilityEstimate, font: "Times New Roman", size: 22 }),
                ],
              }),
              new Paragraph({ text: "" }),

              new Paragraph({
                children: [
                  new TextRun({ text: `Basal Level: `, font: "Times New Roman", size: 22, bold: true }),
                  new TextRun({ text: result.summary.basalLevel, font: "Times New Roman", size: 22 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Ceiling Level: `, font: "Times New Roman", size: 22, bold: true }),
                  new TextRun({ text: result.summary.ceilingLevel, font: "Times New Roman", size: 22 }),
                ],
              }),
              new Paragraph({ text: "" }),

              new Paragraph({
                children: [
                  new TextRun({ text: `WRITTEN LANGUAGE SKILLS:`, font: "Times New Roman", size: 22, bold: true, underline: {} }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Sentence Boundaries: `, font: "Times New Roman", size: 22, bold: true }),
                  new TextRun({ text: `(${result.summary.scores.sentenceBoundaries}/100) ${result.summary.languageSkills.sentenceBoundaries}`, font: "Times New Roman", size: 22 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Grammar: `, font: "Times New Roman", size: 22, bold: true }),
                  new TextRun({ text: `(${result.summary.scores.grammar}/100) ${result.summary.languageSkills.grammar}`, font: "Times New Roman", size: 22 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Past Tense Usage: `, font: "Times New Roman", size: 22, bold: true }),
                  new TextRun({ text: `(${result.summary.scores.pastTenseUsage}/100) ${result.summary.languageSkills.pastTenseUsage}`, font: "Times New Roman", size: 22 }),
                ],
              }),
              new Paragraph({ text: "" }),

              ...(result.summary.academicDiscrepancy && result.summary.academicDiscrepancy !== "Not analyzed" ? [
                new Paragraph({
                  keepNext: true,
                  children: [
                    new TextRun({
                      text: "ACADEMIC DISCREPANCY ANALYSIS",
                      font: "Times New Roman",
                      size: 24,
                      bold: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: result.summary.academicDiscrepancy,
                      font: "Times New Roman",
                      size: 22,
                    }),
                  ],
                }),
                new Paragraph({ text: "" }),
              ] : []),
              
              new Paragraph({ text: "" }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: "OCR TRANSCRIPTION:", font: "Times New Roman", size: 22, bold: true, underline: {} }),
                ],
              }),
              new Paragraph({
                children: (() => {
                  const transcription = result.summary.transcription || '';
                  const errorWords = (result.summary.spellingErrors || []).map((err: string) => {
                    const m = err.match(/^([^\s(]+)/);
                    return m ? m[1].toLowerCase() : '';
                  }).filter(Boolean);

                  const runs: any[] = [];
                  const parts = transcription.split(/(\[(?:cancelled|CANCELLED):.*?\])/gi);
                  parts.forEach((part: string) => {
                    if (/^\[(?:cancelled|CANCELLED):/i.test(part)) {
                      const content = part.replace(/^\[(?:cancelled|CANCELLED):\s*/i, '').replace(/\]$/, '');
                      runs.push(new TextRun({ text: content + ' ', font: "Times New Roman", size: 22, italics: true, strike: true, color: '888888' }));
                    } else {
                      const words = part.split(/(\s+)/);
                      words.forEach((w: string) => {
                        const clean = w.replace(/[.,!?;:'"()]/g, '').toLowerCase();
                        if (errorWords.includes(clean) && clean.length > 0) {
                          runs.push(new TextRun({ text: w, font: "Times New Roman", size: 22, italics: true, bold: true, color: 'CC0000' }));
                        } else {
                          runs.push(new TextRun({ text: w, font: "Times New Roman", size: 22, italics: true }));
                        }
                      });
                    }
                  });
                  return runs;
                })(),
              }),
              new Paragraph({ text: "" }),

              new Paragraph({
                children: [
                   new TextRun({ text: "SPELLING PATTERNS & GRADE LEVEL DISCREPANCIES:", font: "Times New Roman", size: 22, bold: true, underline: {} }),
                ],
              }),
              ...result.summary.spellingErrors.map(err => {
                return new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({ text: err, font: "Times New Roman", size: 22 }),
                  ],
                });
              }),
              new Paragraph({ text: "" }),

              ...result.report.split('\n').map(line => {
                const isHeading1 = line.trim().startsWith('# ');
                const isHeading2 = line.trim().startsWith('## ');
                const isHeading3 = line.trim().startsWith('### ');
                const isBold = line.includes('**');
                const cleanLine = line.replace(/[*#]/g, '').trim();
                if (!cleanLine) return new Paragraph({ text: "" });
                
                return new Paragraph({
                  spacing: { before: isHeading1 || isHeading2 ? 240 : 0, after: 120 },
                  children: [
                    new TextRun({
                      text: cleanLine,
                      font: "Times New Roman",
                      size: isHeading1 ? 28 : (isHeading2 ? 24 : 22), 
                      bold: isHeading1 || isHeading2 || isHeading3 || isBold,
                    }),
                  ],
                });
              }),

              new Paragraph({ text: "" }),
              new Paragraph({
                border: {
                  top: { color: "777777", space: 1, style: BorderStyle.SINGLE, size: 6 },
                },
                spacing: { before: 240 },
                children: [
                  new TextRun({
                    text: `Disclaimer: ${disclaimer}`,
                    font: "Times New Roman",
                    size: 18,
                    color: "777777",
                    italics: true,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `GraphiaCheck_Report_${grade.replace(' ', '_').toLowerCase()}.docx`);
    } catch (err) {
      console.error("Word generation failed", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter to start analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (image && !isAnalyzing) {
          e.preventDefault();
          startAnalysis();
        }
      }
      
      // Ctrl+S to save as PDF
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        if (result && !isGeneratingPdf) {
          e.preventDefault();
          saveAsPdf();
        }
      }

      // Ctrl+P to print
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        if (result) {
          e.preventDefault();
          window.print();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, isAnalyzing, result, isGeneratingPdf, grade, chronologicalAge, context, selectedObservations, selectedDataSources, timeTaken]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0] print:bg-white">
      {/* Cropping Modal */}
      <AnimatePresence>
        {isCropping && image && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(20, 20, 20, 0.9)' }}
            className="fixed inset-0 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8"
          >
            <div className="bg-[#E4E3E0] border border-[#141414] w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-[#141414] flex justify-between items-center">
                <h3 className="font-serif italic text-lg flex items-center gap-2">
                  <CropIcon className="w-4 h-4" /> Crop Handwriting Sample
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsCropping(false)}
                    className="p-2 hover:bg-[#141414]/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#141414]/5">
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                >
                  <img 
                    ref={imgRef}
                    src={image} 
                    alt="Crop preview" 
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[60vh] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </ReactCrop>
              </div>

              <div className="p-6 border-t border-[#141414] flex justify-end gap-4">
                <button 
                  onClick={() => setIsCropping(false)}
                  className="px-6 py-2 font-mono text-xs uppercase tracking-widest border border-[#141414] hover:bg-[#141414]/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={getCroppedImg}
                  className="px-6 py-2 font-mono text-xs uppercase tracking-widest bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a] flex items-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" /> Apply Crop
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* URL Import Modal */}
      <AnimatePresence>
        {isUrlInput && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-2 border-[#141414] shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5" />
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Import from URL</h3>
                </div>
                <button onClick={() => setIsUrlInput(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input 
                    type="url" 
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://example.com/handwriting.jpg"
                    className="w-full border border-[#141414] p-3 pl-10 font-mono text-xs focus:outline-none focus:bg-[#141414]/5 transition-colors"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsUrlInput(false)}
                    className="flex-1 border border-[#141414] py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414]/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (externalUrl) {
                        setImage(externalUrl);
                        setIsUrlInput(false);
                        setExternalUrl('');
                      }
                    }}
                    className="flex-1 bg-[#141414] text-[#E4E3E0] py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-[#2a2a2a] transition-all"
                  >
                    Import Sample
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Saved Reports Modal */}
      <AnimatePresence>
        {showSavedReports && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Saved Reports</h2>
                    <p className="text-sm text-gray-500">Access your previously generated assessments</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSavedReports(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {savedReports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No saved reports</h3>
                    <p className="text-gray-500">Reports you save will appear here for quick access.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                      >
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => loadReport(report)}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date(report.date).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                              Grade {report.grade}
                            </span>
                            {report.studentName && (
                              <span className="text-sm font-bold text-indigo-600 ml-2">
                                {report.studentName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3 text-indigo-500" />
                              Score: {Math.round(Object.values(report.result.summary.scores).reduce((a, b) => a + b, 0) / Object.values(report.result.summary.scores).length)}%
                            </span>
                            {report.age && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-500" />
                                Age: {report.age}
                              </span>
                            )}
                            {report.uploadedBy && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-indigo-500" />
                                By: {report.uploadedBy}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => loadReport(report)}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Load Report"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteReport(report.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  Reports are stored locally in your browser
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera Capture Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(20, 20, 20, 0.95)' }}
            className="fixed inset-0 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-8"
          >
            <div className={`bg-[#E4E3E0] border border-[#141414] w-full ${isVirtualSession ? 'h-full sm:h-[90vh]' : 'max-w-4xl max-h-[90vh]'} flex flex-col transition-all duration-500`}>
              <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${isVirtualSession ? 'bg-red-100 text-red-600' : 'bg-[#141414] text-[#E4E3E0]'} rounded-lg`}>
                    {isVirtualSession ? <Activity className="w-4 h-4 animate-pulse" /> : <Camera className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-serif italic text-lg leading-tight">
                      {isVirtualSession ? 'Virtual Diagnostic Session' : 'Capture Handwriting Sample'}
                    </h3>
                    {isVirtualSession && (
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                        Live Student Feed • {grade || 'Unassigned Grade'}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={stopCamera}
                  className="p-2 hover:bg-[#141414]/10 transition-colors rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden p-0 sm:p-4 flex items-center justify-center bg-black relative group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted
                  playsInline 
                  className="w-full h-full object-cover sm:object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Virtual Session Overlays */}
                {isVirtualSession ? (
                  <>
                    {/* Student Name Tag */}
                    <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-white font-mono text-[10px] uppercase tracking-widest">Student (Live)</span>
                    </div>

                    {/* Scanning Guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[80%] h-[60%] border-2 border-dashed border-white/30 rounded-2xl relative">
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                        
                        {/* Scanning Line Animation */}
                        <motion.div 
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                        />
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest text-center px-8">
                            Ask student to hold writing sample<br/>within this frame
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Call Controls Overlay (Bottom) */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                        <Mic className="w-5 h-5" />
                      </button>
                      <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                        <Maximize2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={stopCamera}
                        className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* Standard Camera Overlay/Guide */
                  <div className="absolute inset-0 border-2 border-white/20 pointer-events-none m-8 flex items-center justify-center">
                    <div className="w-full h-full border border-dashed border-white/40 flex items-center justify-center">
                      <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">Align handwriting within this frame</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[#141414] flex flex-col sm:flex-row justify-center items-center gap-4 bg-white/50">
                <div className="flex gap-4 w-full sm:w-auto">
                  <button 
                    onClick={stopCamera}
                    className="flex-1 sm:flex-none px-6 py-3 font-mono text-xs uppercase tracking-widest border border-[#141414] hover:bg-[#141414]/10 transition-colors"
                  >
                    {isVirtualSession ? 'End Session' : 'Cancel'}
                  </button>
                  <button 
                    onClick={captureImage}
                    className={`flex-1 sm:flex-none px-8 py-3 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      isVirtualSession 
                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
                        : 'bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a]'
                    }`}
                  >
                    {isVirtualSession ? (
                      <>
                        <Scan className="w-5 h-5" /> Capture & Analyze
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" /> Capture Sample
                      </>
                    )}
                  </button>
                </div>
                
                {/* Troubleshooting Link */}
                <div className="text-[9px] font-mono uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  <span>Having trouble? Try opening the app in a new tab.</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#E4E3E0] border-2 border-[#141414] shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] w-full max-w-xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-[#141414] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#141414] text-[#E4E3E0]">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tighter">Application Settings</h2>
                    <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">System Configuration</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-[#141414]/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Report Disclaimer Text
                  </label>
                  <p className="text-[11px] opacity-60 font-mono leading-relaxed">
                    THIS TEXT WILL APPEAR AT THE BOTTOM OF ALL GENERATED REPORTS (MARKDOWN, PDF, AND DOCX).
                  </p>
                  <textarea
                    value={disclaimer}
                    onChange={(e) => setDisclaimer(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-[#141414] p-4 text-xs font-mono leading-relaxed focus:bg-white focus:outline-none transition-all"
                    placeholder="Enter custom disclaimer text here..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => setDisclaimer(DEFAULT_DISCLAIMER)}
                      className="text-[9px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset to Default
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border border-[#141414] border-dashed bg-white/30 text-[10px] font-mono leading-relaxed capitalize">
                  Note: Changes are saved automatically as you type and persisted in your browser's local storage.
                </div>
              </div>

              <div className="p-6 border-t border-[#141414] bg-[#141414]/5 flex justify-end">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-8 py-3 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase tracking-widest hover:bg-[#2a2a2a] transition-all"
                >
                  Close & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tourStep !== null && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[#E4E3E0] border-2 border-[#141414] shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] w-full max-w-lg flex flex-col overflow-hidden text-[#141414]"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#141414] bg-[#141414] text-[#E4E3E0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <div>
                    <h3 className="font-serif italic text-sm md:text-base font-bold tracking-tight">
                      GraphiaCheck Interactive Tour
                    </h3>
                    <p className="text-[9px] font-mono uppercase tracking-wider opacity-60">
                      Step {tourStep + 1} of {TOUR_STEPS.length}
                    </p>
                  </div>
                </div>
                
                {/* Voice Control Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const mode = !voiceEnabled;
                      setVoiceEnabled(mode);
                      if (!mode) stopSpeech();
                      else speakText(TOUR_STEPS[tourStep].voiceText);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-all border ${
                      voiceEnabled 
                        ? 'bg-emerald-800 text-white border-emerald-600 font-bold' 
                        : 'bg-transparent text-white/50 border-white/20 hover:text-white'
                    }`}
                    title={voiceEnabled ? "Mute Voice Narration" : "Unmute Voice Narration"}
                  >
                    {voiceEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Speak: ON
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Speak: OFF
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setTourStep(null);
                      stopSpeech();
                    }}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#141414]/10 h-1">
                <div 
                  className="bg-emerald-650 h-1 transition-all duration-300"
                  style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }}
                />
              </div>

              {/* Content Panel */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-base font-bold font-mono uppercase tracking-wide text-[#141414]">
                    {TOUR_STEPS[tourStep].title}
                  </h4>
                  <p className="text-xs md:text-sm font-serif leading-relaxed text-[#141414]/80">
                    {TOUR_STEPS[tourStep].text}
                  </p>
                </div>

                {/* Additional Guidance Context */}
                {tourStep === 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-600/30 text-[10px] font-mono leading-relaxed text-[#141414]/80">
                    💡 <span className="font-bold">SYSTEM RANGE:</span> Calibrated for Grade 1 through College 15th Year (Third Year of College). Submissions must contain a minimum of 75 to 100 words to compile reliable clinical metrics.
                  </div>
                )}
                {tourStep === 1 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-600/30 text-[10px] font-mono leading-relaxed text-[#141414]/80">
                    📷 <span className="font-bold">IMAGE CLARITY:</span> To isolate baseline grids and resolve stroke variations accurately, the handwriting sample image must be sharp, well-lit, direct-angle, flat, and taken without shadows or blur.
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-[#141414] bg-[#141414]/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                  onClick={() => {
                    setTourStep(null);
                    stopSpeech();
                  }}
                  className="text-xs font-mono uppercase tracking-widest text-[#141414]/60 hover:text-[#141414] transition-colors self-start sm:self-auto"
                >
                  Skip Tour
                </button>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Load Demo button available dynamically */}
                  {tourStep === 5 ? (
                    <button
                      onClick={loadDemoCaseData}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-705 text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-800 transition-all border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none animate-pulse"
                    >
                      ⚡ Load Demo Case Now
                    </button>
                  ) : (
                    <button
                      onClick={loadDemoCaseData}
                      className="text-[9px] font-mono uppercase tracking-widest text-[#141414]/50 hover:text-emerald-700 transition-all mr-2"
                      title="Skip directly to the full clinical report output"
                    >
                      Instant Demo Case ⚡
                    </button>
                  )}

                  {tourStep > 0 && (
                    <button
                      onClick={() => setTourStep(prev => prev !== null ? prev - 1 : null)}
                      className="px-4 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest hover:bg-white transition-all bg-transparent"
                    >
                      Back
                    </button>
                  )}
                  
                  {tourStep < TOUR_STEPS.length - 1 ? (
                    <button
                      onClick={() => setTourStep(prev => prev !== null ? prev + 1 : null)}
                      className="px-5 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase tracking-widest hover:bg-[#2a2a2a] transition-all"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTourStep(null);
                        stopSpeech();
                      }}
                      className="px-5 py-2 bg-emerald-750 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-emerald-800 transition-all border border-[#141414]"
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Capture Widget */}
      <div className={`fixed top-32 right-8 z-[100] flex flex-col items-end gap-3 print:hidden ${isCropping ? 'hidden' : ''}`}>
        <button 
          onClick={startCamera}
          className="w-14 h-14 bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(20,20,20,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          title="Quick Take Photo"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {/* Header */}
      <header 
        style={{ backgroundColor: 'rgba(228, 227, 224, 0.8)' }}
        className="border-b border-[#141414] p-6 flex justify-between items-center sticky top-0 backdrop-blur-md z-50 print:hidden"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8" />
          <h1 className="text-2xl tracking-tighter uppercase italic font-serif">
            GRAPHIACHECK PRO
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() => setShowSavedReports(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
          >
            <FolderOpen className="w-4 h-4" />
            Saved Reports
            {savedReports.length > 0 && (
              <span className="flex items-center justify-center w-4 h-4 text-[9px] bg-[#141414] text-[#E4E3E0] rounded-full">
                {savedReports.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTourStep(0)}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold font-mono uppercase tracking-widest bg-[#141414] text-[#E4E3E0] hover:bg-emerald-800 hover:text-white transition-all shadow-sm border border-[#141414]"
            title="Interactive Guided Tour with Voice Audio"
          >
            <GraduationCap className="w-4 h-4" />
            Guided Voice Demo
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <div className="hidden sm:block text-[11px] opacity-50 uppercase tracking-widest font-mono">
            Clinical Diagnostic Engine v1.0
          </div>
          <div className="flex items-center gap-3 border-l border-[#141414] pl-4">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
              {user.name}
            </span>
            <button
              onClick={onLogout}
              className="font-mono text-[10px] uppercase tracking-widest border border-[#141414] px-2 py-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:p-0">
        {/* Left Column: Input & Preview - Hide in report tab mode */}
        {!reportTabMode && (
        <div className="lg:col-span-5 space-y-8 print:hidden">
          <section 
            id="tour-sample-input"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
            className="border border-[#141414] p-6 backdrop-blur-sm relative overflow-hidden scroll-mt-20"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Info className="w-12 h-12" />
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h2 className="font-serif italic text-lg flex items-center gap-2">
                  <Upload className="w-4 h-4" /> 1. Sample Input
                </h2>
                <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest opacity-40">
                  <AlertCircle className="w-3 h-3" />
                  <span>Min. 75 words recommended for clinical validity</span>
                </div>
              </div>
              {image && (
                <div className="flex gap-2">
                  <button 
                    onClick={startCamera}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border border-[#141414] px-2 py-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors bg-white/50"
                    title="Retake photo"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => setIsCropping(true)}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border border-[#141414] px-2 py-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                    title="Crop image"
                  >
                    <CropIcon className="w-3 h-3" /> Crop
                  </button>
                  <button 
                    onClick={rotateImage}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border border-[#141414] px-2 py-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                    title="Rotate image 90 degrees"
                  >
                    <RotateCw className="w-3 h-3" /> Rotate
                  </button>
                </div>
              )}
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add('bg-[#141414]/5');
                e.currentTarget.classList.add('border-[#141414]/40');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('bg-[#141414]/5');
                e.currentTarget.classList.remove('border-[#141414]/40');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('bg-[#141414]/5');
                e.currentTarget.classList.remove('border-[#141414]/40');
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  processFile(file);
                }
              }}
              className={`
                aspect-[4/3] border-2 border-dashed border-[#141414]/20 
                flex flex-col items-center justify-center cursor-pointer
                hover:bg-[#141414]/5 transition-all relative overflow-hidden group
                ${image ? 'border-solid border-[#141414]' : ''}
              `}
            >
              {image ? (
                <div className="relative w-full h-full">
                  <img src={image} alt="Handwriting sample" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-[#141414]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-[#E4E3E0] font-mono text-[10px] uppercase tracking-widest">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-20 group-hover:opacity-40 transition-opacity" />
                  <p className="font-mono text-xs uppercase tracking-wider">
                    Upload or capture handwriting sample
                  </p>
                  <p className="text-[10px] opacity-50 mt-2">
                    JPG, PNG, WebP, PDF, Word (Max 50MB)
                  </p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff,.tif,.svg,.avif,.jfif,.pdf,.doc,.docx"
              />
            </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  className="flex items-center justify-center gap-2 border border-[#141414] py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                >
                  <Camera className="w-4 h-4" /> Use Camera
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center justify-center gap-2 border border-[#141414] py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                >
                  <Upload className="w-4 h-4" /> Upload File
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUrlInput(true);
                  }}
                  className="flex items-center justify-center gap-2 border border-[#141414] py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                >
                  <Globe className="w-4 h-4" /> Remote Link
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVirtualSession(true);
                    startCamera();
                  }}
                  className="flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-[#2a2a2a] transition-all relative overflow-hidden group sm:col-span-2"
                >
                  <Activity className="w-4 h-4" /> Virtual Diagnostic Session
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[6px] px-1 py-0.5 font-bold">ONLINE</span>
                </button>
              </div>

              <div className="mt-4 p-3 border border-[#141414] border-dashed bg-[#141414]/5 flex items-start gap-3">
                <Info className="w-4 h-4 mt-0.5 opacity-40" />
                <p className="text-[9px] font-mono uppercase tracking-tight opacity-60 leading-relaxed">
                  <span className="font-bold">Pro Tip:</span> Use "Virtual Session" during Zoom or Google Meet calls. 
                  Ask the student to hold their writing to the camera, then use the "Capture & Analyze" feature to get instant diagnostic data.
                </p>
              </div>

            <div id="tour-student-details" className="mt-6 space-y-4 scroll-mt-20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    Student Name
                  </label>
                  <input 
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    School Name
                  </label>
                  <input 
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="School"
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    Uploaded By (Person/Institution)
                  </label>
                  <input 
                    type="text"
                    value={uploadedBy}
                    onChange={(e) => setUploadedBy(e.target.value)}
                    placeholder="Name of Person or Institution"
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    Contact Email
                  </label>
                  <input 
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    Contact Phone
                  </label>
                  <input 
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    City
                  </label>
                  <input 
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="City"
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    Country
                  </label>
                  <input 
                    type="text"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    placeholder="Country"
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    Student Grade
                  </label>
                  <select 
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className={`w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors cursor-pointer ${!grade ? 'text-red-500 font-bold animate-pulse' : ''}`}
                  >
                    <option value="" disabled>Select Grade *</option>
                    {GRADES.map(g => <option key={g} value={g} className="text-[#141414] bg-[#E4E3E0]">{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    Date of Birth
                  </label>
                  <input 
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors cursor-pointer"
                  />
                  {chronologicalAge && (
                    <div className={`mt-1 font-mono text-[9px] uppercase tracking-tighter ${!isAgeGradeValid() ? 'text-red-500 font-bold' : 'opacity-60'}`}>
                      Age: {chronologicalAge}
                      {!isAgeGradeValid() && " (Age/Grade Mismatch)"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                    Time Taken (Min)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={timeTaken}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) >= 0) {
                        setTimeTaken(val);
                      }
                    }}
                    placeholder="e.g., 15"
                    className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 font-bold text-indigo-600">
                    Analysis Mode
                  </label>
                  <select 
                    className="w-full border border-[#141414] p-2 bg-white/50 font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors cursor-pointer"
                  >
                    <option value="full">Full Clinical Diagnostic</option>
                    <option value="screening">Screening Only (Rapid)</option>
                    <option value="longitudinal">Progress Monitoring</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                  Clinical Context (Optional)
                </label>
                <textarea 
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., Reports hand fatigue, known spelling difficulties, fine motor concerns..."
                  className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none h-24 resize-none placeholder:opacity-30"
                />
              </div>

              {/* Writing Sample Details Section */}
              <div className="border border-[#141414] p-4 bg-white/30 space-y-4">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 text-[#141414] border-b border-[#141414]/10 pb-2">
                  <ClipboardCheck className="w-3.5 h-3.5" /> Writing Sample Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 font-bold flex items-center justify-between">
                      <span>Writing Prompt/Task Given <span className="text-red-500">*</span></span>
                    </label>
                    <input 
                      type="text"
                      value={writingPrompt}
                      onChange={(e) => setWritingPrompt(e.target.value)}
                      placeholder="e.g., Favourite Sport"
                      className={`w-full border p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors ${!writingPrompt ? 'border-red-500/50 bg-red-50/10' : 'border-[#141414]'}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 font-bold">
                        Time Given (minutes) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number"
                        min="1"
                        value={timeGiven}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || parseFloat(val) >= 0) {
                            setTimeGiven(val);
                          }
                        }}
                        placeholder="e.g., 9"
                        className={`w-full border p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors ${!timeGiven ? 'border-red-500/50 bg-red-50/10' : 'border-[#141414]'}`}
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                        Paper Type
                      </label>
                      <select 
                        value={paperType}
                        onChange={(e) => setPaperType(e.target.value)}
                        className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors cursor-pointer"
                      >
                        <option value="Blank / Unlined" className="text-[#141414] bg-[#E4E3E0]">Blank / Unlined</option>
                        <option value="Lined / Ruled" className="text-[#141414] bg-[#E4E3E0]">Lined / Ruled</option>
                        <option value="Grid / Graph" className="text-[#141414] bg-[#E4E3E0]">Grid / Graph</option>
                        <option value="Dotted" className="text-[#141414] bg-[#E4E3E0]">Dotted</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                        Writing Instrument
                      </label>
                      <select 
                        value={writingInstrument}
                        onChange={(e) => setWritingInstrument(e.target.value)}
                        className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors cursor-pointer"
                      >
                        <option value="" className="text-[#141414] bg-[#E4E3E0]">-- Select --</option>
                        <option value="Ballpoint Pen" className="text-[#141414] bg-[#E4E3E0]">Ballpoint Pen</option>
                        <option value="Gel Pen" className="text-[#141414] bg-[#E4E3E0]">Gel Pen</option>
                        <option value="Fountain Pen" className="text-[#141414] bg-[#E4E3E0]">Fountain Pen</option>
                        <option value="Felt-tip Pen" className="text-[#141414] bg-[#E4E3E0]">Felt-tip Pen</option>
                        <option value="Pencil" className="text-[#141414] bg-[#E4E3E0]">Pencil</option>
                        <option value="Colored Pencil" className="text-[#141414] bg-[#E4E3E0]">Colored Pencil</option>
                        <option value="Crayon" className="text-[#141414] bg-[#E4E3E0]">Crayon</option>
                        <option value="Marker" className="text-[#141414] bg-[#E4E3E0]">Marker</option>
                      </select>
                    </div>

                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                      Observational Notes (optional)
                    </label>
                    <textarea 
                      value={observationalNotes}
                      onChange={(e) => setObservationalNotes(e.target.value)}
                      placeholder="Enter other assessment notes, observation conditions, behavioral cues, or posture notes..."
                      className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none h-20 resize-none placeholder:opacity-30"
                    />
                  </div>
                </div>
              </div>

              {/* RTI Section */}
              <div className="border border-[#141414] p-4 bg-white/30 space-y-4">
                <h3 className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Stethoscope className="w-3 h-3" /> Response to Intervention (RTI)
                </h3>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={interventionTried}
                      onChange={(e) => setInterventionTried(e.target.checked)}
                      className="w-4 h-4 accent-[#141414]"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">Interventions Attempted?</span>
                  </label>
                </div>

                {interventionTried && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 border-t border-[#141414]/10"
                  >
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                        Did the child improve?
                      </label>
                      <div className="flex gap-4">
                        {(['yes', 'no', 'partial'] as const).map((option) => (
                          <label key={option} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio"
                              name="improved"
                              value={option}
                              checked={interventionImproved === option}
                              onChange={(e) => setInterventionImproved(e.target.value as any)}
                              className="w-3 h-3 accent-[#141414]"
                            />
                            <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                        Intervention Details
                      </label>
                      <textarea 
                        value={interventionDetails}
                        onChange={(e) => setInterventionDetails(e.target.value)}
                        placeholder="Describe the corrective measures taken (e.g., pencil grips, extra time, specialized instruction)..."
                        className="w-full border border-[#141414] p-2 bg-transparent font-mono text-sm focus:outline-none h-20 resize-none placeholder:opacity-30"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div id="tour-clinical-observations" className="space-y-4 scroll-mt-20">
                <div className="border border-[#141414] p-4 bg-white/30">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Clinical Observations
                  </h3>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {OBSERVATIONS.map(obs => (
                      <label key={obs} className="flex items-start gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedObservations.includes(obs)}
                          onChange={() => toggleObservation(obs)}
                          className="mt-1 accent-[#141414]"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-tighter group-hover:opacity-100 opacity-60 transition-opacity">
                          {obs}
                        </span>
                      </label>
                    ))}
                    {/* Display custom observations that aren't in the predefined list */}
                    {selectedObservations.filter(obs => !OBSERVATIONS.includes(obs)).map(obs => (
                      <label key={obs} className="flex items-start gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={true}
                          onChange={() => toggleObservation(obs)}
                          className="mt-1 accent-[#141414]"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-tighter text-[#141414]">
                          {obs} (Custom)
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={customObservation}
                      onChange={(e) => setCustomObservation(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomObservation()}
                      placeholder="Add custom observation..."
                      className="flex-1 bg-white/50 border border-[#141414] px-2 py-1 font-mono text-[9px] uppercase focus:outline-none placeholder:opacity-30"
                    />
                    <button
                      onClick={addCustomObservation}
                      className="bg-[#141414] text-white px-2 py-1 font-mono text-[9px] uppercase hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="border border-[#141414] p-4 bg-white/30">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ClipboardCheck className="w-3 h-3" /> Multiple Sources of Data
                  </h3>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {DATA_SOURCES.map(ds => (
                      <label key={ds} className="flex items-start gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedDataSources.includes(ds)}
                          onChange={() => toggleDataSource(ds)}
                          className="mt-1 accent-[#141414]"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-tighter group-hover:opacity-100 opacity-60 transition-opacity">
                          {ds}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div id="tour-generate-button" className="flex gap-4 scroll-mt-20">
                <button
                  disabled={!image || !grade || isAnalyzing}
                  onClick={startAnalysis}
                  className={`
                    flex-1 py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2
                    transition-all duration-300 relative overflow-hidden
                    ${!image || !grade || isAnalyzing 
                      ? 'bg-[#141414]/10 text-[#141414]/30 cursor-not-allowed' 
                      : 'bg-[#141414] text-[#E4E3E0] hover:bg-[#2a2a2a] active:scale-[0.98]'}
                  `}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Neural Analysis...
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Generate Clinical Report
                      </div>
                      <span className="text-[8px] opacity-40 mt-1 font-mono tracking-widest">
                        [ CTRL + ENTER ]
                      </span>
                    </div>
                  )}
                </button>
                
                <button 
                  onClick={handleClear}
                  className="px-6 py-4 border border-[#141414] font-mono text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex flex-col items-center justify-center group"
                  title="Clear all fields and image"
                >
                  <RotateCcw className="w-4 h-4 mb-1 group-hover:rotate-[-90deg] transition-transform" />
                  Reset
                </button>
              </div>
            </div>
          </section>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-red-500 bg-red-50 p-6 flex flex-col gap-5 text-red-700 max-w-lg mx-auto"
            >
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <div className="space-y-4 w-full">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm uppercase tracking-wider">
                      {error.includes("rate limit") || error.includes("quota") ? "Service Limit Reached" : "Error Encountered"}
                    </h4>
                    <p className="text-xs leading-relaxed opacity-90">{error}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => setError(null)}
                      className="flex items-center gap-2 bg-red-700 text-white px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:bg-red-800 transition-all shadow-sm"
                    >
                      Dismiss
                    </button>
                    {(error.includes("camera") || error.includes("permission")) && (
                      <>
                        <button 
                          onClick={() => {
                            setError(null);
                            startCamera();
                          }}
                          className="flex items-center gap-2 bg-red-700 text-white px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:bg-red-800 transition-all shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Try Again
                        </button>
                        <button 
                          onClick={openInNewTab}
                          className="flex items-center gap-2 border border-red-700 text-red-700 bg-white px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:bg-red-50 hover:shadow-sm transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div 
            style={{ backgroundColor: 'rgba(20, 20, 20, 0.05)' }}
            className="border border-[#141414] p-4"
          >
            <h4 className="font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">Analysis Scope</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-tighter opacity-40">
              <li>• Word & Line Spacing</li>
              <li>• Page Organization</li>
              <li>• Letter Sizing & Slant</li>
              <li>• Writing Pressure & Flow</li>
              <li>• Letter Construction</li>
              <li>• Spelling Pattern Check</li>
              <li>• Motor Skill Indicators</li>
              <li>• Learning Support Needs</li>
            </ul>
          </div>
        </div>
        )}

        {/* Right Column: Results & Report */}
        <div className={`${reportTabMode ? 'lg:col-span-12' : 'lg:col-span-7'} print:block relative`}>
          <AnimatePresence>
            {!result && !isAnalyzing && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full border border-[#141414] border-dashed flex flex-col items-center justify-center p-12 text-center opacity-20 min-h-[600px] print:hidden"
              >
                <FileText className="w-24 h-24 mb-6" />
                <h3 className="text-2xl font-serif italic">Diagnostic Output Pending</h3>
                <p className="font-mono text-xs uppercase tracking-widest mt-4 max-w-xs">
                  Awaiting input sample for automated clinical evaluation and report generation.
                </p>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                className={`${result ? 'absolute inset-0 z-10' : 'h-full min-h-[600px]'} border border-[#141414] flex flex-col items-center justify-center p-12 backdrop-blur-sm print:hidden`}
              >
                <div className="relative">
                  <Loader2 className="w-24 h-24 animate-spin opacity-10" />
                  <Activity className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-2xl font-serif italic mt-8">Clinical Engine Processing</h3>
                <div className="mt-8 space-y-3 w-full max-w-xs">
                  {[
                    "Checking letter shapes & sizes...",
                    "Looking at word & line spacing...",
                    "Evaluating writing flow & pressure...",
                    "Checking spelling patterns...",
                    "Looking for motor skill indicators...",
                    "Preparing your parent-friendly report..."
                  ].map((text, i) => (
                    <motion.div 
                      key={text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.8 }}
                      className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest"
                    >
                      <div className="w-1 h-1 bg-[#141414] rounded-full" /> {text}
                    </motion.div>
                  ))}
                </div>
                {result && (
                  <p className="mt-8 font-mono text-[9px] uppercase tracking-widest opacity-40">
                    Updating existing report...
                  </p>
                )}
              </motion.div>
            )}
            
            {result && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`space-y-6 print:space-y-8 ${isAnalyzing ? 'opacity-30 pointer-events-none' : ''} transition-opacity duration-500`}
              >
                {/* Main Report Container */}
                <div className="border border-[#141414]/10 bg-gray-100 p-4 md:p-8 shadow-xl print:shadow-none print:border-none print:p-0 select-text overflow-x-auto">
                  <div ref={reportRef} className="report-container flex flex-col items-center bg-gray-100 select-text print:bg-white" style={{ fontFamily: '"Inter", sans-serif' }}>
                    
                    {/* PAGE 1 */}
                    <div className="report-page bg-white p-10 flex flex-col justify-between print:p-0 print:m-0 shadow-lg border border-gray-200 print:border-none print:shadow-none" style={{ width: '210mm', height: '297mm', minHeight: '297mm', maxHeight: '297mm', boxSizing: 'border-box', pageBreakAfter: 'always' }}>
                      <div className="space-y-5">
                        {/* Important Limitation Disclaimer */}
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm">
                          <p className="text-[8pt] text-amber-800 font-semibold text-center">
                            ⚠️ A screening is not a diagnosis. Continue tests and consult professionals/clinicians.
                          </p>
                        </div>

                        {/* Header Box (navy banner) */}
                        <div className="bg-[#0C2340] text-white pt-3 pb-4 px-6 rounded-sm">
                          {/* MINDSAID LEARNING — top left, small gray mono */}
                          <div className="text-[7pt] text-gray-400 font-mono tracking-[0.25em] uppercase mb-1">
                            MINDSAID LEARNING
                          </div>
                          {/* Main title — centered, white, bold */}
                          <h1 className="text-[16pt] font-bold tracking-widest uppercase text-white text-center leading-tight mb-3">
                            GRAPHIACHECK ASSESSMENT REPORT
                          </h1>
                          {/* Detail lines — centered, thin top border */}
                          <div className="border-t border-white/20 pt-2 text-center space-y-[4px]">
                            <div className="text-[8.5pt] text-gray-300">
                              Student:&nbsp;<strong className="text-white font-semibold">{studentName || '—'}</strong>
                              &emsp;School:&nbsp;<strong className="text-white font-semibold">{[schoolName, cityName].filter(Boolean).join(', ') || '—'}</strong>
                            </div>
                            <div className="text-[8.5pt] text-gray-300">
                              Grade:&nbsp;<strong className="text-white font-semibold">{grade || '—'}</strong>
                              &emsp;Age:&nbsp;<strong className="text-white font-semibold">{chronologicalAge ? chronologicalAge.toUpperCase() : '—'}</strong>
                              &emsp;Date:&nbsp;<strong className="text-white font-semibold">{new Date().toLocaleDateString('en-GB')}</strong>
                            </div>
                            <div className="text-[8pt] text-gray-400">
                              Uploaded by:&nbsp;<span className="text-gray-200">{uploadedBy || '—'}</span>
                              {contactEmail ? <>&nbsp;&nbsp;|&nbsp;&nbsp;<span className="text-gray-200">{contactEmail}</span></> : null}
                              {contactPhone ? <>&nbsp;&nbsp;|&nbsp;&nbsp;<span className="text-gray-200">{contactPhone}</span></> : null}
                            </div>
                          </div>
                        </div>

                        {/* Handwriting and Timing Record Grid */}
                        <div>
                          <div className="grid grid-cols-12 gap-5 items-stretch">
                            {/* Left Pane: Original Handwriting Sample */}
                            <div className="col-span-7 flex flex-col">
                              <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-2">
                                ORIGINAL HANDWRITING SAMPLE
                              </h3>
                              <div className="border border-gray-200 p-1 bg-white flex-1 flex items-center justify-center rounded-sm min-h-[180px]">
                                {result.image ? (
                                  <img 
                                    src={result.image} 
                                    alt="Evaluated handwriting" 
                                    className="max-h-[170px] max-w-full object-contain block" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="text-gray-300 text-xs italic font-mono p-12">No sample image</div>
                                )}
                              </div>
                            </div>

                            {/* Right Pane: Timing Record */}
                            <div className="col-span-5 flex flex-col bg-[#F8FAFC] border border-gray-200 p-3 rounded-sm">
                              <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-2">
                                TIMING RECORD
                              </h3>
                              <div className="space-y-3 flex-1 flex flex-col justify-center">
                                <div>
                                  <div className="text-[8pt] text-gray-500 font-mono uppercase tracking-wider">Duration</div>
                                  <div className="text-[15pt] font-black text-[#0c2340] leading-none mt-0.5">
                                    {timeTaken ? `${timeTaken} minutes` : '12 minutes'}
                                  </div>
                                </div>
                                <div className="border-t border-gray-150 pt-2">
                                  <div className="text-[8pt] text-gray-500 font-mono uppercase tracking-wider">Total words</div>
                                  <div className="text-[15pt] font-black text-[#0c2340] leading-none mt-0.5">
                                    {reportValue(result.summary.wordCount, 97)} words
                                  </div>
                                </div>
                                <div className="border-t border-gray-150 pt-2">
                                  <div className="text-[8pt] text-gray-500 font-mono uppercase tracking-wider">Writing speed</div>
                                  <div className="text-[20pt] font-black text-red-600 leading-none mt-0.5">
                                    {reportWpm} WPM
                                  </div>
                                  <div className="text-[7.5pt] text-gray-400 italic mt-0.5 leading-normal font-mono">
                                    ({grade || 'Grade 9'} norm: {getGradeSpeedNorm(grade)} WPM)
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Writing Sample Details Section */}
                        <div className="border border-gray-150 p-2.5 bg-[#FCFDFE] rounded-sm text-left text-[8.5pt]">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <div>
                              <strong className="text-gray-700 font-sans">Prompt:</strong> {writingPrompt || "Favourite Sport"}
                            </div>
                            <div>
                              <strong className="text-gray-700 font-sans">Paper Type:</strong> {paperType || "Blank / Unlined"}
                            </div>
                            <div>
                              <strong className="text-gray-700 font-sans">Time Limit:</strong> {timeGiven ? `${timeGiven} minutes` : "9 minutes"}
                            </div>
                            <div>
                              <strong className="text-gray-700 font-sans">Instrument:</strong> {writingInstrument || "Not provided"}
                            </div>
                          </div>
                          {observationalNotes && (
                            <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-gray-600 italic text-[8pt]">
                              <strong>Observations:</strong> {observationalNotes}
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-[7.5pt] text-gray-400 italic font-mono mb-1">Note: Words in bold = spelling errors. Strikethrough = student cancellations.</p>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-2">
                            OCR TRANSCRIPTION
                          </h3>
                          <div className="border border-gray-200 p-3.5 bg-[#FAFAFA] rounded-sm text-[9.5pt] leading-relaxed text-gray-800 italic block max-h-[180px] overflow-y-auto">
                            "<RenderTranscription text={result.summary.transcription} spellingErrors={result.summary.spellingErrors} />"
                          </div>
                        </div>

                        {/* Domain Scores Cards */}
                        <div>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-2">
                            DOMAIN SCORES
                          </h3>
                          <div className="grid grid-cols-7 border border-gray-300 text-center divide-x divide-gray-300">
                            {[
                              { label: "SENTENCE BOUND.", val: result.summary.scores.sentenceBoundaries ?? 50, d: "sentence" },
                              { label: "GRAMMAR", val: result.summary.scores.grammar ?? 60, d: "grammar" },
                              { label: "PAST TENSE", val: result.summary.scores.pastTenseUsage ?? 75, d: "past" },
                              { label: "SPELLING", val: result.summary.scores.spelling ?? 35, d: "spelling" },
                              { label: "FLUENCY", val: reportWpm, d: "fluency" },
                              { label: "FORMATION", val: result.summary.scores.letterFormation ?? result.summary.scores.mechanics ?? 45, d: "formation" },
                              { label: "ALIGNMENT", val: result.summary.scores.alignment ?? 50, d: "alignment" }
                            ].map((card, idx) => {
                              const isFluency = card.d === "fluency";
                              const norm = parseInt(getGradeSpeedNorm(grade).split('-')[0]) || 20;
                              const passes = isFluency ? card.val >= norm : card.val >= 70;
                              return (
                                <div key={idx} className="p-1.5 bg-white flex flex-col items-center justify-between h-20">
                                  <div className="text-[6.5pt] font-medium leading-normal text-gray-500 font-sans tracking-tight uppercase text-center">
                                    {card.label}
                                  </div>
                                  <div className="text-[15pt] font-black text-[#0c2340] leading-none my-0.5">
                                    {card.val}
                                  </div>
                                  <div className={`text-[6.5pt] font-bold uppercase font-sans tracking-tight leading-none ${passes ? 'text-green-600' : 'text-red-500'}`}>
                                    {passes ? 'Average' : 'Needs Support'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Disclaimer footer */}
                      <div className="border-t border-gray-200 pt-3 text-[#141414]/40 flex justify-between items-center text-[7pt] leading-normal font-sans">
                        <div className="flex-1 max-w-[85%] text-left uppercase font-mono tracking-tighter shrink-0">
                          DISCLAIMER: {disclaimer}
                        </div>
                        <div className="font-bold text-right tabular-nums whitespace-nowrap">
                          Page 1 of 4
                        </div>
                      </div>
                    </div>

                    {/* PAGE 2 */}
                    <div className="report-page bg-white p-10 flex flex-col justify-between print:p-0 print:m-0 shadow-lg border border-gray-200 print:border-none print:shadow-none mt-8 print:mt-0" style={{ width: '210mm', height: '297mm', minHeight: '297mm', maxHeight: '297mm', boxSizing: 'border-box', pageBreakAfter: 'always' }}>
                      <div className="space-y-4">
                        {/* Minimal top header row */}
                        <div className="flex justify-between items-center text-[#718096] text-[8.5pt] border-b border-gray-200 pb-1">
                          <div className="font-medium font-sans uppercase tracking-tight text-left">
                            {studentName || 'Lyes Difle'} &nbsp;|&nbsp; GraphiaCheck Assessment REPORT
                          </div>
                          <div className="font-semibold text-right tabular-nums">
                            {new Date().toLocaleDateString('en-GB')}
                          </div>
                        </div>

                        {/* Probability — single column */}
                        <div className="border border-gray-300">
                          <div className="p-3 flex flex-col">
                            <h4 className="text-[#B91C1C] font-bold text-[8pt] uppercase tracking-wider mb-1.5 font-sans border-b border-gray-200 pb-1">
                              PROBABILITY
                            </h4>
                            <p className="text-[8.5pt] leading-relaxed text-gray-800 font-sans">
                              {result.summary.probabilityEstimate || "High. The sample shows a cluster of dysgraphia indicators including poor form of letters, irregular sizing, difficulty with line orientation, and severely restricted fluency."}
                            </p>
                          </div>
                        </div>

                        {/* Basal & Ceiling Level — table style, no gap, joined to above */}
                        <div className="border border-t-0 border-gray-300 grid grid-cols-2 divide-x divide-gray-300">
                          <div className="p-3 flex flex-col">
                            <h4 className="text-blue-700 font-bold text-[8pt] uppercase tracking-wider mb-1.5 font-sans border-b border-gray-200 pb-1">
                              BASAL LEVEL
                            </h4>
                            <p className="text-[8.5pt] leading-relaxed text-gray-800 font-sans italic">
                              {result.summary.basalLevel || "Student can generate relevant ideas, stay on topic, and form basic legible sight words."}
                            </p>
                          </div>
                          <div className="p-3 flex flex-col">
                            <h4 className="text-yellow-700 font-bold text-[8pt] uppercase tracking-wider mb-1.5 font-sans border-b border-gray-200 pb-1">
                              CEILING LEVEL
                            </h4>
                            <p className="text-[8.5pt] leading-relaxed text-gray-800 font-sans italic">
                              {result.summary.ceilingLevel || "Performance breaks down with spelling accuracy, sentence punctuation, handwriting automaticity, and writing speed — ceiling well below expected grade."}
                            </p>
                          </div>
                        </div>

                        {/* Written Language table */}
                        {/* Written Language Skills Diagnostic — full table, no gaps */}
                        <div>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider mb-0 border-b border-[#0C2340]/20 pb-0.5">
                            WRITTEN LANGUAGE SKILLS DIAGNOSTIC
                          </h3>
                          <table className="w-full text-left border-collapse border border-gray-300 text-[8.5pt]">
                            <thead>
                              <tr className="bg-[#0C2340] text-white">
                                <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider w-[32%] text-[7.5pt]">DOMAIN & INDICATORS</th>
                                <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-center w-[12%] text-[7.5pt]">SCORE</th>
                                <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt]">CLINICAL COMMENTS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                {
                                  label: "Sentence Boundaries",
                                  sub: "Capitals, punctuation, periods",
                                  score: result.summary.scores.sentenceBoundaries ?? 50,
                                  comment: result.summary.languageSkills.sentenceBoundaries || "Punctuation and capitalization rules are not yet automatic. Run-on sentences frequent."
                                },
                                {
                                  label: "Grammar",
                                  sub: "Structure, agreement, syntax",
                                  score: result.summary.scores.grammar ?? 60,
                                  comment: result.summary.languageSkills.grammar || "Basic structures present, but complex syntax remains a challenge. Spacing issues noted."
                                },
                                {
                                  label: "Past Tense Usage",
                                  sub: "Regular and irregular past verbs",
                                  score: result.summary.scores.pastTenseUsage ?? 75,
                                  comment: result.summary.languageSkills.pastTenseUsage || "Good basic understanding of past tense verb construction."
                                },
                                {
                                  label: "Academic Discrepancy",
                                  sub: "Grade-level gap analysis",
                                  score: null,
                                  comment: result.summary.academicDiscrepancy || "The sample is at least two grade levels below in spelling accuracy, writing fluency, and grammar/punctuation. Ideation is a relative strength."
                                }
                              ].map((row, idx) => (
                                <tr key={idx} className="border-b border-gray-300">
                                  <td className="border border-gray-300 px-2 py-1.5 align-top">
                                    <strong className="text-gray-900 font-bold block leading-tight">{row.label}</strong>
                                    <span className="text-[7pt] text-gray-400">{row.sub}</span>
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-center font-black text-[11pt] align-middle">
                                    {row.score !== null ? (
                                      <span className={row.score >= 70 ? 'text-green-700' : 'text-red-600'}>
                                        {row.score}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-[7pt]">—</span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-gray-700 italic text-[8pt] leading-normal align-top">
                                    {row.comment}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Spelling grade level differences */}
                        <div>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider mb-0 border-b border-[#0C2340]/20 pb-0.5">
                            SPELLING PATTERNS & GRADE LEVEL DISCREPANCIES
                          </h3>
                          {result.summary.spellingErrors.length > 0 ? (
                            <table className="w-full text-left border-collapse border border-gray-300 text-[8.5pt]">
                              <thead>
                                <tr className="bg-[#0C2340] text-white">
                                  <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt] w-[28%]">WRITTEN (ERROR)</th>
                                  <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt] w-[28%]">CORRECT FORM</th>
                                  <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt]">GRADE DISCREPANCY</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.summary.spellingErrors.slice(0, 6).map((err, i) => {
                                  const parsed = parseSpellingError(err);
                                  return (
                                    <tr key={i} className="border-b border-gray-300">
                                      <td className="border border-gray-300 px-2 py-1.5 text-red-600 font-bold">{parsed.raw}</td>
                                      <td className="border border-gray-300 px-2 py-1.5 text-gray-800 font-semibold">{parsed.correct}</td>
                                      <td className="border border-gray-300 px-2 py-1.5 text-gray-500 italic text-[7.5pt]">{parsed.discrepancy}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <table className="w-full text-left border-collapse border border-gray-300 text-[8.5pt]">
                              <thead>
                                <tr className="bg-[#0C2340] text-white">
                                  <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt] w-[28%]">WRITTEN (ERROR)</th>
                                  <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt] w-[28%]">CORRECT FORM</th>
                                  <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt]">GRADE DISCREPANCY</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td colSpan={3} className="border border-gray-300 px-2 py-2 text-gray-400 italic text-center">No significant spelling errors found.</td>
                                </tr>
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                      {/* Disclaimer footer */}
                      <div className="border-t border-gray-200 pt-3 text-[#141414]/40 flex justify-between items-center text-[7pt] leading-normal font-sans">
                        <div className="flex-1 max-w-[85%] text-left uppercase font-mono tracking-tighter shrink-0">
                          DISCLAIMER: {disclaimer}
                        </div>
                        <div className="font-bold text-right tabular-nums whitespace-nowrap">
                          Page 2 of 4
                        </div>
                      </div>
                    </div>

                    {/* PAGE 3 */}
                    <div className="report-page bg-white p-10 flex flex-col justify-between print:p-0 print:m-0 shadow-lg border border-gray-200 print:border-none print:shadow-none mt-8 print:mt-0" style={{ width: '210mm', height: '297mm', minHeight: '297mm', maxHeight: '297mm', boxSizing: 'border-box', pageBreakAfter: 'always' }}>
                      <div className="space-y-4">
                        {/* Minimal top header row */}
                        <div className="flex justify-between items-center text-[#718096] text-[8.5pt] border-b border-gray-200 pb-1">
                          <div className="font-medium font-sans uppercase tracking-tight text-left">
                            {studentName || 'Lyes Difle'} &nbsp;|&nbsp; GraphiaCheck Assessment REPORT
                          </div>
                          <div className="font-semibold text-right tabular-nums">
                            {new Date().toLocaleDateString('en-GB')}
                          </div>
                        </div>

                        {/* Handwriting Mechanics & Geometric elements */}
                        <div>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-2">
                            HANDWRITING MECHANICS & GEOMETRIC ELEMENTS
                          </h3>
                          <ul className="space-y-1.5 text-[8.5pt] leading-relaxed text-gray-750">
                            {[
                              { label: "Letter Formation", val: result.summary.lineFormation || result.summary.mechanics },
                              { label: "Alignment", val: result.summary.alignment },
                              { label: "Spatial Organisation", val: result.summary.verticalAnalysis || result.summary.horizontalAnalysis },
                              { label: "Writing Speed", val: result.summary.fluencyAnalysis || `Writing speed of ${reportWpm} words per minute, falls significantly below peers.` },
                              { label: "Horizontal Spatial", val: result.summary.horizontalAnalysis },
                              { label: "Vertical Spatial", val: result.summary.verticalAnalysis },
                              { label: "Line Quality", val: result.summary.lineQuality },
                              { label: "Line Formation", val: result.summary.lineFormation }
                            ].map((mechanic, i) => (
                              <li key={i} className="flex gap-2 items-start list-none pl-0">
                                <span className="text-[#0C2340] font-bold text-[10pt] shrink-0 leading-none mt-0.5">•</span>
                                <div className="text-gray-800">
                                  <strong className="text-gray-900 font-bold font-sans">{mechanic.label}:</strong> {mechanic.val}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Fluency Analysis section — table style */}
                        <div>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-0">
                            FLUENCY ANALYSIS (WORDS PER MINUTE)
                          </h3>
                          <table className="w-full text-left border-collapse border border-gray-300 text-[8.5pt]">
                            <thead>
                              <tr className="bg-[#0C2340] text-white">
                                <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt] text-center">TOTAL WORDS</th>
                                <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt] text-center">DURATION</th>
                                <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt] text-center">STUDENT WPM</th>
                                <th className="border border-gray-300 px-2 py-1.5 font-bold uppercase tracking-wider text-[7.5pt] text-center">{grade || 'GRADE'} NORM</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-300 text-center">
                                <td className="border border-gray-300 px-2 py-2">
                                  <div className="text-[14pt] font-black text-[#0c2340] leading-none">{result.summary.wordCount}</div>
                                  <div className="text-[6.5pt] text-gray-400 uppercase tracking-wide mt-0.5">words</div>
                                </td>
                                <td className="border border-gray-300 px-2 py-2">
                                  <div className="text-[14pt] font-black text-[#0c2340] leading-none">{timeTaken || 12}</div>
                                  <div className="text-[6.5pt] text-gray-400 uppercase tracking-wide mt-0.5">minutes</div>
                                </td>
                                <td className="border border-gray-300 px-2 py-2">
                                  <div className="text-[14pt] font-black text-[#0c2340] leading-none">{reportWpm}</div>
                                  <div className="text-[6.5pt] text-gray-400 uppercase tracking-wide mt-0.5">wpm</div>
                                </td>
                                <td className="border border-gray-300 px-2 py-2">
                                  <div className="text-[14pt] font-black text-red-600 leading-none">{getGradeSpeedNorm(grade)}</div>
                                  <div className="text-[6.5pt] text-red-400 uppercase tracking-wide mt-0.5">wpm norm</div>
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={4} className="border border-gray-300 px-2 py-1.5 text-[8pt] text-gray-800 italic">
                                  {result.summary.wordCount} words / {timeTaken || 12} minutes = <strong>{reportWpm} WPM.</strong> {result.summary.fluencyAnalysis || 'Slow / Labored — the physical act of writing is consuming significant cognitive load.'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Clinical Interpretation & Next Steps */}
                        <div>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-2">
                            CLINICAL INTERPRETATION & NEXT STEPS
                          </h3>
                          <div className="space-y-3">
                            <div className="border border-red-350 rounded-sm overflow-hidden bg-[#FEF2F2]/30 shadow-xs">
                              <div className="bg-red-600 text-white px-3 py-1 font-bold uppercase tracking-wider text-[8pt]">
                                PROBABILITY ESTIMATE: {getProbabilityDisplayLabel(result.summary.probabilityEstimate)}
                              </div>
                              <div className="p-2.5 text-[8.5pt] text-gray-800 leading-relaxed">
                                {result.summary.probabilityEstimate || "High probability of dysgraphia, based on spelling inaccuracies, downstream drift on unlined paper, and restrictive fluency."}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actionable Strategies Section (First 2) */}
                        <div>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-1.5">
                            ACTIONABLE STRATEGIES
                          </h3>
                          <ul className="space-y-1.5 text-[9pt] leading-normal text-gray-700 list-none pl-0">
                            {getActionableStrategies(result.report).slice(0, 2).map((strategy, i) => (
                              <li key={i} className="flex gap-2 items-start list-none pl-0">
                                <span className="text-[#0C2340] font-bold text-[10pt] shrink-0 leading-none mt-0.5">•</span>
                                <span className="text-gray-800 font-sans">{strategy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Disclaimer footer */}
                      <div className="border-t border-gray-200 pt-3 text-[#141414]/40 flex justify-between items-center text-[7pt] leading-normal font-sans">
                        <div className="flex-1 max-w-[85%] text-left uppercase font-mono tracking-tighter shrink-0 font-light font-sans">
                          DISCLAIMER: {disclaimer}
                        </div>
                        <div className="font-bold text-right tabular-nums whitespace-nowrap">
                          Page 3 of 4
                        </div>
                      </div>
                    </div>

                    {/* PAGE 4 */}
                    <div className="report-page bg-white p-10 flex flex-col justify-between print:p-0 print:m-0 shadow-lg border border-gray-200 print:border-none print:shadow-none mt-8 print:mt-0" style={{ width: '210mm', height: '297mm', minHeight: '297mm', maxHeight: '297mm', boxSizing: 'border-box', pageBreakAfter: 'always' }}>
                      <div className="space-y-4">
                        {/* Minimal top header row */}
                        <div className="flex justify-between items-center text-[#718096] text-[8.5pt] border-b border-gray-200 pb-1">
                          <div className="font-medium font-sans uppercase tracking-tight text-left">
                            {studentName || 'Lyes Difle'} &nbsp;|&nbsp; GraphiaCheck Assessment REPORT
                          </div>
                          <div className="font-semibold text-right tabular-nums">
                            {new Date().toLocaleDateString('en-GB')}
                          </div>
                        </div>

                        {/* Actionable Strategies Continued (Last 2 or 3) */}
                        <div>
                          <h3 className="text-[#0C2340] font-sans font-bold text-[9pt] uppercase tracking-wider border-b border-[#0C2340]/20 pb-0.5 mb-3">
                            ACTIONABLE STRATEGIES (CONTINUED)
                          </h3>
                          <ul className="space-y-3.5 text-[10pt] leading-relaxed text-[#141414]/80 list-none pl-0">
                            {getActionableStrategies(result.report).slice(2, 6).map((strategy, i) => (
                              <li key={i} className="flex gap-2.5 items-start list-none pl-0">
                                <span className="text-[#0C2340] font-bold text-[11pt] shrink-0 leading-none mt-0.5">•</span>
                                <span className="text-gray-800 font-sans leading-normal">{strategy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Disclaimer footer */}
                      <div className="border-t border-gray-200 pt-3 text-[#141414]/40 flex justify-between items-center text-[7pt] leading-normal font-sans">
                        <div className="flex-1 max-w-[85%] text-left uppercase font-mono tracking-tighter shrink-0">
                          DISCLAIMER: {disclaimer}
                        </div>
                        <div className="font-bold text-right tabular-nums whitespace-nowrap">
                          Page 4 of 4
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Download Buttons outside the report container */}
                  <div className="mt-8 flex flex-wrap gap-4 print:hidden justify-center">
                    <button 
                      onClick={copyAnalysisToClipboard}
                      className={`flex flex-col items-center border border-[#141414] px-6 py-2 font-mono text-xs uppercase tracking-widest transition-all group ${
                        copyStatus === 'copied' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'hover:bg-[#141414] hover:text-[#E4E3E0]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {copyStatus === 'copied' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Clipboard className="w-4 h-4" />
                        )}
                        {copyStatus === 'copied' ? 'Copied!' : 'Copy Analysis'}
                      </div>
                    </button>
                    <button 
                      onClick={saveReportToFolder}
                      disabled={saveStatus !== 'idle'}
                      className={`flex flex-col items-center border border-[#141414] px-6 py-2 font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50 group ${
                        saveStatus === 'saved' 
                          ? 'bg-green-50 border-green-500 text-green-700' 
                          : 'hover:bg-[#141414] hover:text-[#E4E3E0]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {saveStatus === 'saving' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saveStatus === 'saved' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <FolderOpen className="w-4 h-4" />
                        )}
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved to Folder' : 'Save to Folder'}
                      </div>
                    </button>
                    <button 
                      onClick={saveAsPdf}
                      disabled={isGeneratingPdf}
                      className="flex flex-col items-center border border-[#141414] px-6 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all disabled:opacity-50 group"
                    >
                      <div className="flex items-center gap-2">
                        {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isGeneratingPdf ? 'Generating...' : 'Save Report (PDF)'}
                      </div>
                      {!isGeneratingPdf && (
                        <span className="text-[7px] opacity-40 mt-0.5 group-hover:opacity-60 transition-opacity">
                          [ CTRL + S ]
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={saveAsWord}
                      disabled={isGeneratingPdf}
                      className="flex items-center gap-2 border border-[#141414] px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" /> Save Report (Word)
                    </button>
                    <button 
                      onClick={downloadReport}
                      className="flex items-center gap-2 border border-[#141414] px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                    >
                      <Download className="w-3 h-3" /> Download MD
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="flex flex-col items-center border border-[#141414] px-6 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <Printer className="w-3 h-3" /> Print PDF
                      </div>
                      <span className="text-[7px] opacity-40 mt-0.5 group-hover:opacity-60 transition-opacity">
                        [ CTRL + P ]
                      </span>
                    </button>
                    <button 
                      onClick={handleClear}
                      className="flex items-center gap-2 border border-red-200 px-6 py-3 font-mono text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Analysis
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Footer */}
      <footer 
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
        className="mt-12 border-t-2 border-[#141414] print:hidden"
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#141414] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#E4E3E0]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">GraphiaCheck</h3>
                  <p className="text-xs font-mono uppercase tracking-wider opacity-60">Clinical Analysis</p>
                </div>
              </div>
              <p className="text-sm opacity-70 leading-relaxed">
                AI-powered handwriting analysis for clinical-grade dysgraphia screening.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Product</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Features</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Pricing</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Demo</a></li>
                <li><button onClick={() => {}} className="hover:opacity-100 transition-opacity text-left">Documentation</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Support</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Help Center</a></li>
                <li><a href="mailto:support@graphiacheck.in" className="hover:opacity-100 transition-opacity">Contact Us</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">FAQs</a></li>
                <li><button onClick={onLogout} className="hover:opacity-100 transition-opacity text-left">Logout</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><a href="/?page=privacy" target="_blank" className="hover:opacity-100 transition-opacity">Privacy Policy</a></li>
                <li><a href="/?page=terms" target="_blank" className="hover:opacity-100 transition-opacity">Terms of Service</a></li>
                <li><a href="/?page=refund" target="_blank" className="hover:opacity-100 transition-opacity">Refund Policy</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Data Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#141414]/20 pt-6">
            <p className="text-xs opacity-40 font-mono uppercase tracking-widest text-center mb-4">
              Disclaimer: {disclaimer}
            </p>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm opacity-60 font-mono">
                © 2026 GraphiaCheck. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="mailto:support@graphiacheck.in" className="text-sm opacity-60 hover:opacity-100 transition-opacity font-mono">
                  support@graphiacheck.in
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
