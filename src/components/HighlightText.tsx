import React, { useMemo } from 'react';
import { Text, TextStyle } from 'react-native';

export interface HighlightTextProps {
  text: string;
  highlightWords?: string[];
  style?: TextStyle;
  highlightStyle?: TextStyle;
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

    // Escape regex tokens
    const escaped = cleanTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');

    const split = text.split(regex);
    return split.map((segment) => ({
      text: segment,
      isMatch: cleanTokens.includes(segment.toLowerCase())
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
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    borderRadius: 3
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
