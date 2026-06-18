export function sanitizeEvidence(evidence: any) {
  // 1. CONFIRMED CANCELLATIONS: Accept all, no rejection for multi-word
  const confirmed = evidence.confirmedCancellations || [];
  
  // 2. UNCERTAIN CANCELLATIONS: Promote them to confirmed to avoid "rejected" log
  const uncertain = evidence.uncertainCancellations || [];
  const allCancellations = [...confirmed, ...uncertain];

  // Map for fast lookup (lowercase and trim)
  const cancelledWords = new Set(allCancellations.map((c: any) => c.text.toLowerCase().trim()));

  // 3. Remove Grammar Mistakes that contain cancelled words
  evidence.grammarMistakes = (evidence.grammarMistakes || []).filter((g: any) => {
    const example = g.example?.toLowerCase() || '';
    return ![...cancelledWords].some(word => example.includes(word));
  });

  // 4. Remove Spelling Errors that are cancelled
  evidence.spellingErrors = (evidence.spellingErrors || []).filter((e: any) => {
    return !cancelledWords.has(e.written?.toLowerCase().trim());
  });

  // Update evidence
  evidence.confirmedCancellations = allCancellations;
  evidence.uncertainCancellations = []; // Clear uncertain array
  
  return evidence;
}
