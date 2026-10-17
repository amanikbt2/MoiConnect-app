import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getCloudinaryVideoPreviewUrl } from '../components/SmartMediaThumbnail';

export interface ReplyAttachmentLike {
  name?: string;
  url?: string;
  type?: string;
  title?: string;
  unitCode?: string;
  unitName?: string;
  size?: string;
}

export interface ReplyLike {
  text?: string;
  fileAttachment?: ReplyAttachmentLike;
}

/**
 * Returns a clean, smart WhatsApp-style snippet for quoted replies and reply preview banners.
 * Replaces ugly UUID filenames with clean icons & labels (e.g. 📷 Photo, 🎥 Video, 📄 PDF document).
 */
export function getSmartReplySnippet(reply?: ReplyLike | null): string {
  if (!reply) return '';

  const attachment = reply.fileAttachment;
  const rawText = (reply.text || '').trim();

  if (attachment) {
    const type = String(attachment.type || '').toLowerCase();
    const name = String(attachment.name || '').trim();
    const url = String(attachment.url || '').trim();
    const target = (name + ' ' + url).toLowerCase();

    const isImage =
      type === 'image' ||
      /\.(jpg|jpeg|png|webp|gif|heic|bmp)(\?.*)?$/i.test(target) ||
      url.includes('/image/upload/') ||
      (url.includes('res.cloudinary.com') && /\.(jpg|jpeg|png|webp)/i.test(url));

    const isVideo =
      type === 'video' ||
      /\.(mp4|mov|mkv|webm|avi|3gp|m4v)(\?.*)?$/i.test(target) ||
      url.includes('/video/upload/');

    const isAudio =
      type === 'audio' ||
      /\.(mp3|m4a|wav|aac|ogg|opus)(\?.*)?$/i.test(target);

    const isPdf =
      type === 'pdf' ||
      /\.pdf(\?.*)?$/i.test(target) ||
      url.includes('/pdf') ||
      name.toLowerCase().endsWith('.pdf');

    if (isImage) {
      return rawText ? `📷 ${rawText}` : '📷 Photo';
    }

    if (isVideo) {
      return rawText ? `🎥 ${rawText}` : '🎥 Video';
    }

    if (isAudio) {
      return rawText ? `🎙️ ${rawText}` : '🎙️ Voice note';
    }

    if (isPdf) {
      if (rawText) return `📄 ${rawText}`;
      const title = attachment.title || attachment.unitCode || attachment.unitName;
      if (title) return `📄 ${title}`;
      // Clean up filename if human readable (not UUID/timestamp)
      if (name && !name.includes('upload') && !name.includes('-') && name.length < 32) {
        return `📄 ${name}`;
      }
      return '📄 PDF document';
    }

    // Generic document
    if (rawText) return `📎 ${rawText}`;
    const cleanTitle = attachment.title || attachment.unitCode || attachment.unitName;
    if (cleanTitle) return `📎 ${cleanTitle}`;
    if (name && !name.includes('upload') && !name.includes('-') && name.length < 32) {
      return `📎 ${name}`;
    }
    return '📎 Document';
  }

  return rawText || 'Message';
}

/**
 * Returns a small thumbnail preview (like WhatsApp) on the right side of the quoted reply box if an image was attached.
 */
export function getReplyAttachmentThumbnail(reply?: ReplyLike | null) {
  if (!reply || !reply.fileAttachment || !reply.fileAttachment.url) return null;
  const attachment = reply.fileAttachment;
  const fileUrl = attachment.url || '';
  const type = String(attachment.type || '').toLowerCase();
  const nameOrUrl = (String(attachment.name || '') + ' ' + fileUrl).toLowerCase();

  const isImage =
    type === 'image' ||
    /\.(jpg|jpeg|png|webp|gif|heic|bmp)(\?.*)?$/i.test(nameOrUrl) ||
    fileUrl.includes('/image/upload/') ||
    (fileUrl.includes('res.cloudinary.com') && /\.(jpg|jpeg|png|webp)/i.test(fileUrl));

  const isVideo =
    type === 'video' ||
    /\.(mp4|mov|mkv|webm|avi|3gp|m4v)(\?.*)?$/i.test(nameOrUrl) ||
    fileUrl.includes('/video/upload/');

  if (isImage) {
    return (
      <Image
        source={{ uri: fileUrl }}
        style={styles.replyThumb}
        resizeMode="cover"
      />
    );
  }

  if (isVideo) {
    const videoThumb = getCloudinaryVideoPreviewUrl(fileUrl);
    if (videoThumb) {
      return (
        <Image
          source={{ uri: videoThumb }}
          style={styles.replyThumb}
          resizeMode="cover"
        />
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  replyThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginLeft: 8,
    backgroundColor: '#e2e8f0'
  }
});
