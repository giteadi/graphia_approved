Solution ye hai: AI ko score decide karne mat do. AI sirf evidence nikale, score code calculate kare.
Kya Karna Hoga
OCR ko strict banana hoga
Model se sirf ye nikalwana hai:
exact transcription
spelling errors list
grammar mistakes list
missing punctuation count
missing capital count
run-on sentence count
past tense errors count
letter formation observations
alignment observations
spacing observations

Scores AI se nahi, code se calculate honge
Backend me fixed formula lagao:
Spelling = 100 - spellingErrors × 10
Sentence Boundaries = 100 - runOns×15 - missingCapitals×10 - missingPunctuation×10
Grammar = 100 - agreement×15 - plural×15 - syntax×20 - other×10
Past Tense = 100 - pastTenseErrors×20

Client report ke hisaab se calibration karo
Is writing sample ke liye expected evidence roughly:
spellingErrors = 7
missingCapitals = 1
missingPunctuation = 2
runOns = 0
grammarMistakes = 3
pastTenseErrors = 2
formationObservations = 3+
alignmentObservations = 1
Isse output aayega:
Sentence Boundaries = 70
Grammar = 50
Past Tense = 60
Spelling = 30
Formation = 65
Alignment = 75

AI prompt me strict instruction daalni hogi
Prompt me clear likhna hoga:
Do not autocorrect.
Do not improve grammar.
Preserve misspellings exactly.
Count repeated spelling errors separately.
Count missing punctuation and capitalization.
Return evidence only. Do not assign scores.

Backend response ko overwrite karna hoga
Agar AI report me galat score de bhi de, backend final JSON me apna calculated score hi bheje.
Matlab frontend ko hamesha backend formula wale scores milne chahiye.

Testing ke liye reference case add karo
Code me ek test banao:
input evidence = client sample jaisa
expected score = client report jaisa
Agar formula badal jaye aur score mismatch ho, test fail ho.

Manual Word Count normal flow me hatao ya hide karo
Client standard ke hisaab se word count model/OCR se aana chahiye.
Manual count sirf admin/debug ke liye ho sakta hai, user ke liye nahi.

Final Architecture
Upload image
   ↓
AI OCR evidence extraction only
   ↓
Backend deterministic formula
   ↓
Backend fixed summary JSON
   ↓
Frontend report renders same scores
Sabse important fix
Abhi problem ye hai ki AI “analysis” kar raha hai. Isko change karke AI ko sirf “evidence extractor” banana hoga. Analysis/scoring formula backend code me lock karna hoga.


<!-- Changes kis file m kya krna h vo neeche likha h  -->

Haan, ye files change karni hongi:
1. server/controllers/analyzeController.ts
Yahi main file hai.
Isme karna hoga:
AI prompt ko strict OCR/evidence extraction prompt banana.
AI se score nahi mangna.
AI se sirf evidence mangna:transcription
spellingErrors
grammarMistakes
missingCapitals
missingPunctuation
runOnSentences
pastTenseErrors
handwriting observations

Evidence ke baad score backend formula se calculate karna.
Final JSON summary me AI ke scores overwrite karna.
Most important change yahi hai.
2. server/utils/scoreEngine.ts
Formula yaha rakho.
Isme functions hone chahiye:
scoreSpelling()
scoreSentenceBoundaries()
scoreGrammar()
scorePastTense()
scoreLetterFormation()
scoreAlignment()
scoreWritingSpeed()
calculateScoresWithNorm()
calculateProbability()
Client report ke hisaab se formula yahi lock hoga.
Example:
Spelling = 100 - errors × 10
Past Tense = 100 - errors × 20
Sentence = 100 - runOns×15 - missingCaps×10 - missingPunct×10
Grammar = issue type ke basis pe deduction
3. server/utils/scoreEngine.test.ts
Ye test file add karni hogi.
Isme client wali report ka reference case rakho:
spellingErrors = 7
missingCapitals = 1
missingPunctuation = 2
grammarMistakes = 3
pastTenseErrors = 2
wpm = 8
formationObservations = 3
alignmentObservations = 1
Expected output:
Sentence Boundaries = 70
Grammar = 50
Past Tense = 60
Spelling = 30
Formation = 65
Alignment = 75
Isse future me formula tootega nahi.
4. src/services/gemini.ts
Frontend se backend ko prompt bhejne wali file.
Isme old bada AI-analysis prompt hatao.
Frontend ko sirf metadata bhejna chahiye:
Grade
Age
Time Taken
Time Given
Prompt
Paper Type
Writing Instrument
Observations
Data Sources
AI analysis prompt frontend me nahi hona chahiye.
5. src/App.tsx
Report display wali file.
Isme karna hoga:
UI me scores backend summary se hi dikhaye.
WPM frontend me alag formula se recalculate na ho.
result.summary.wpm use kare.
result.summary.scores.sentenceBoundaries etc. directly use kare.
Manual Word Count ko normal user flow me hide/optional admin/debug banana.
Report page layout g1O jaisa maintain karna.
6. package.json
Test command add karna:
"test": "tsx server/utils/scoreEngine.test.ts"
Taaki formula verify ho sake.
Optional / Minor
7. src/index.css
Agar PDF export me font/CSS warning aa rahi ho to fix karo.
Ye scoring ke liye important nahi hai, bas build clean rakhta hai.
Short Summary
Sabse important 4 files:
server/controllers/analyzeController.ts
server/utils/scoreEngine.ts
src/services/gemini.ts
src/App.tsx
Testing ke liye:
server/utils/scoreEngine.test.ts
package.json
In files me change karke hi client wali scoring standard match hogi.