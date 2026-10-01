import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Image, Text } from 'react-native';

interface RealCameraViewProps {
  isCameraOff: boolean;
  isMicMuted: boolean;
  avatarUrl?: string;
  userName: string;
  style?: any;
  mirror?: boolean;
}

let RTCView: any = null;
let mediaDevices: any = null;

if (Platform.OS !== 'web') {
  try {
    const webrtc = require('@livekit/react-native-webrtc');
    RTCView = webrtc.RTCView;
    mediaDevices = webrtc.mediaDevices;
  } catch (e) {
    console.warn('[RealCameraView] @livekit/react-native-webrtc unavailable:', e);
  }
}

export const RealCameraView: React.FC<RealCameraViewProps> = ({
  isCameraOff,
  isMicMuted,
  avatarUrl,
  userName,
  style,
  mirror = true
}) => {
  const [stream, setStream] = useState<any>(null);
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    let activeStream: any = null;
    let isCancelled = false;

    const startRealMedia = async () => {
      try {
        setHasPermissionError(false);
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: true
        };

        let mediaStream: any = null;

        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
            mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          }
        } else if (mediaDevices?.getUserMedia) {
          mediaStream = await mediaDevices.getUserMedia(constraints);
        }

        if (isCancelled) {
          if (mediaStream) {
            mediaStream.getTracks?.().forEach((track: any) => track.stop?.());
          }
          return;
        }

        if (mediaStream) {
          activeStream = mediaStream;
          setStream(mediaStream);

          if (Platform.OS === 'web' && videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play?.().catch(() => {});
          }
        } else {
          setHasPermissionError(true);
        }
      } catch (err) {
        console.warn('[RealCameraView] Camera/Mic access error:', err);
        if (!isCancelled) setHasPermissionError(true);
      }
    };

    void startRealMedia();

    return () => {
      isCancelled = true;
      if (activeStream) {
        try {
          activeStream.getTracks?.().forEach((track: any) => track.stop?.());
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!stream) return;
    try {
      stream.getVideoTracks?.().forEach((track: any) => {
        track.enabled = !isCameraOff;
      });
      stream.getAudioTracks?.().forEach((track: any) => {
        track.enabled = !isMicMuted;
      });
    } catch (e) {
      // ignore track state updates
    }
  }, [stream, isCameraOff, isMicMuted]);

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play?.().catch(() => {});
    }
  }, [stream]);

  if (isCameraOff || hasPermissionError || !stream) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : require('../../assets/moi-uni-logo.png')}
          style={styles.avatarImg}
        />
        <Text style={styles.fallbackText}>
          {hasPermissionError
            ? 'Camera / Mic Permission Denied'
            : isCameraOff
            ? 'Camera Off'
            : 'Starting Camera...'}
        </Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.videoWrapper, style]}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirror ? 'scaleX(-1)' : 'none',
            borderRadius: 12
          }}
        />
      </View>
    );
  }

  if (RTCView && stream) {
    return (
      <View style={[styles.videoWrapper, style]}>
        <RTCView
          streamURL={stream.toURL?.()}
          style={StyleSheet.absoluteFillObject}
          objectFit="cover"
          mirror={mirror}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallbackContainer, style]}>
      <Image
        source={avatarUrl ? { uri: avatarUrl } : require('../../assets/moi-uni-logo.png')}
        style={styles.avatarImg}
      />
      <Text style={styles.fallbackText}>{userName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  videoWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#38bdf8'
  },
  fallbackText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  }
});
