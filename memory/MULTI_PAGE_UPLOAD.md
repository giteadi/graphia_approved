# Multi-Page Handwriting Upload Support (PDF & Multiple Images)

## Overview
GraphiaCheck supports multi-page handwriting submissions (up to 4 pages / images), mirroring the upload experience of models like ChatGPT and Google Gemini. This allows students who write longer multi-page essays (e.g. 2 to 4 pages) to have their entire continuous writing sample analyzed as a single clinical assessment.

---

## 1. Feature Specifications & Limits

- **Maximum Pages / Images:** Up to **4 pages** per diagnostic run.
- **Accepted File Formats:**
  - **PDF Documents:** Multi-page PDFs (automatically extracts up to 4 pages).
  - **Image Files:** JPG, JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, JFIF.
  - **Word Documents:** DOCX, DOC (rendered via Mammoth + html2canvas).
- **Max File Size:** 50MB per uploaded file.
- **Client Resolution:** PDF pages rendered at `2.2x` scale using `pdfjs-dist` to preserve fine handwriting strokes without exceeding browser memory limits.

---

## 2. Frontend Architecture & Flow

### State Management (`src/App.tsx`)
```typescript
const [images, setImages] = useState<string[]>([]);
const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
const image = images[activeImageIndex] || images[0] || null;
```
- **Backward Compatibility:** Single `image` string reference is maintained via getter so any legacy component or service still receives `images[activeImageIndex] || images[0]`.
- **`removeImage(index)`**: Removes the selected page and clamps `activeImageIndex` safely.
- **`clearAllImages()`**: Resets the entire page array and active index.

### Multi-Page PDF Extraction (`processFiles`)
When a PDF file is dropped or selected:
1. `pdfjs-dist` dynamically loads `pdf.worker.min.mjs`.
2. Pages 1 through `Math.min(pdf.numPages, 4)` are sequentially rendered on an offscreen HTML5 `<canvas>` at scale `2.2`.
3. High-quality JPEG data URLs (`image/jpeg`, 0.90 quality) are generated and pushed into `images`.
4. `activeImageIndex` is set to `0` (Page 1).

### Multi-Image Selection (`handleImageUpload`)
- The file input element contains the `multiple` attribute:
  ```html
  <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="..." />
  ```
- User can select multiple images at once via file picker or drag & drop.
- User can also click `+ Add Page` or `Upload File` repeatedly to append additional pages up to the 4-page ceiling.

### Thumbnail Strip UI (ChatGPT / Gemini Style)
Underneath the active sample preview box, a 4-slot thumbnail strip is displayed:
- **Active Page Indicator:** Displays a pill badge e.g. `PAGE 1 OF 3` on the main image preview.
- **Thumbnail Slots:**
  - Each uploaded page is shown in an aspect-ratio thumbnail card with a `Page X` badge.
  - Active page is highlighted with a solid dark border and elevation ring.
  - Clicking any thumbnail switches the active preview to that page.
  - Each thumbnail has a top-right `×` (delete) button to remove that specific page.
- **Add Page Button (`+ Add Page`):**
  - Appears whenever `images.length < 4`.
  - Clicking opens the file dialog to add the next page.
- **Per-Page Editing:**
  - **Crop (`CropIcon`):** Crops the currently active page.
  - **Rotate (`RotateCw`):** Rotates the currently active page 90 degrees clockwise.

### Clinical Report Multi-Page Tabs
In the generated report (`ORIGINAL HANDWRITING SAMPLE` section):
- If `images.length > 1`, a compact tab strip (`P.1`, `P.2`, `P.3`, `P.4`) appears above the sample preview.
- Evaluators and parents can click between pages to inspect each page of the original handwritten sample directly inside the clinical report view.

### Persistence & Session Restore
- **Session Restore:** In `sessionStorage['graphia_report_result']`, `images: string[]` is persisted alongside `image`. If opened in a new tab or refreshed, all pages are restored.
- **Saved Reports:** In `SavedReport` interface (`localStorage['graphiacheck_reports']`), `images: string[]` is saved and reloaded upon clicking any saved report in the dashboard.

---

