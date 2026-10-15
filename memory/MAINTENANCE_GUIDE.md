# Developer Maintenance Guide & Runbook

This guide contains essential commands, testing procedures, and operational rules for maintaining and extending the GraphiaCheck codebase.

---

## 1. Quick Command Reference

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Run Regression Tests** | `npm test` | Runs all clinical scoreEngine tests, Amaya benchmark, and cancellation preservation checks. |
| **TypeScript Typecheck** | `npx tsc --noEmit` | Strict type verification across frontend and server codebases. |
| **Production Build** | `npm run build` | Compiles Vite production bundle, checks chunk sizes and tree-shaking. |
| **Start Dev Server** | `npm run dev` | Launches frontend Vite development server with HMR. |
| **Check Git Status** | `git status --short` | Checks modified and untracked files before staging. |

---

## 2. Regression Testing Procedure

Before committing or pushing ANY change to `server/utils/scoreEngine.ts`, `analyzeController.ts`, or `src/App.tsx`, you **MUST** run:

```bash
npm test
```

### Expected Test Output:
```text
REGRESSION TEST PASSED: Uncertain cancellations handled correctly
REGRESSION TEST PASSED: Confirmed cancellations preserved
REGRESSION TEST PASSED: Helper words preserved in cancellations
REGRESSION TEST PASSED: Spelling-only highlights strict mode validated
REGRESSION TEST PASSED: Cancelled words properly filtered from spelling errors
REGRESSION TEST PASSED: Occurrence-based cancellation working correctly
REGRESSION TEST PASSED: Occurrence-aware filtering correctly preserves non-cancelled occurrences
SAFETY CHECK PASSED: All critical validations verified
MINIMAL TEST PASSED: False cancel not in confirmed list
MINIMAL TEST PASSED: will cancel appears when in confirmed list
MINIMAL TEST PASSED: Grammar phrase preserved for highlighting
MINIMAL TEST PASSED: Score does not collapse for 1-2 grammar mistakes in small text
AMAYA REFERENCE TEST PASSED: Formation: 75 Alignment: 85 Probability: MODERATE
ALL MINIMAL TESTS PASSED
```

---

## 3. How to Add a New Benchmark Test Case

To add a new student reference case (e.g. for a new grade or specific handwriting profile):

1. Open `server/utils/scoreEngine.test.ts`.
2. Define the evidence data object:
   ```typescript
   const newStudentEvidence: EvidenceData = {
     transcription: '...',
     wordCount: 120,
     confirmedCancellations: [],
     uncertainCancellations: [],
     spellingErrors: [...],
     grammarMistakes: [...],
     runOnSentences: 0,
     missingCapitals: 0,
     missingPunctuation: 0,
     pastTenseErrors: 0,
     letterFormationObservations: ['...'],
     alignmentObservations: ['...'],
     spacingObservations: ['...'],
     lineQualityObservations: ['...'],
     wpm: 12,
     rtiImprovement: true, // or false
     dsm5Traits: []
   };
   ```
3. Assert the expected scores:
   ```typescript
   const scores = calculateScoresWithNorm(newStudentEvidence, 'Grade 8');
   const prob = calculateProbability(scores, newStudentEvidence.rtiImprovement, newStudentEvidence.wpm, 'Grade 8');

   if (prob !== 'EXPECTED_PROBABILITY') {
     throw new Error(`Test failed: expected ... got ${prob}`);
   }
   ```
4. Run `npm test` to verify.

---

## 4. Architectural Rules & Don'ts

1. **NEVER statically import `jspdf`, `docx`, or `file-saver` in UI components:**
   - Always use `src/services/exportService.ts`.
   - Statically importing these packages will re-introduce 600+ KB of initial bundle bloat.
2. **NEVER define heavy tokenization loops inline in `App.tsx`:**
   - All transcription rendering and styling must stay encapsulated in `src/components/RenderTranscription.tsx` wrapped with `React.memo` and `useMemo`.
3. **NEVER modify RTI rules without clinical oversight:**
   - If `rtiImprovement === true`, probability must remain capped at `MODERATE`.
   - Bypassing this will cause false-positive high-probability dysgraphia flags on students who are actively succeeding with tiered interventions.
4. **Preserve the 3-Page Fixed Format:**
   - The `.report-page` containers in `App.tsx` have exact CSS dimensions (`width: 210mm`, `height: 297mm`, `pageBreakAfter: 'always'`).
   - Do not remove fixed height/box-sizing, as this ensures pixel-perfect A4 printing and edge-to-edge PDF capture.
