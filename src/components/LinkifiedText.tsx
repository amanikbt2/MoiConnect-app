import React from 'react';
import { Linking, StyleProp, Text, TextStyle } from 'react-native';

const URL_PATTERN = /([a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+|https?:\/\/[^\s<]+|www\.[^\s<]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<]*)?)/gi;
const MENTION_PATTERN = /(^|\s)(@[a-zA-Z0-9_]+)/g;
const TRAILING_PUNCTUATION = /[.,!?;:)}\]}>]+$/;
const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const normalizeUrl = (value: string) => {
  const trimmed = value.replace(TRAILING_PUNCTUATION, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const normalizeEmail = (value: string) => value.replace(TRAILING_PUNCTUATION, '');

const renderMentions = (value: string, keyPrefix: string) => {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  MENTION_PATTERN.lastIndex = 0;
  while ((match = MENTION_PATTERN.exec(value)) !== null) {
    const mentionStart = match.index + match[1].length;
    if (mentionStart > cursor) {
      parts.push(value.slice(cursor, mentionStart));
    }
    parts.push(
      <Text key={`${keyPrefix}-${mentionStart}`} style={{ color: '#2563eb', fontWeight: '700' }}>
        {match[2]}
      </Text>
    );
    cursor = mentionStart + match[2].length;
  }

  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts.length > 0 ? parts : value;
};

export function LinkifiedText({ children, style, linkStyle }: {
  children: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
}) {
  const parts = children.split(URL_PATTERN);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        const isLink = URL_PATTERN.test(part);
        URL_PATTERN.lastIndex = 0;
        if (!isLink) {
          return <React.Fragment key={`${index}-${part}`}>{renderMentions(part, `${index}-${part}`)}</React.Fragment>;
        }

        const displayValue = part.replace(TRAILING_PUNCTUATION, '');
        const isEmail = EMAIL_PATTERN.test(displayValue);
        return (
          <React.Fragment key={`${index}-${part}`}>
            <Text
              style={[{ color: '#2563eb', textDecorationLine: 'underline' }, linkStyle]}
              onPress={() => Linking.openURL(isEmail ? `mailto:${normalizeEmail(displayValue)}` : normalizeUrl(displayValue)).catch(() => {})}
            >
              {displayValue}
            </Text>
            {part.slice(displayValue.length)}
          </React.Fragment>
        );
      })}
    </Text>
  );
}
