import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { PlayIcon, VideoIcon, ImageIcon } from './Icons';

export const getCloudinaryVideoPreviewUrl = (url?: string): string => {
  if (!url || typeof url !== 'string' || !url.includes('/video/upload/')) return '';
  const [path, query] = url.split('?');
  const previewPath = path
    .replace(/\/video\/upload\/(?:so_[^,/]+\/)?/g, '/video/upload/so_auto,w_600,h_400,c_fill,q_auto,f_jpg/')
    .replace(/\.[^./]+$/, '.jpg');
  return query ? `${previewPath}?${query}` : previewPath;
};

export const isVideoUrlOrType = (url?: string, type?: string, name?: string): boolean => {
  if (type === 'video') return true;
  const target = `${url || ''} ${name || ''}`.toLowerCase();
  return Boolean(target.match(/\.(mp4|mov|m4v|webm|mkv|avi|3gp|flv|wmv)(\?.*)?$/i)) ||
    Boolean(url?.includes('/video/upload/'));
};

import { getLocalGifSource } from '../data/gifs';

interface SmartMediaThumbnailProps {
  source?: any;
  uri?: string;
  videoUrl?: string;
  type?: 'video' | 'image' | 'auto';
  title?: string;
  fileSize?: string;
  fileType?: string;
  showPlayBadge?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
}

export function SmartMediaThumbnail({
  source,
  uri,
  videoUrl,
  type = 'auto',
  title,
  fileSize,
  fileType,
  showPlayBadge = true,
  style,
  imageStyle,
  resizeMode = 'cover'
}: SmartMediaThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  const localGif = source || getLocalGifSource(uri) || getLocalGifSource(title);
  const isVideo = type === 'video' || (type === 'auto' && isVideoUrlOrType(videoUrl || uri, undefined, title));

  // Determine viable image thumbnail URL (strictly an image, never pass raw video file to <Image>)
  let candidateUri = uri || '';
  if (isVideo) {
    if (candidateUri && !candidateUri.match(/\.(mp4|mov|m4v|webm|mkv|avi|3gp|flv|wmv)(\?.*)?$/i)) {
      // already an image URI
    } else {
      candidateUri = getCloudinaryVideoPreviewUrl(videoUrl || uri);
    }
  }

  const hasValidImageUri = Boolean(candidateUri && candidateUri.trim().length > 0 && !hasError);
  const displayFormat = (fileType || (isVideo ? 'MP4' : 'IMAGE')).toUpperCase();

  return (
    <View style={[styles.container, style]}>
      {localGif ? (
        <Image
          source={localGif}
          style={[styles.mediaImage, imageStyle]}
          resizeMode={resizeMode}
        />
      ) : hasValidImageUri ? (
        <Image
          source={{ uri: candidateUri }}
          style={[styles.mediaImage, imageStyle]}
          resizeMode={resizeMode}
          onError={() => setHasError(true)}
        />
      ) : (
        /* WhatsApp-style Stylized Smart Poster (Never blank black) */
        <View style={styles.posterContainer}>
          {/* Subtle cinematic ambient glow */}
          <View style={styles.ambientGlow} />

          {/* Background watermark badge */}
          <View style={styles.watermarkIcon}>
            {isVideo ? (
              <VideoIcon color="rgba(255, 255, 255, 0.08)" size={72} />
            ) : (
              <ImageIcon color="rgba(255, 255, 255, 0.08)" size={72} />
            )}
          </View>

          {/* Center WhatsApp-style frosted Play Disc for Video */}
          {isVideo ? (
            <View style={styles.playDisc}>
              <PlayIcon color="#ffffff" size={24} style={{ marginLeft: 3 }} />
            </View>
          ) : (
            <View style={styles.photoIconCircle}>
              <ImageIcon color="#38bdf8" size={26} />
            </View>
          )}

          {/* Bottom metadata pill */}
          <View style={styles.posterBottomBadge}>
            {isVideo ? (
              <>
                <VideoIcon color="#22c55e" size={12} />
                <Text style={styles.posterBadgeText} numberOfLines={1}>
                  {displayFormat} VIDEO {fileSize ? `• ${fileSize}` : '• TAP TO PLAY'}
                </Text>
              </>
            ) : (
              <>
                <ImageIcon color="#38bdf8" size={12} />
                <Text style={styles.posterBadgeText} numberOfLines={1}>
                  {displayFormat} PHOTO {fileSize ? `• ${fileSize}` : ''}
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* When valid thumbnail image is rendered, still overlay WhatsApp play disc if video */}
      {hasValidImageUri && isVideo && showPlayBadge && (
        <View style={styles.overlayContainer}>
          <View style={styles.playDisc}>
            <PlayIcon color="#ffffff" size={22} style={{ marginLeft: 2 }} />
          </View>
          <View style={styles.posterBottomBadge}>
            <VideoIcon color="#22c55e" size={11} />
            <Text style={styles.posterBadgeText} numberOfLines={1}>
              {fileSize ? `${fileSize} • ` : ''}TAP TO PLAY
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  posterContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(21, 128, 61, 0.15)',
  },
  watermarkIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playDisc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(21, 128, 61, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  photoIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterBottomBadge: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  posterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
