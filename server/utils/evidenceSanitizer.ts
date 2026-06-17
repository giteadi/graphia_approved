// ══════════════════════════════════════════════════════════════════════════════
// Evidence Sanitizer - Priority Resolution Layer
// ══════════════════════════════════════════════════════════════════════════════
// This layer ensures that cancelled words are never flagged as spelling/grammar errors
// Rule: Cancelled > Grammar > Spelling (priority order)

export const PRIORITY = {
  cancelled: 3,
  spelling: 2,
  grammar: 1
};

/**
 * Builds an occurrence key for tracking specific word instances
 * Example: buildOccurrenceKey("lego", 2) → "lego#2"
 */
export function buildOccurrenceKey(word: string, occurrence: number): string {
  return `${word.toLowerCase().trim()}#${occurrence || 1}`;
}

/**
 * Sanitizes evidence by removing conflicts between cancelled words and error classifications
 * Cancelled words take priority over spelling and grammar errors
 */
export function sanitizeEvidence(evidence: any): any {
  if (!evidence) return evidence;

  // Build set of cancelled words with occurrence tracking
  const cancelledKeys = new Set(
    (evidence.confirmedCancellations || [])
      .map((c: any) => buildOccurrenceKey(c.text, c.occurrence))
      .filter(Boolean)
  );

  // Also build simple set for backwards compatibility
  const cancelledWords = new Set(
    (evidence.confirmedCancellations || [])
      .map((c: any) => c.text?.toLowerCase().trim())
      .filter(Boolean)
  );

  // Filter out spelling errors that match cancelled words
  evidence.spellingErrors = (evidence.spellingErrors || []).filter(
    (e: any) => !cancelledWords.has(e.written?.toLowerCase().trim())
  );

  // Filter out word choice mistakes that match cancelled words
  evidence.wordChoiceMistakes = (evidence.wordChoiceMistakes || []).filter(
    (e: any) => !cancelledWords.has(e.written?.toLowerCase().trim())
  );

  // Filter out grammar mistakes that contain cancelled words in their examples
  evidence.grammarMistakes = (evidence.grammarMistakes || []).filter(
    (g: any) => ![...cancelledWords].some(word =>
      g.example?.toLowerCase()?.includes(word)
    )
  );

  console.log('[Evidence Sanitizer] Applied priority rules:');
  console.log(`  - Cancelled words: ${cancelledWords.size}`);
  console.log(`  - Cancelled occurrences: ${cancelledKeys.size}`);
  console.log(`  - Spelling errors after filter: ${evidence.spellingErrors.length}`);
  console.log(`  - Grammar mistakes after filter: ${evidence.grammarMistakes.length}`);

  return evidence;
}