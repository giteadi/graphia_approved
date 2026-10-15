# Reference Benchmark Cases & Ground Truth Validations

This document documents the verified clinical ground-truth benchmark cases used for regression testing in `server/utils/scoreEngine.test.ts`.

---

## 1. Primary Benchmark: Amaya Taneja (Grade 12)

### 1.1 Clinical Metadata
- **Student Name:** Amaya Taneja
- **DOB:** 8th February 2009
- **Chronological Age:** ~17 years, 8 months, 7 days *(at time of October 2026 assessment)*
- **Grade:** Grade 12
- **Prompt:** *"A world without smartphones"*
- **Paper Type:** Lined / Ruled
- **Writing Instrument:** Gel Pen
- **Time Taken:** 15 minutes
- **Response to Intervention (RTI):** YES *(Student has shown positive improvement with current support)*

### 1.2 Quantitative Evidence & Ground Truth Metrics
- **Total Word Count:** 133 words
- **Writing Speed:** 9 WPM *(Grade 12 Norm: 20–30 WPM)*
- **WPM Evaluation:** Extremely Slow / Labored *(Severe motor/execution penalty)*
- **Spelling Errors Identified (4 items):**
  1. `eachother` → Intended: `each other` (approx. 3rd grade)
  2. `tetlephones` → Intended: `telephones` (approx. 4th grade)
  3. `conmenly` → Intended: `commonly` (approx. 5th grade)
  4. `critisizing` → Intended: `criticizing` (approx. 7th grade)
- **Student Cancellations (Self-Corrections - 4 items):**
  1. `[CANCELLED: there wo]` → corrected to *"the world"*
  2. `[CANCELLED: It would be]` → corrected to *"The world would be"*
  3. `[CANCELLED: out out]` → corrected to *"smartphones"*
  4. `[CANCELLED: buttom]` → corrected to *"button"*

### 1.3 Calibrated Score Profile

```json
{
  "sentenceBoundaries": 89,
  "grammar": 100,
  "pastTenseUsage": 100,
  "spelling": 71,
  "letterFormation": 75,
  "alignment": 85,
  "spatialOrganisation": 65,
  "writingSpeed": 40,
  "lineQuality": 65,
  "probability": "MODERATE",
  "basalLevel": "Grade 10",
  "ceilingLevel": "Grade 12"
}
```

> [!NOTE]
> **Why Probability is MODERATE (Not HIGH):**
> Even though writing speed is severely depressed (9 WPM vs 25 WPM norm), Amaya's language skills are advanced (Grammar 100, Past Tense 100, Sentence Boundaries 89), and most crucially, she has **demonstrated positive progress under RTI**. Per clinical guidelines, formal dysgraphia diagnosis is deferred.

---

## 2. Benchmark Case 2: Grade 10 Reference Profile

- **Grade:** Grade 10
- **Word Count:** 125 words
- **Spelling Errors:** 7 errors
- **Grammar Mistakes:** 3 errors
- **Writing Speed:** 8 WPM
- **Confirmed Cancellations:** 0
- **RTI Improvement:** NO / Not Reported

### Verified Scores:
```json
{
  "sentenceBoundaries": 64,
  "grammar": 66,
  "pastTenseUsage": 89,
  "spelling": 64,
  "letterFormation": 45,
  "alignment": 45,
  "writingSpeed": 40,
  "probability": "HIGH"
}
```
*Rationale:* Without RTI mitigation and with multi-domain impairment (Spelling 64, Formation 45, Alignment 45, WPM 40), clinical probability is appropriately classified as **HIGH**.

---

## 3. Edge Case 3: Grade 3 Short Text Sample

- **Grade:** Grade 3
- **Word Count:** 8 words
- **Grammar Mistakes:** 2 errors
- **Spelling Errors:** 0 errors
- **Writing Speed:** 10 WPM

### Score Protection Rule:
- For short samples (<25 words), grammar score **must not collapse below 50**.
- **Verified Score:** Grammar = `60` (Adequate).

---

## 4. Conflict Resolution Cases

### Case 4.1: Cancellation vs. Spelling Error Conflict
- If text contains `[CANCELLED: lego]` and OCR extraction suggests `lego` is a spelling error:
  - Sanitization step removes `lego` from `spellingErrors`.
  - **Result:** `spellingErrors.length === 0`.

### Case 4.2: Multi-Occurrence Cancellation
- Text: *"I play with lego every day. Then I broke [CANCELLED: lego]."*
- Occurrence 1: Valid word (kept).
- Occurrence 2: Cancelled (filtered out).
- **Result:** Occurrence-aware filtering accurately targets only the cancelled instance without corrupting valid word occurrences.
