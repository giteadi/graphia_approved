// ══════════════════════════════════════════════════════════════════════════════
// Evidence Sanitizer - Priority Resolution Layer
// ══════════════════════════════════════════════════════════════════════════════
// This layer ensures that cancelled words are never flagged as spelling/grammar errors
// Rule: Cancelled > Grammar > Spelling (priority order)

// Type definitions for this module
type SpellingError = {
  written: string;
  intended?: string;
  occurrence?: number;
  confidence?: number;
};

export const PRIORITY = {
  cancelled: 3,
  spelling: 2,
  grammar: 1
};

/**
 * Checks if a spelling error should be considered a visible word (not blank)
 */
function isNonBlankWord(e: SpellingError): boolean {
  return String(e.written || '').trim().length > 0;
}

/**
 * Filters out blank words from spelling errors to ensure word-fallback safety
 */
export function filterBlankWords(spellingErrors: SpellingError[]): SpellingError[] {
  return spellingErrors.filter(isNonBlankWord);
}

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

  console.log('[Evidence Sanitizer] Input:');
  console.log('  - confirmedCancellations:', evidence.confirmedCancellations?.length || 0);
  console.log('  - spellingErrors:', evidence.spellingErrors?.length || 0);
  console.log('  - grammarMistakes:', evidence.grammarMistakes?.length || 0);
  console.log('  - wordChoiceMistakes:', evidence.wordChoiceMistakes?.length || 0);

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
  const initialSpellingCount = (evidence.spellingErrors || []).length;
  evidence.spellingErrors = (evidence.spellingErrors || [])
    .filter((e: any) => String(e.written || '').trim().length > 0)
    .filter((e: any) => {
      const hasOccurrence = typeof e.occurrence === 'number' && e.occurrence > 0;
      const errorKey = buildOccurrenceKey(e.written, e.occurrence);

      // occurrence present -> strict occurrence check only
      if (hasOccurrence) return !cancelledKeys.has(errorKey);

      // no occurrence -> fallback word-level
      return !cancelledWords.has(String(e.written || '').toLowerCase().trim());
    });

  console.log('[Evidence Sanitizer] Spelling errors filtered:', initialSpellingCount, '→', evidence.spellingErrors.length);

  // Filter out word choice mistakes using occurrence-based matching with conditional fallback
  evidence.wordChoiceMistakes = (evidence.wordChoiceMistakes || []).filter((e: any) => {
    const hasOccurrence = typeof e.occurrence === 'number' && e.occurrence > 0;
    const errorKey = buildOccurrenceKey(e.written, e.occurrence);

    // occurrence present -> strict occurrence check only
    if (hasOccurrence) return !cancelledKeys.has(errorKey);

    // no occurrence -> fallback word-level
    return !cancelledWords.has(e.written?.toLowerCase().trim());
  });

  // Filter out grammar mistakes that contain cancelled words in their examples (word boundary matching)
  const initialGrammarCount = (evidence.grammarMistakes || []).length;
  evidence.grammarMistakes = (evidence.grammarMistakes || []).filter((g: any) => {
    const example = g.example?.toLowerCase() || '';
    return ![...cancelledWords].some((word: string) => {
      // Word boundary matching to avoid false positives like "because" matching "be"
      const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
      return regex.test(example);
    });
  });

  console.log('[Evidence Sanitizer] Grammar mistakes filtered:', initialGrammarCount, '→', evidence.grammarMistakes.length);

  console.log('[Evidence Sanitizer] Applied priority rules:');
  console.log(`  - Cancelled words: ${cancelledWords.size}`);
  console.log(`  - Cancelled occurrences: ${cancelledKeys.size}`);
  console.log(`  - Spelling errors after filter: ${evidence.spellingErrors.length}`);
  console.log(`  - Grammar mistakes after filter: ${evidence.grammarMistakes.length}`);

  return evidence;
}