# Clinical Scoring Rules, Norms & Diagnostic Standards

This document establishes the clinical evaluation rules, numerical norms, and scoring algorithms implemented in `server/utils/scoreEngine.ts`.

---

## 1. Grade-Level Writing Speed (WPM) Norms

Writing speed is evaluated by comparing student Words Per Minute (WPM) against standard developmental benchmarks:

$$\text{WPM} = \frac{\text{Word Count}}{\text{Time Taken (minutes)}}$$

| Grade Level | Expected Normal WPM | Slow / Labored Threshold | Severe Impairment Threshold |
| :--- | :--- | :--- | :--- |
| **Grade 1** | 5 – 8 WPM | < 5 WPM | < 3 WPM |
| **Grade 2** | 8 – 12 WPM | < 8 WPM | < 5 WPM |
| **Grade 3** | 10 – 15 WPM | < 10 WPM | < 6 WPM |
| **Grade 4** | 12 – 18 WPM | < 12 WPM | < 8 WPM |
| **Grade 5** | 15 – 20 WPM | < 15 WPM | < 10 WPM |
| **Grade 6 – 12** | 20 – 30 WPM | < 20 WPM | < 12 WPM |
| **College (Year 13–15)** | 30 – 40 WPM | < 25 WPM | < 15 WPM |

### Writing Speed Scoring
- **Normal Range:** Score = `80 – 100` (Qualitative: *Competent / Fluid*)
- **Mild Slowdown:** Score = `60 – 79` (Qualitative: *Adequate / Slightly Slow*)
- **Severe Labored Output:** Score = `30 – 50` (Qualitative: *Extremely Slow / Labored / Needs Attention*)

---

## 2. Response to Intervention (RTI) Diagnostic Rule

> [!IMPORTANT]
> **Core Clinical Mandate:**
> Under IDEA and DSM-5 guidelines, a student who demonstrates positive progress when given targeted educational accommodations or tiered interventions (**RTI Improvement: YES**) must **NOT** be given a premature or severe diagnostic label.

### Implementation Rule:
```typescript
if (rtiImprovement) {
  // If student is responding to current supports, cap probability at MODERATE
  if (probability === 'HIGH') {
    probability = 'MODERATE';
  }
}
```

### Recommendation Alignment:
- When `rtiImprovement === true`:
  - **Assessment Recommendation:** *"Continued monitoring and support are recommended. Because the student has shown positive improvement with current interventions, a formal psycho-educational evaluation is not recommended at this time."*
  - **Probability Estimate:** *"Moderate probability of underlying written expression difficulties based on severely delayed fluency and working memory errors, but formal diagnosis is deferred due to positive RTI response."*

---

## 3. Cancellation & Self-Correction Rule

1. **Student Cancellations = Positive Self-Monitoring:**
   When a student crosses out a word (e.g. `[CANCELLED: out out]`, `[CANCELLED: buttom]`), this is clinical evidence of **working memory active monitoring**, not a phonetic deficiency.
2. **Strict Non-Contamination Rule:**
   - Any word confirmed as cancelled by the student **MUST NEVER** appear in the `spellingErrors` table.
   - Any word marked `[CANCELLED: ...]` must be excluded from the final word count calculation for fluency.
3. **Multi-Occurrence Tracking:**
   If a word appears multiple times (e.g., first occurrence valid, second occurrence crossed out), the occurrence index (`occurrence: 1`, `occurrence: 2`) must be strictly respected.

---

## 4. Domain Scoring Algorithms

### 4.1 Sentence Boundaries (0–100)
- Baseline: `100`
- Run-on sentences: `-10` points each
- Missing capitals at sentence starts: `-5` points each
- Missing terminal punctuation (period/question mark): `-5` points each
- Floor: `40`

### 4.2 Grammar & Syntax (0–100)
- Evaluates subject-verb agreement, verb tense consistency, and phrase structure.
- Small text protection: For samples `< 25 words`, 1–2 minor mistakes must not collapse the score below `50`.

### 4.3 Spelling Accuracy (0–100)
Calculated based on error density per 100 words:
$$\text{Spelling Error Rate} = \frac{\text{Spelling Errors}}{\text{Word Count}} \times 100$$
- Error rate `< 2%`: Score `85 – 100` (Competent)
- Error rate `2% – 5%`: Score `70 – 84` (Adequate / Grade Level Appropriate)
- Error rate `> 5%`: Score `< 70` (Needs Attention)

### 4.4 Handwriting Mechanics (Formation & Alignment)
- **Ruled Paper Rule:** If student wrote on lined/ruled paper and baseline drifting is minimal, **Alignment Score MUST be $\ge 80$** (Competent).
- **Cursive Hybrid Rule:** If handwriting is a cursive-print hybrid with inconsistent connectors but remains legible, **Letter Formation Score MUST be $\ge 70$** (Adequate).

---

## 5. Basal & Ceiling Level Determination

- **Basal Level:** The highest grade or functional developmental level where the student demonstrates consistent competence (e.g., *Grade 10 — High-level vocabulary, paragraph structuring, conditional ideation*).
- **Ceiling Level:** The grade level where performance significantly breaks down under timed pressure (e.g., *Grade 12 — Execution fluency collapses to 9 WPM, producing working memory transcription slips*).