## 3. Backend Vision OCR Pipeline

### Client Service (`src/services/gemini.ts`)
```typescript
export async function analyzeHandwriting(
  imageBase64: string | string[],
  grade: string,
  ...
): Promise<AnalysisResult>
```
- Converts `imageBase64` into an array of up to 4 images.
- Sends each page as an independent `image_url` block in the POST request body to `/api/analyze`:
  ```json
  [
    { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } },
    { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }
  ]
  ```

### Backend Controller (`server/controllers/analyzeController.ts`)
- Parses all incoming `image_url` blocks from `req.body.messages`.
- Multi-page sample instruction injected into GPT-4o forensic OCR prompt:
  ```typescript
  function buildExtractionPrompt(grade: string, pageCount: number = 1): string {
    const multiPageNotice = pageCount > 1
      ? `\n\n════ MULTI-PAGE SAMPLE NOTICE ════\nThe student's writing sample spans ${pageCount} consecutive pages (Page 1 through Page ${pageCount}). Transcribe the continuous handwriting across all ${pageCount} pages sequentially from beginning to end without skipping lines or pages. Transcribe the entire text as a single cohesive transcription.\n`
      : '';
    ...
  }
  ```
- All images are provided in parallel to both `step1` (Evidence Extraction) and `step1b` (Strike-through cancellation pass).
- Yields a single consolidated, verbatim transcription across all pages, accurate total word count, and valid fluency/WPM metrics.

---

## 4. Key Files Modified

| File | Purpose |
| :--- | :--- |
| [`src/App.tsx`](file:///Users/adityasharma/Desktop/graphia_approved/src/App.tsx) | `images` array state, `processFiles` PDF/image loop, 4-slot thumbnail strip, multi-page report tabs, per-page delete/rotate/crop |
| [`src/services/gemini.ts`](file:///Users/adityasharma/Desktop/graphia_approved/src/services/gemini.ts) | `AnalysisResult.images`, multi-image payload builder in `analyzeHandwriting` |
| [`server/controllers/analyzeController.ts`](file:///Users/adityasharma/Desktop/graphia_approved/server/controllers/analyzeController.ts) | Multi-page extraction prompt notice, multi-image input pass to GPT-4o vision |
| [`memory/CASES_AND_BENCHMARKS.md`](file:///Users/adityasharma/Desktop/graphia_approved/memory/CASES_AND_BENCHMARKS.md) | Clinical test cases & benchmarks documentation update |

---

## 5. Verification & Testing Runbook

### Regression Test Suite
Run local unit and calibration tests:
```bash
npx tsx server/utils/scoreEngine.test.ts
```
*(Ensures Amaya Grade 12 reference, G10 reference, and G3 small sample pass 100%).*

### Frontend Build Verification
Verify production Vite compilation:
```bash
npm run build
```

### Production Deployment (Hostinger VPS `195.35.45.17`)
Only upload the modified files:
```bash
# 1. Upload backend controller
scp server/controllers/analyzeController.ts aditya@195.35.45.17:/tmp/analyzeController.ts
ssh aditya@195.35.45.17 "echo 'RuhiRiya@12345' | sudo -S cp /tmp/analyzeController.ts /root/graphia/controllers/analyzeController.ts && echo 'RuhiRiya@12345' | sudo -S cp /tmp/analyzeController.ts /root/graphia/server/controllers/analyzeController.ts"

# 2. Restart backend PM2
ssh aditya@195.35.45.17 "echo 'RuhiRiya@12345' | sudo -S pm2 restart graphia"

# 3. Deploy frontend dist
rsync -avz dist/ aditya@195.35.45.17:/tmp/graphia_dist/
ssh aditya@195.35.45.17 "echo 'RuhiRiya@12345' | sudo -S cp -r /tmp/graphia_dist/* /var/www/graphiacheck/ && echo 'RuhiRiya@12345' | sudo -S chown -R www-data:www-data /var/www/graphiacheck && rm -rf /tmp/graphia_dist"

# 4. Verify endpoints
ssh aditya@195.35.45.17 "curl -s http://localhost:3002/health"
curl -I https://graphiacheck.in/app
```
