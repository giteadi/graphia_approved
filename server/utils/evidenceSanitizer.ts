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
  const w = String(word || '').toLowerCase().trim();
  return `${w}#${occurrence || 1}`;
}

/**
 * Escapes special regex characters for safe pattern matching
 * Prevents regex injection and ensures accurate word boundary matching
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  // Filter out spelling errors using occurrence-based matching when available
  evidence.spellingErrors = (evidence.spellingErrors || []).filter((e: any) => {
    const errorKey = buildOccurrenceKey(e.written, e.occurrence);
    // If cancelledKeys has this specific occurrence, filter it out
    if (cancelledKeys.has(errorKey)) return false;
    // Otherwise fall back to word-level matching
    return !cancelledWords.has(e.written?.toLowerCase().trim());
  });

  // Filter out word choice mistakes using occurrence-based matching
  evidence.wordChoiceMistakes = (evidence.wordChoiceMistakes || []).filter((e: any) => {
    const errorKey = buildOccurrenceKey(e.written, e.occurrence);
    if (cancelledKeys.has(errorKey)) return false;
    return !cancelledWords.has(e.written?.toLowerCase().trim());
  });

  // Filter out grammar mistakes that contain cancelled words in their examples (word boundary matching)
  evidence.grammarMistakes = (evidence.grammarMistakes || []).filter((g: any) => {
    const example = g.example?.toLowerCase() || '';
    return ![...cancelledWords].some((word: string) => {
      // Word boundary matching to avoid false positives like "because" matching "be"
      const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
      return regex.test(example);
    });
  });

  console.log('[Evidence Sanitizer] Applied priority rules:');
  console.log(`  - Cancelled words: ${cancelledWords.size}`);
  console.log(`  - Cancelled occurrences: ${cancelledKeys.size}`);
  console.log(`  - Spelling errors after filter: ${evidence.spellingErrors.length}`);
  console.log(`  - Grammar mistakes after filter: ${evidence.grammarMistakes.length}`);

  return evidence;
}