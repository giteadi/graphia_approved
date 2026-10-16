# GraphiaCheck Knowledge Base & System Memory

Welcome to the **GraphiaCheck Memory Directory**. This directory serves as the centralized institutional knowledge, clinical rules repository, architectural blueprints, and debugging audit logs for GraphiaCheck.

---

## Directory Index

| File | Description | Key Topics |
| :--- | :--- | :--- |
| **[`ARCHITECTURE.md`](file:///Users/adityasharma/Desktop/graphia_approved/memory/ARCHITECTURE.md)** | Technical Architecture & System Design | React 19 + Vite, Node.js + Express backend, Proxy layer, Route-level Code Splitting, Dynamic Import Export Service, Rollup manual chunks, Rendering pipeline |
| **[`SCORING_RULES_AND_NORMS.md`](file:///Users/adityasharma/Desktop/graphia_approved/memory/SCORING_RULES_AND_NORMS.md)** | Clinical Rules, Norms & Scoring Engine | WPM norms by grade, DSM-5 Dysgraphia criteria, Response to Intervention (RTI) rules, Score calculation formulas, Basal & Ceiling Level criteria |
| **[`CASES_AND_BENCHMARKS.md`](file:///Users/adityasharma/Desktop/graphia_approved/memory/CASES_AND_BENCHMARKS.md)** | Clinical Test Cases & Ground Truth Benchmarks | Amaya Taneja Grade 12 reference case, Grade 10 reference, Grade 3 small sample test, Cancellation preservation cases, Multi-occurrence words |
| **[`ISSUES_AND_DEBUGGING_LOG.md`](file:///Users/adityasharma/Desktop/graphia_approved/memory/ISSUES_AND_DEBUGGING_LOG.md)** | Loop Audits, Bugs & Performance Fixes | Token matching O(N×M×K) loop memoization, Double-tab popup blocker bug, Camera hardware leak on unmount, Recharts dead import removal, Word count and fluency fallbacks |
| **[`MAINTENANCE_GUIDE.md`](file:///Users/adityasharma/Desktop/graphia_approved/memory/MAINTENANCE_GUIDE.md)** | Developer Guide & Operations Runbook | Running tests, TypeScript validation, Production build checks, Adding new test cases, Common pitfalls to avoid |
| **[`SERVER_AND_DEPLOYMENT.md`](file:///Users/adityasharma/Desktop/graphia_approved/memory/SERVER_AND_DEPLOYMENT.md)** | Production Infrastructure & Deployment Runbook | VPS IP (195.35.45.17), Hostinger VM ID 749165, User credentials (aditya / root), Fail2ban rules, Paths (/var/www/graphiacheck, /root/graphia), Nginx config, PM2 process management |
| **[`MULTI_PAGE_UPLOAD.md`](file:///Users/adityasharma/Desktop/graphia_approved/memory/MULTI_PAGE_UPLOAD.md)** | Multi-Page PDF & Image Upload System | Max 4 pages (ChatGPT/Gemini style), PDF 2.2x scale canvas extraction, Thumbnail strip UI, Per-page crop/rotate/delete, Multi-image GPT-4o vision OCR, Report sample tabs |

---

## Core Mission & Calibration Philosophy

GraphiaCheck is a specialized clinical evaluation platform for identifying signs of **Dysgraphia** (Specific Learning Disorder in Written Expression) and handwriting motor coordination issues in school-age and college students.

- **Non-punitive Evaluation:** Handwriting difficulties are distinguished from intellectual ability or linguistic competency.
- **RTI Compliance:** Positive response to prior interventions must mitigate diagnostic alarm and defer formal psycho-educational labels where appropriate.
- **Strict Evidence Boundaries:** Crossed-out / cancelled words by students must never be scored as spelling errors.
