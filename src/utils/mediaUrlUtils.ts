/**
 * Utilities for detecting, parsing and handling GIF, sticker and media URLs
 * in forum chat, WhatsApp-style.
 */

const IMAGE_OR_GIF_EXTENSIONS = /\.(gif|webp|png|jpe?g|bmp|svg)(\?.*)?$/i;

const GIF_HOSTS = [
  'media.giphy.com',
  'i.giphy.com',
  'giphy.com',
  'media.tenor.com',
  'c.tenor.com',
  'tenor.com',
  'i.imgur.com',
  'res.cloudinary.com'
];

export function isGifUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  if (lower.includes('.gif')) return true;
  if (lower.includes('giphy.com') || lower.includes('tenor.com')) return true;
  return false;
}

export function isImageOrGifUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (!/^https?:\/\//i.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    const pathAndQuery = parsed.pathname + parsed.search;
    if (IMAGE_OR_GIF_EXTENSIONS.test(pathAndQuery)) return true;
    if (GIF_HOSTS.some((host) => parsed.hostname.toLowerCase().includes(host))) {
      return true;
    }
  } catch {
    if (IMAGE_OR_GIF_EXTENSIONS.test(trimmed)) return true;
  }
  return false;
}

export function extractImageOrGifUrl(text: string): { url: string; remainingText: string; isGif: boolean } | null {
  if (!text || typeof text !== 'string') return null;
  
  // Match URLs in text
  const urlRegex = /(https?:\/\/[^\s]+|data:image\/[a-zA-Z]+;base64,[^\s]+)/gi;
  const matches = text.match(urlRegex);
  if (!matches || matches.length === 0) return null;

  for (const match of matches) {
    if (isImageOrGifUrl(match)) {
      const remainingText = text.replace(match, '').trim();
      return {
        url: match,
        remainingText,
        isGif: isGifUrl(match)
      };
    }
  }
  return null;
}

export interface CuratedGif {
  id: string;
  title: string;
  category: string;
  url: string;
  previewUrl: string;
}

// Curated popular reaction GIFs hosted on reliable CDNs (Giphy / Tenor / Wikimedia)
// with high uptime and instant preview capability.
export const POPULAR_REACTION_GIFS: CuratedGif[] = [
  {
    id: 'gif-laugh',
    title: 'Laughing',
    category: 'Laugh',
    url: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/200w.gif'
  },
  {
    id: 'gif-applause',
    title: 'Applause',
    category: 'Clap',
    url: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1GhO/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1GhO/200w.gif'
  },
  {
    id: 'gif-dance',
    title: 'Dance Celebration',
    category: 'Party',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif'
  },
  {
    id: 'gif-heart',
    title: 'Love & Hug',
    category: 'Love',
    url: 'https://media.giphy.com/media/26BRv0ThflsDTqUXa/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/26BRv0ThflsDTqUXa/200w.gif'
  },
  {
    id: 'gif-thumbsup',
    title: 'Thumbs Up Yes',
    category: 'Yes',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/111ebonMs90YLu/200w.gif'
  },
  {
    id: 'gif-party',
    title: 'Party Popper',
    category: 'Party',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif'
  },
  {
    id: 'gif-fire',
    title: 'Mind Blown Fire',
    category: 'Fire',
    url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/200w.gif'
  },
  {
    id: 'gif-cry',
    title: 'Tears Sad',
    category: 'Sad',
    url: 'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/d2lcHJTG5Tscg/200w.gif'
  },
  {
    id: 'gif-shock',
    title: 'Shocked Wow',
    category: 'Wow',
    url: 'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/5VKbvrjxpVJCM/200w.gif'
  },
  {
    id: 'gif-cool',
    title: 'Cool Deal With It',
    category: 'Cool',
    url: 'https://media.giphy.com/media/62PP2yEIAZF6g/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/62PP2yEIAZF6g/200w.gif'
  },
  {
    id: 'gif-bye',
    title: 'Wave Goodbye',
    category: 'Bye',
    url: 'https://media.giphy.com/media/m9eG1qVjvN56HexfcE/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/m9eG1qVjvN56HexfcE/200w.gif'
  },
  {
    id: 'gif-congrats',
    title: 'Congratulations',
    category: 'Party',
    url: 'https://media.giphy.com/media/qx8pi39Lwm9Xm2audb/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/qx8pi39Lwm9Xm2audb/200w.gif'
  }
];
