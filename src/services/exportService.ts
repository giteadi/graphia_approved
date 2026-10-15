import { domToPng } from 'modern-screenshot';
import { AnalysisResult } from './gemini';
import {
  escapeRegExp,
  normalizeForUiMatch,
  normalizeForSpellingMatch
} from '../components/RenderTranscription';

export interface ExportWordOptions {
  result: AnalysisResult;
  image?: string | null;
  studentName?: string;
  schoolName?: string;
  cityName?: string;
  countryName?: string;
  uploadedBy?: string;
  contactEmail?: string;
  contactPhone?: string;
  grade: string;
  disclaimer: string;
  reportElement?: HTMLElement | null;
}

export async function exportReportAsPdf(
  reportElement: HTMLElement,
  fileName: string = `GraphiaCheck_Report_${Date.now()}.pdf`
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const pages = reportElement.querySelectorAll('.report-page');
  if (pages.length === 0) {
    throw new Error('No report pages found to generate PDF');
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i] as HTMLElement;

    const dataUrl = await domToPng(pageEl, {
      scale: 2.2,
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

    pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  pdf.save(fileName);
}

export async function exportReportAsWord(options: ExportWordOptions): Promise<void> {
  const {
    result,
    image,
    studentName,
    schoolName,
    cityName,
    countryName,
    uploadedBy,
    contactEmail,
    contactPhone,
    grade,
    disclaimer,
    reportElement
  } = options;

  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
    AlignmentType,
    BorderStyle
  } = await import('docx');
  const { saveAs } = await import('file-saver');

  const base64ToUint8Array = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  let sampleImageBytes: Uint8Array | null = null;
  if (image && image.startsWith('data:')) {
    sampleImageBytes = base64ToUint8Array(image.split(',')[1]);
  }

  let chartsImageBytes: Uint8Array | null = null;
  const visualAnalysisEl = reportElement?.querySelector('.visual-analysis-container');
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
      console.error('Failed to capture charts for Word doc:', chartErr);
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
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
                text: studentName ? studentName.toUpperCase() : 'STUDENT REPORT',
                font: 'Times New Roman',
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'GRAPHIA CHECK ASSESSMENT REPORT',
                font: 'Times New Roman',
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
                font: 'Times New Roman',
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
                  font: 'Times New Roman',
                  size: 18,
                  color: '666666',
                }),
              ],
            }),
          ] : []),
          new Paragraph({ text: '' }),

          ...(sampleImageBytes ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              keepNext: true,
              children: [
                new TextRun({ text: 'HANDWRITING SAMPLE', font: 'Times New Roman', size: 20, bold: true }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              keepNext: true,
              children: [
                new ImageRun({
                  data: sampleImageBytes,
                  transformation: { width: 400, height: 250 },
                  type: 'jpg'
                }),
              ],
            }),
          ] : []),

          ...(chartsImageBytes ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              keepNext: true,
              children: [
                new TextRun({ text: 'VISUAL ANALYSIS', font: 'Times New Roman', size: 20, bold: true }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              keepNext: true,
              children: [
                new ImageRun({
                  data: chartsImageBytes,
                  transformation: { width: 500, height: 250 },
                  type: 'png'
                }),
              ],
            }),
          ] : []),

          new Paragraph({
            keepNext: true,
            children: [
              new TextRun({
                text: 'CLINICAL SUMMARY',
                font: 'Times New Roman',
                size: 24,
                bold: true,
                underline: {},
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Probability Estimate: ', font: 'Times New Roman', size: 22, bold: true }),
              new TextRun({ text: result.summary.probabilityEstimate, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Basal Level: ', font: 'Times New Roman', size: 22, bold: true }),
              new TextRun({ text: result.summary.basalLevel, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Ceiling Level: ', font: 'Times New Roman', size: 22, bold: true }),
              new TextRun({ text: result.summary.ceilingLevel, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'WRITTEN LANGUAGE SKILLS:', font: 'Times New Roman', size: 22, bold: true, underline: {} }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Sentence Boundaries: ', font: 'Times New Roman', size: 22, bold: true }),
              new TextRun({ text: `(${result.summary.scores.sentenceBoundaries}/100) ${result.summary.languageSkills.sentenceBoundaries}`, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Grammar: ', font: 'Times New Roman', size: 22, bold: true }),
              new TextRun({ text: `(${result.summary.scores.grammar}/100) ${result.summary.languageSkills.grammar}`, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Past Tense Usage: ', font: 'Times New Roman', size: 22, bold: true }),
              new TextRun({ text: `(${result.summary.scores.pastTenseUsage}/100) ${result.summary.languageSkills.pastTenseUsage}`, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({ text: '' }),

          ...(result.summary.academicDiscrepancy ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Academic Discrepancy: ', font: 'Times New Roman', size: 22, bold: true }),
                new TextRun({ text: result.summary.academicDiscrepancy, font: 'Times New Roman', size: 22 }),
              ],
            }),
            new Paragraph({ text: '' }),
          ] : []),

          new Paragraph({ text: '' }),
          new Paragraph({
            keepNext: true,
            children: [
              new TextRun({ text: 'OCR TRANSCRIPTION:', font: 'Times New Roman', size: 22, bold: true, underline: {} }),
            ],
          }),
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: (() => {
              const transcription = result.summary.displayTranscription || result.summary.transcription || '';
              const highlightMap: any = result.summary.highlightMap || { redWords: [], redPhrases: [], strikePhrases: [], targets: [] };
              const redWords = [...(highlightMap.redWords || [])].sort((a: any, b: any) => b.length - a.length);
              const redPhrases = [...(highlightMap.redPhrases || [])].sort((a: any, b: any) => b.length - a.length);
              const grammarPhrases = [...((highlightMap.targets || [])).filter((t: any) => t.kind === 'grammar').map((t: any) => t.text)].sort((a: any, b: any) => b.length - a.length);
              const strikePhrases = [...(highlightMap.strikePhrases || [])].sort((a: any, b: any) => b.length - a.length);

              const runs: any[] = [];
              const parts = transcription.split(/(\[(?:cancelled|CANCELLED|maybe-cancelled|MAYBE-CANCELLED):.*?\])/gi);

              const pushStyledText = (value: string, kind: any) => {
                if (!value) return;
                runs.push(new TextRun({
                  text: value,
                  font: 'Times New Roman',
                  size: 22,
                  italics: true,
                  ...(kind === 'red' ? { bold: true, color: 'CC0000' } : {}),
                  ...(kind === 'orange' ? { bold: true, color: 'CC6600' } : {}),
                  ...(kind === 'strike' ? { strike: true, color: '888888' } : {}),
                  ...(kind === 'maybe' ? { bold: true, color: 'CC0000' } : {}),
                }));
              };

              const splitByPhrases = (input: string, phrases: string[], kind: any): any => {
                let pieces: any[] = [{ text: input, kind: 'plain' }];
                for (const phrase of phrases) {
                  const pattern = new RegExp(`(\\b${escapeRegExp(phrase)}\\b)`, 'gi');
                  const next: any[] = [];
                  for (const piece of pieces) {
                    if (piece.kind !== 'plain') {
                      next.push(piece);
                      continue;
                    }
                    const chunks = piece.text.split(pattern);
                    for (const chunk of chunks) {
                      if (!chunk) continue;
                      if (normalizeForUiMatch(chunk) === normalizeForUiMatch(phrase)) {
                        next.push({ text: chunk, kind });
                      } else {
                        next.push({ text: chunk, kind: 'plain' });
                      }
                    }
                  }
                  pieces = next;
                }
                return pieces;
              };

              const renderPlainWords = (value: string) => {
                const words = value.split(/(\s+)/);
                words.forEach((word: string) => {
                  const normalized = normalizeForUiMatch(word);
                  if (!normalized) {
                    pushStyledText(word, 'plain');
                    return;
                  }
                  const normalizedSpelling = normalizeForSpellingMatch(word);
                  const isRed = redWords.some(
                    item => normalizeForSpellingMatch(item) === normalizedSpelling
                  );
                  pushStyledText(word, isRed ? 'red' : 'plain');
                });
              };

              parts.forEach((part: string) => {
                if (/^\[(?:cancelled|CANCELLED):/i.test(part)) {
                  const content = part.replace(/^\[(?:cancelled|CANCELLED):\s*/i, '').replace(/\]$/, '');
                  pushStyledText(content + ' ', 'strike');
                  return;
                }
                if (/^\[(?:maybe-cancelled|MAYBE-CANCELLED):/i.test(part)) {
                  const content = part.replace(/^\[(?:maybe-cancelled|MAYBE-CANCELLED):\s*/i, '').replace(/\]$/, '');
                  pushStyledText(content + ' ', 'maybe');
                  return;
                }

                const strikeSplit = splitByPhrases(part, strikePhrases, 'strike');
                strikeSplit.forEach((piece: any) => {
                  if (piece.kind === 'strike') {
                    pushStyledText(piece.text, 'strike');
                    return;
                  }
                  const redSplit = splitByPhrases(piece.text, redPhrases, 'red');
                  redSplit.forEach((redPiece: any) => {
                    if (redPiece.kind === 'red') {
                      pushStyledText(redPiece.text, 'red');
                      return;
                    }
                    const grammarSplit = splitByPhrases(redPiece.text, grammarPhrases, 'orange');
                    grammarSplit.forEach((grammarPiece: any) => {
                      if (grammarPiece.kind === 'orange') {
                        pushStyledText(grammarPiece.text, 'orange');
                        return;
                      }
                      renderPlainWords(grammarPiece.text);
                    });
                  });
                });
              });

              return runs;
            })(),
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'SPELLING PATTERNS & GRADE LEVEL DISCREPANCIES:', font: 'Times New Roman', size: 22, bold: true, underline: {} }),
            ],
          }),
          ...(result.summary.spellingErrors || []).map(err => {
            return new Paragraph({
              children: [
                new TextRun({ text: `${err.written} (${err.intended}) - ${err.gradeLevel}`, font: 'Times New Roman', size: 22 }),
              ],
            });
          }),
          new Paragraph({ text: '' }),
          ...result.report.split('\n').map(line => {
            const isHeading1 = line.trim().startsWith('# ');
            const isHeading2 = line.trim().startsWith('## ');
            const isHeading3 = line.trim().startsWith('### ');
            const isBold = line.includes('**');
            const cleanLine = line.replace(/[*#]/g, '').trim();
            if (!cleanLine) return new Paragraph({ text: '' });

            return new Paragraph({
              spacing: { before: isHeading1 || isHeading2 ? 240 : 0, after: 120 },
              children: [
                new TextRun({
                  text: cleanLine,
                  font: 'Times New Roman',
                  size: isHeading1 ? 28 : (isHeading2 ? 24 : 22),
                  bold: isHeading1 || isHeading2 || isHeading3 || isBold,
                }),
              ],
            });
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            border: {
              top: { color: '777777', space: 1, style: BorderStyle.SINGLE, size: 6 },
            },
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: `Disclaimer: ${disclaimer}`,
                font: 'Times New Roman',
                size: 18,
                color: '777777',
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = studentName ? studentName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'Student';
  const safeGrade = grade ? grade.trim().replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() : 'assessment';
  saveAs(blob, `GraphiaCheck_Assessment_Report_${safeName}_${safeGrade}.docx`);
}
