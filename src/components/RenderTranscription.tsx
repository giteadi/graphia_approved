import React, { useMemo } from 'react';

export type HighlightTarget = {
  text: string;
  occurrence: number; // 1-based
  kind: 'spelling' | 'grammar' | 'cancelled' | 'maybe-cancelled';
  tokenSpan?: number; // words count for phrase-level matching
};

export type HighlightMap = {
  redWords: string[];      // backward compatibility
  redPhrases: string[];    // backward compatibility
  strikePhrases: string[]; // backward compatibility
  targets?: HighlightTarget[]; // optional for backward compatibility
};

export const normalizeForUiMatch = (value: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Spelling comparisons keep hyphens — a hyphenation error is exactly the
// difference we must preserve (e.g. "gettogether" vs "get-together").
export const normalizeForSpellingMatch = (value: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=_`~()?"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type AnnotationType = 'normal' | 'spelling' | 'grammar' | 'cancelled' | 'maybeCancelled';

export interface Token {
  text: string;
  type: AnnotationType;
}

// Priority system for annotation types (higher = overrides lower)
const TOKEN_PRIORITY: Record<AnnotationType, number> = {
  cancelled: 3,
  maybeCancelled: 2,
  spelling: 2,
  grammar: 2,
  normal: 0
};

export interface RenderTranscriptionProps {
  text: string;
  highlightMap?: HighlightMap;
}

function processTokens(text: string, highlightMap?: HighlightMap): Token[] {
  if (!text) return [];

  const redWords = highlightMap?.redWords || [];
  const redPhrases = highlightMap?.redPhrases || [];
  const strikePhrases = highlightMap?.strikePhrases || [];

  const tokens: Token[] = [];
  const SHOW_MAYBE = true;

  // First, handle inline [CANCELLED: ...] and [MAYBE-CANCELLED: ...] tags
  const parts = text.split(/(\[(?:cancelled|CANCELLED|MAYBE-CANCELLED):[\s\S]*?\])/gi);

  for (const part of parts) {
    if (/^\[(?:cancelled|CANCELLED):/i.test(part) && part.endsWith(']')) {
      const content = part
        .replace(/^\[(?:cancelled|CANCELLED):\s*/i, '')
        .replace(/\]$/, '')
        .trim();

      if (content.toLowerCase() === 'unreadable' || content.toLowerCase() === '[cancelled: unreadable]') {
        tokens.push({
          text: '[CANCELLED: unreadable]',
          type: 'cancelled'
        });
      } else {
        const words = content.split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;
          tokens.push({
            text: word,
            type: word.trim() ? 'cancelled' : 'normal'
          });
        }
      }
    } else if (SHOW_MAYBE && /^\[(?:MAYBE-CANCELLED):/i.test(part) && part.endsWith(']')) {
      const content = part
        .replace(/^\[(?:MAYBE-CANCELLED):\s*/i, '')
        .replace(/\]$/, '')
        .trim();

      const words = content.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        tokens.push({
          text: word,
          type: word.trim() ? 'maybeCancelled' : 'normal'
        });
      }
    } else {
      const words = part.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        tokens.push({
          text: word,
          type: 'normal'
        });
      }
    }
  }

  // Apply annotations based on priority system
  const annotatedTokens = [...tokens];
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const normalizeSpelling = (str: string) => str.toLowerCase().replace(/[^\w\s-]/g, '').trim();

  const upgradeToken = (tokenIndex: number, newType: AnnotationType) => {
    const currentType = annotatedTokens[tokenIndex].type;
    const currentPriority = TOKEN_PRIORITY[currentType];
    const newPriority = TOKEN_PRIORITY[newType];
    if (newPriority > currentPriority) {
      annotatedTokens[tokenIndex] = { ...annotatedTokens[tokenIndex], type: newType };
    }
  };

  const targets = highlightMap?.targets || [];
  const useTargetsOnly = targets.length > 0;

  if (useTargetsOnly) {
    const singleWordErrors = new Map<string, HighlightTarget>();
    const phraseHits: HighlightTarget[] = [];

    for (const target of targets) {
      if ((target.tokenSpan || 1) === 1) {
        const key = target.kind === 'spelling'
          ? `${normalizeSpelling(target.text)}#${target.occurrence || 1}`
          : `${normalize(target.text)}#${target.occurrence || 1}`;
        singleWordErrors.set(key, target);
      } else {
        phraseHits.push(target);
      }
    }

    const wordTokens: { idx: number; norm: string; spellNorm: string; occ: number; spellOcc: number }[] = [];
    const occurrenceCounter = new Map<string, number>();
    const spellOccurrenceCounter = new Map<string, number>();

    for (let i = 0; i < annotatedTokens.length; i++) {
      const t = annotatedTokens[i];
      if (!t.text.trim()) continue;

      const norm = normalize(t.text);
      const spellNorm = normalizeSpelling(t.text);

      const occ = (occurrenceCounter.get(norm) || 0) + 1;
      occurrenceCounter.set(norm, occ);

      const spellOcc = (spellOccurrenceCounter.get(spellNorm) || 0) + 1;
      spellOccurrenceCounter.set(spellNorm, spellOcc);

      wordTokens.push({ idx: i, norm, spellNorm, occ, spellOcc });
    }

    for (const wt of wordTokens) {
      let target = singleWordErrors.get(`${wt.norm}#${wt.occ}`);
      if (!target) target = singleWordErrors.get(`${wt.spellNorm}#${wt.spellOcc}`);

      if (!target && wt.spellNorm.includes('-')) {
        for (const part of wt.spellNorm.split('-').filter(Boolean)) {
          const hit = singleWordErrors.get(`${part}#1`);
          if (hit && hit.kind === 'spelling') { target = hit; break; }
        }
      }

      if (target) {
        if (target.kind === 'cancelled') upgradeToken(wt.idx, 'cancelled');
        if (target.kind === 'maybe-cancelled') upgradeToken(wt.idx, 'maybeCancelled');
        if (target.kind === 'spelling') upgradeToken(wt.idx, 'spelling');
        if (target.kind === 'grammar') upgradeToken(wt.idx, 'grammar');
      }
    }

    if (phraseHits.length > 0) {
      const phraseOccurrenceCounter = new Map<string, number>();

      for (let wi = 0; wi < wordTokens.length; wi++) {
        for (const phraseHit of phraseHits) {
          const phraseWords = phraseHit.text.split(/\s+/).map(w => normalize(w));
          if (phraseWords.length === 0 || wi > wordTokens.length - phraseWords.length) continue;

          let match = true;
          for (let j = 0; j < phraseWords.length; j++) {
            if (wordTokens[wi + j]?.norm !== phraseWords[j]) {
              match = false;
              break;
            }
          }

          if (match) {
            const phraseKey = phraseWords.join(' ');
            const occ = (phraseOccurrenceCounter.get(phraseKey) || 0) + 1;
            phraseOccurrenceCounter.set(phraseKey, occ);

            if ((phraseHit.occurrence || 1) === occ) {
              for (let j = 0; j < phraseWords.length; j++) {
                const tokenIndex = wordTokens[wi + j].idx;
                if (phraseHit.kind === 'cancelled') upgradeToken(tokenIndex, 'cancelled');
                if (phraseHit.kind === 'maybe-cancelled') upgradeToken(tokenIndex, 'maybeCancelled');
                if (phraseHit.kind === 'spelling') upgradeToken(tokenIndex, 'spelling');
                if (phraseHit.kind === 'grammar') upgradeToken(tokenIndex, 'grammar');
              }
            }
          }
        }
      }
    }
  }

  // Legacy fallback: if targets is empty, use old redWords + strikePhrases matching
  if (!useTargetsOnly) {
    for (let i = 0; i < annotatedTokens.length; i++) {
      const token = annotatedTokens[i];
      if (!token.text.trim()) continue;
      const normalizedToken = normalizeSpelling(token.text);
      const isSpellingError = redWords.some(word => normalizeSpelling(word) === normalizedToken);
      if (isSpellingError) {
        upgradeToken(i, 'spelling');
      }
    }

    for (const phrase of redPhrases) {
      const phraseWords = phrase.split(/\s+/).map(w => normalize(w)).filter(Boolean);
      if (phraseWords.length === 0) continue;

      for (let i = 0; i <= annotatedTokens.length - phraseWords.length; i++) {
        let match = true;
        for (let j = 0; j < phraseWords.length; j++) {
          const tokenText = normalize(annotatedTokens[i + j].text);
          if (tokenText !== phraseWords[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          for (let j = 0; j < phraseWords.length; j++) {
            upgradeToken(i + j, 'grammar');
          }
        }
      }
    }

    for (const phrase of strikePhrases) {
      const phraseWords = phrase.split(/\s+/).map(w => normalize(w)).filter(Boolean);
      if (phraseWords.length === 0) continue;

      for (let i = 0; i <= annotatedTokens.length - phraseWords.length; i++) {
        let match = true;
        for (let j = 0; j < phraseWords.length; j++) {
          const tokenText = normalize(annotatedTokens[i + j].text);
          if (tokenText !== phraseWords[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          for (let j = 0; j < phraseWords.length; j++) {
            upgradeToken(i + j, 'cancelled');
          }
        }
      }
    }
  }

  return annotatedTokens;
}

export const RenderTranscription = React.memo(function RenderTranscription({
  text,
  highlightMap,
}: RenderTranscriptionProps) {
  const annotatedTokens = useMemo(() => {
    return processTokens(text, highlightMap);
  }, [text, highlightMap]);

  if (!text) return null;

  return (
    <>
      {annotatedTokens.map((token, index) => {
        switch (token.type) {
          case 'cancelled':
            return (
              <span key={`token-${index}`} className="text-gray-400 italic line-through">
                {token.text}
              </span>
            );
          case 'maybeCancelled':
            return (
              <span key={`token-${index}`} className="text-red-600 font-bold underline decoration-red-600/50 underline-offset-2">
                {token.text}
              </span>
            );
          case 'spelling':
            return (
              <span
                key={`token-${index}`}
                className="text-red-600 font-bold underline decoration-red-600/50 underline-offset-2"
              >
                {token.text}
              </span>
            );
          case 'grammar':
            return (
              <span
                key={`token-${index}`}
                className="text-red-600 font-bold underline decoration-red-600/50 underline-offset-2"
              >
                {token.text}
              </span>
            );
          default:
            return <span key={`token-${index}`}>{token.text}</span>;
        }
      })}
    </>
  );
});

export default RenderTranscription;
