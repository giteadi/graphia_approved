import fs from 'fs';

const IMG = '/var/folders/4s/f1n08rfx5kz2hmx1m2p8djhc0000gn/T/devin-pasted-images/1790067652313652000-53263-8-pasted.jpg';
const b64 = fs.readFileSync(IMG).toString('base64');

/**
 * Ground truth: 10 distinct strike-outs / overwrites visible in the sample.
 * Each entry lists acceptable spellings for the SAME mark, so a model is not
 * penalised for reading "cousine" as "cousin".
 */
const TRUTH = [
  ['get-together', 'get-to gether', 'gettogether', 'to-ge'],
  ['cousine', 'cousin'],
  ['en', 'in', 'on'],
  ['theite', 'their', 'there', 'theie'],
  ['every sunday', 'every month every sunday'],
  ['talk about'],
  ['when you', 'than you', 'whon you', 'when yo'],
  ['togethers', 'togethers cause', 'together s'],
  ['games', 'game'],
  ['lego'],
];

const prompt = [
  'GraphiaCheck handwriting analysis request.',
  '- Grade: Grade 11',
  '- Chronological Age: 16Y 8M',
  '- Time Given (Allotted Time): 15 minutes',
  '- Time Taken (Actual Time Spent): 15 minutes',
  '- Writing Prompt/Task Given: My family',
].join('\n');

const MODELS = process.argv.slice(2);
const summary = [];

for (const model of MODELS) {
  const t0 = Date.now();
  try {
    const res = await fetch('https://graphiacheck.in/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        grade: 'Grade 11',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          ],
        }],
      }),
    });

    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.log(`\n### ${model} -> HTTP ${res.status} after ${secs}s :: ${raw.replace(/\s+/g, ' ').slice(0, 90)}`);
      summary.push(`${model}: TIMEOUT/ERROR`);
      continue;
    }

    if (res.status !== 200) {
      console.log(`\n### ${model} -> HTTP ${res.status} (${secs}s) :: ${String(data.error).slice(0, 130)}`);
      summary.push(`${model}: HTTP ${res.status}`);
      continue;
    }

    const s = data.summary || {};
    const found = [
      ...(s.confirmedCancellations || []).map(c => String(c.text).toLowerCase()),
      ...(s.uncertainCancellations || []).map(c => String(c.text).toLowerCase()),
    ];
    const blob = found.join(' | ');

    const hits = TRUTH.filter(variants => variants.some(v => blob.includes(v)));
    const missed = TRUTH.filter(variants => !variants.some(v => blob.includes(v))).map(v => v[0]);

    console.log(`\n### ${model}  (ran: ${data.model})  ${secs}s`);
    console.log(`    detected : ${found.join(', ') || '(none)'}`);
    console.log(`    SCORE    : ${hits.length}/10`);
    console.log(`    missed   : ${missed.join(', ') || '(none)'}`);
    summary.push(`${model}: ${hits.length}/10  (${secs}s)`);
  } catch (err) {
    console.log(`\n### ${model} -> FAILED: ${err.message}`);
    summary.push(`${model}: FAILED`);
  }
}

console.log('\n================ SUMMARY ================');
summary.forEach(l => console.log('  ' + l));
