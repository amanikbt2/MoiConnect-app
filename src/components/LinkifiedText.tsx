import React from 'react';
import { Linking, StyleProp, Text, TextStyle } from 'react-native';

const URL_PATTERN = /([a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+|https?:\/\/[^\s<]+|www\.[^\s<]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<]*)?)/gi;
const MENTION_PATTERN = /(^|\s)(@[a-zA-Z0-9_]+)/g;
const TRAILING_PUNCTUATION = /[.,!?;:)}\]}>]+$/;
const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const MARKDOWN_PATTERN = /(\*[^*\n]+?\*|~[^~\n]+?~|\|[^|\n]+?\||_[^_\n]+?_)/g;

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

const renderInlineText = (
  value: string,
  keyPrefix: string,
  onPressVideo?: (url: string) => void,
  linkStyle?: StyleProp<TextStyle>
): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  const markdownPattern = new RegExp(MARKDOWN_PATTERN.source, 'g');

  while ((match = markdownPattern.exec(value)) !== null) {
    const token = match[0];
    const start = match.index;
    const delimiter = token.slice(0, 1);
    const before = value[start - 1] || '';
    const after = value[start + token.length] || '';
    // A double asterisk is left literal; only *text* is the bold syntax.
    const invalidBoldBoundary = delimiter === '*' && (before === '*' || after === '*');
    // Keep underscores in identifiers literal; _a phrase_ is italic.
    const invalidItalicBoundary = delimiter === '_' && ((start > 0 && /[\p{L}\p{N}]/u.test(before)) || /[\p{L}\p{N}]/u.test(after));

    if (start > cursor) {
      nodes.push(...renderLinkedText(value.slice(cursor, start), `${keyPrefix}-${cursor}`, onPressVideo, linkStyle));
    }
    if (invalidBoldBoundary || invalidItalicBoundary) {
      nodes.push(token);
    } else {
      const content = token.slice(delimiter.length, -delimiter.length);
      if (delimiter === '|') {
        if (start > 0 && before !== '\n') nodes.push('\n');
        nodes.push(
          <Text key={`${keyPrefix}-quote-${start}`}>
            <Text style={{ color: '#2583eb', fontWeight: '700' }}>│ </Text>
            <Text style={{ color: '#64748b', fontStyle: 'italic' }}>
              {renderInlineText(content, `${keyPrefix}-nested-${start}`, onPressVideo, linkStyle)}
            </Text>
          </Text>
        );
        if (after && after !== '\n') nodes.push('\n');
      } else {
        const style = delimiter === '*'
          ? { fontWeight: '700' as const }
          : delimiter === '~'
            ? { textDecorationLine: 'line-through' as const, color: '#64748b' }
            : { fontStyle: 'italic' as const };
        nodes.push(
          <Text key={`${keyPrefix}-md-${start}`} style={style}>
            {renderInlineText(content, `${keyPrefix}-nested-${start}`, onPressVideo, linkStyle)}
          </Text>
        );
      }
    }
    cursor = start + token.length;
  }

  if (cursor < value.length) {
    nodes.push(...renderLinkedText(value.slice(cursor), `${keyPrefix}-${cursor}`, onPressVideo, linkStyle));
  }
  return nodes;
};

const renderLinkedText = (
  value: string,
  keyPrefix: string,
  onPressVideo?: (url: string) => void,
  linkStyle?: StyleProp<TextStyle>
): React.ReactNode[] => {
  const parts = value.split(URL_PATTERN);
  return parts.map((part, index) => {
    const isLink = URL_PATTERN.test(part);
    URL_PATTERN.lastIndex = 0;
    if (!isLink) return <React.Fragment key={`${keyPrefix}-plain-${index}`}>{renderMentions(part, `${keyPrefix}-${index}`)}</React.Fragment>;

    const displayValue = part.replace(TRAILING_PUNCTUATION, '');
    const isEmail = EMAIL_PATTERN.test(displayValue);
    const urlToOpen = isEmail ? `mailto:${normalizeEmail(displayValue)}` : normalizeUrl(displayValue);
    const isVideo = !isEmail && (Boolean(urlToOpen.match(/\.(mp4|mov|m4v|webm)(\?.*)?$/i)) || urlToOpen.includes('/video/upload/'));
    return (
      <React.Fragment key={`${keyPrefix}-link-${index}`}>
        <Text
          style={[{ color: '#2563eb', textDecorationLine: 'underline' }, linkStyle]}
          onPress={() => {
            if (isVideo && onPressVideo) onPressVideo(urlToOpen);
            else Linking.openURL(urlToOpen).catch(() => {});
          }}
        >
          {displayValue}
        </Text>
        {part.slice(displayValue.length)}
      </React.Fragment>
    );
  });
};

export function LinkifiedText({ children, style, linkStyle, onPressVideo, numberOfLines, onTextLayout }: {
  children: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  onPressVideo?: (url: string) => void;
  numberOfLines?: number;
  onTextLayout?: (event: any) => void;
}) {
  return (
    <Text style={style} numberOfLines={numberOfLines} onTextLayout={onTextLayout}>
      {renderInlineText(children, 'formatted-message', onPressVideo, linkStyle)}
    </Text>
  );
}
