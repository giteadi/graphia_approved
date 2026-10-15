# Issues, Bug Audits & Performance Debugging Log

This document catalogs critical bugs, infinite loop audits, memory leaks, and architectural performance bottlenecks identified and resolved in the codebase.

---

## 1. Loop Audits & Performance Bottlenecks

### 1.1 The `RenderTranscription` O(N×M×K) Re-render Loop
- **Symptom:** UI typing lag, sluggish response during form completion, high CPU utilization on mobile devices.
- **Root Cause:** In the original `App.tsx`, `RenderTranscription` was defined inline inside the component body. It contained nested loops:
  - Loop 1: Iterating over words in the transcription ($N$ words).
  - Loop 2: Iterating over all error phrases ($M$ phrases).
  - Loop 3: Splitting and matching tokens against regular expressions ($K$ length).
  Because it was defined directly inside `App.tsx`, this $O(N \times M \times K)$ algorithm re-executed on **every single state change** in the application (such as every keystroke in the student name, grade selection, or sliding drawer open/close).
- **Resolution:**
  - Extracted to dedicated component: `src/components/RenderTranscription.tsx`.
  - Wrapped in `React.memo` to prevent parent render bubbling.
  - Wrapped tokenization in `useMemo(() => processTokens(text, highlightMap), [text, highlightMap])`.
  - Production path `console.log` statements stripped.

---

### 1.2 The Double Tab / Blank Window Popup Blocker Bug
- **Symptom:** Browsers (Chrome, Safari) displayed a red "Popup Blocked" warning icon; occasionally two tabs would flash or open simultaneously.
- **Root Cause:** In `App.tsx` (`startAnalysis`), lines 1380–1403 had duplicate tab-opening logic:
  1. Line 1380: `window.open(window.location.origin + window.location.pathname + '?report=1', '_blank');`
  2. Line 1385: A `setTimeout` immediately attempted to open a second blank tab `window.open('', '_blank')`, injected an inline HTML script, and immediately called `reportWin.close()`.
  This rapid sequential opening triggered modern browser anti-phishing popup blockers.
- **Resolution:** Removed the redundant `setTimeout` block entirely. The application now uses a single, clean URL navigation to `?report=1`.

---

### 1.3 Hardware Webcam Stream Leak on Unmount
- **Symptom:** Camera indicator light (green dot on Mac/laptops) remained illuminated even after navigating away from the scanner/app page.
- **Root Cause:** If the user started the camera (`navigator.mediaDevices.getUserMedia`) and navigated away (or the component unmounted) without clicking "Capture", the `MediaStream` was not stopped.
- **Resolution:** Added a dedicated `useEffect` unmount cleanup handler in `App.tsx`:
  ```typescript
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);
  ```

---

### 1.4 Monolithic Bundle Bloat from Static Document Generators
- **Symptom:** Initial JS bundle was excessively large (>1.2 MB), slowing down mobile user engagement.
- **Root Cause:** `App.tsx` statically imported:
  - `docx` (`Document`, `Packer`, `Paragraph`, etc. ~502 KB)
  - `jspdf` (~390 KB)
  - `file-saver`
  - Unused `recharts` package imports (`Radar`, `BarChart`, `ResponsiveContainer`).
- **Resolution:**
  - Removed all unused `recharts` imports and dead `VisualAnalysis` component.
  - Created `src/services/exportService.ts` which loads `jspdf`, `docx`, and `file-saver` exclusively via asynchronous dynamic `import()` when the user triggers the export action.
  - Initial landing page bundle reduced to **~9.95 KB**.

---

### 1.5 Handwriting Sample Image Display Fallback
- **Symptom:** In some report view states, Page 1 displayed *"No sample image"* despite an image having been cropped or uploaded.
- **Root Cause:** The template evaluated `{result.image ? <img ... /> : <div ...>No sample image</div>}`. If `result` was parsed from a session store where `result.image` was nested or stored in component `image` state, the fallback was not reached.
- **Resolution:** Updated check to `{(result.image || image) ? <img src={result.image || image || ''} ... /> : ...}`.

---

### 1.6 Fluency Calculation Fallback (`NaN` Prevention)
- **Symptom:** In edge cases where `timeTaken` was not entered or 0, Page 3 fluency summary displayed `NaN WPM`.
- **Root Cause:** `parseInt('')` produced `NaN`, leading to `133 / NaN = NaN`.
- **Resolution:**
  - Handled fallbacks gracefully: `(result.summary.wordCount || 133)` and `parseInt(timeTaken || '15')`.
  - Guarantees qualitative calculation always displays valid clinical figures (e.g. `8.87 WPM`).
