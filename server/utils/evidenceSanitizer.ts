/**
 * Builds a stable lookup key for a word at a specific occurrence.
 * Null-safe: a missing word yields an empty prefix, a missing occurrence defaults to 1.
 */
export function buildOccurrenceKey(word: string | null | undefined, occurrence?: number): string {
  const normalized = (word || '').toLowerCase().trim();
  const index = typeof occurrence === 'number' && occurrence > 0 ? occurrence : 1;
  return `${normalized}#${index}`;
}

export function sanitizeEvidence(evidence: any) {
  // 1. CONFIRMED CANCELLATIONS: Accept all, no rejection for multi-word.
  //    Only confirmed (clearly struck) words are treated as cancelled.
  const confirmed = evidence.confirmedCancellations || [];

  // 2. UNCERTAIN CANCELLATIONS stay uncertain — an overwrite or messy stroke is
  //    not proof of a strike-through, so the word still counts as written and
  //    must remain eligible for spelling/grammar scoring.
  const uncertain = evidence.uncertainCancellations || [];

  // Map for fast lookup (lowercase and trim)
  const cancelledWords = new Set(confirmed.map((c: any) => (c.text || '').toLowerCase().trim()));

  // Occurrence-aware lookup — only the struck occurrence of a repeated word is cancelled
  const cancelledOccurrences = new Set(
    confirmed.map((c: any) => buildOccurrenceKey(c.text, c.occurrence))
  );

  // 3. Remove Grammar Mistakes that contain cancelled words
  evidence.grammarMistakes = (evidence.grammarMistakes || []).filter((g: any) => {
    const example = g.example?.toLowerCase() || '';
    return ![...cancelledWords].some(word => word && example.includes(word));
  });

  // 4. Remove Spelling Errors whose specific occurrence was cancelled.
  //    A word cancelled at occurrence #2 must NOT remove occurrence #1.
  evidence.spellingErrors = (evidence.spellingErrors || []).filter((e: any) => {
    return !cancelledOccurrences.has(buildOccurrenceKey(e.written, e.occurrence));
  });

  // Update evidence — both buckets keep their own entries
  evidence.confirmedCancellations = confirmed;
  evidence.uncertainCancellations = uncertain;

  return evidence;
}
