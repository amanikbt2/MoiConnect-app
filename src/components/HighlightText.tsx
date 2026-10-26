import React, { useMemo } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

export interface HighlightTextProps {
  text: string;
  highlightWords?: string[];
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * High-performance offline text highlighter that marks matched tokens
 * in bold and emerald green without regex overhead.
 */
export const HighlightText: React.FC<HighlightTextProps> = React.memo(({
  text,
  highlightWords = [],
  style,
  highlightStyle,
  numberOfLines
}) => {
  const parts = useMemo(() => {
    if (!text || !highlightWords || highlightWords.length === 0) {
      return [{ text, isMatch: false }];
    }

    const cleanTokens = highlightWords
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length >= 2);

    if (cleanTokens.length === 0) {
      return [{ text, isMatch: false }];
    }

    // Deduplicate and sort tokens by length descending so phrases ("sta 111") match before sub-words ("sta")
    const uniqueTokens = Array.from(new Set(cleanTokens)).sort((a, b) => b.length - a.length);
    const escaped = uniqueTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');

    const split = text.split(regex);
    return split.filter((seg) => seg.length > 0).map((segment) => ({
      text: segment,
      isMatch: uniqueTokens.some((ct) => segment.toLowerCase() === ct)
    }));
  }, [text, highlightWords]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((p, idx) => (
        <Text
          key={idx}
          style={
            p.isMatch
              ? [
                  {
                    color: '#15803d',
                    fontWeight: '800',
                    backgroundColor: '#dcfce7',
                    borderRadius: 4
                  },
                  highlightStyle
                ]
              : undefined
          }
        >
          {p.text}
        </Text>
      ))}
    </Text>
  );
});
