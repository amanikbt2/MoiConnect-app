import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Participant, Room, RoomEvent, Track } from 'livekit-client';
import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from './Icons';

let AudioSession: any = null;
let VideoView: any = null;
let AndroidAudioTypePresets: any = null;

if (Platform.OS !== 'web') {
  try {
    const livekitRN = require('@livekit/react-native');
    AudioSession = livekitRN.AudioSession;
    VideoView = livekitRN.VideoView;
    AndroidAudioTypePresets = livekitRN.AndroidAudioTypePresets;
  } catch (e) {
    console.warn('[LiveKit] @livekit/react-native is not available:', e);
  }
}

function LiveVideoTrackView({ videoTrack, mirror, zOrder, style }: { videoTrack: any; mirror?: boolean; zOrder?: number; style?: any }) {
  const videoElementRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !videoTrack || typeof document === 'undefined') return;
    const element = videoElementRef.current;
    if (element && typeof videoTrack.attach === 'function') {
      videoTrack.attach(element);
      return () => {
        try {
          videoTrack.detach(element);
        } catch {}
      };
    }
  }, [videoTrack]);

  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {React.createElement('video', {
          ref: videoElementRef,
          autoPlay: true,
          playsInline: true,
          muted: true,
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirror ? 'scaleX(-1)' : 'none',
            backgroundColor: '#071b16',
            pointerEvents: 'none'
          }
        } as any)}
      </View>
    );
  }

  if (VideoView) {
    return (
      <VideoView
        videoTrack={videoTrack}
        style={style}
        objectFit="cover"
        mirror={mirror}
        zOrder={zOrder ?? (mirror ? 1 : 0)}
      />
    );
  }

  return null;
}

function SpeakingWaveBadge() {
  const anim1 = useRef(new Animated.Value(4)).current;
  const anim2 = useRef(new Animated.Value(10)).current;
  const anim3 = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    const makeWave = (val: Animated.Value, minVal: number, maxVal: number, speed: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: maxVal,
            duration: speed,
            useNativeDriver: false
          }),
          Animated.timing(val, {
            toValue: minVal,
            duration: speed,
            useNativeDriver: false
          })
        ])
      );
    };

    const w1 = makeWave(anim1, 3, 11, 230);
    const w2 = makeWave(anim2, 4, 13, 170);
    const w3 = makeWave(anim3, 3, 9, 210);

    w1.start();
    w2.start();
    w3.start();

    return () => {
      w1.stop();
      w2.stop();
      w3.stop();
    };
  }, [anim1, anim2, anim3]);

  return (
    <View style={styles.speakingBadge}>
      <Animated.View style={[styles.speakingBar, { height: anim1 }]} />
      <Animated.View style={[styles.speakingBar, { height: anim2 }]} />
      <Animated.View style={[styles.speakingBar, { height: anim3 }]} />
    </View>
  );
}

interface CommunityLiveRoomProps {
  serverUrl: string;
  token: string;
  isHost: boolean;
  isNetworkOnline?: boolean;
  currentUserAvatar?: string;
  currentUserName?: string;
  onClose: () => void;
  onReady?: () => void;
}

export function CommunityLiveRoom({
  serverUrl,
  token,
  isHost,
  isNetworkOnline = true,
  currentUserAvatar,
  currentUserName,
  onClose,
  onReady
}: CommunityLiveRoomProps) {
  const room = useMemo(() => new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: false,
      channelCount: 1
    },
    publishDefaults: {
      dtx: false,
      audioBitrate: 48000,
      simulcast: true,
      videoEncoding: {
        maxBitrate: 350000,
        maxFramerate: 24
      }
    }
  }), []);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<string[]>([]);
  const participantStripRef = useRef<ScrollView | null>(null);
  const lastSpokenRef = useRef<Map<string, number>>(new Map());
  const [muted, setMuted] = useState(!isHost);
  const [cameraOff, setCameraOff] = useState(!isHost);
  const [error, setError] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [connectionEnded, setConnectionEnded] = useState(false);
  const unifiedPressedRef = useRef(false);

  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    insets = useSafeAreaInsets();
  } catch {}

  const topInset = Math.max(
    insets?.top || 0,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  );
  const topPadding = topInset + 8;
  const bottomPadding = Math.max(insets?.bottom || 0, 14);
  const controlsBottom = Math.max(insets?.bottom || 0, Platform.OS === 'android' ? 24 : 12) + 12;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    try {
      const NavigationBar = require('expo-navigation-bar');
      if (NavigationBar?.setBackgroundColorAsync) {
        NavigationBar.setBackgroundColorAsync('#000000');
        NavigationBar.setButtonStyleAsync?.('light');
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshParticipants = () => {
      if (!cancelled) setParticipants([room.localParticipant, ...Array.from(room.remoteParticipants.values())]);
    };

    const connect = async () => {
      try {
        if (AudioSession?.configureAudio) {
          try {
            await AudioSession.configureAudio({
              android: {
                preferredOutputList: ['speaker', 'headset', 'bluetooth', 'earpiece'],
                audioTypeOptions: AndroidAudioTypePresets?.communication || {
                  manageAudioFocus: true,
                  audioMode: 'inCommunication',
                  audioFocusMode: 'gain',
                  audioStreamType: 'voiceCall',
                  audioAttributesUsageType: 'voiceCommunication',
                  audioAttributesContentType: 'speech'
                }
              },
              ios: {
                defaultOutput: 'speaker'
              }
            });
          } catch (audioConfigErr) {
            console.info('[LiveKit] configureAudio notice:', audioConfigErr);
          }
        }
        if (AudioSession?.startAudioSession) {
          try { await AudioSession.startAudioSession(); }
          catch (audioSessionError) { console.info('[LiveKit] Audio session setup failed; attempting room connection anyway.', audioSessionError); }
        }
        if (AudioSession?.setDefaultRemoteAudioTrackVolume) {
          try { await AudioSession.setDefaultRemoteAudioTrackVolume(1.0); } catch {}
        }

        await room.connect(serverUrl, token, { autoSubscribe: true });
        if (cancelled) return;

        if (AudioSession?.selectAudioOutput) {
          try { await AudioSession.selectAudioOutput('speaker'); } catch {}
        }

        onReadyRef.current?.();
        if (isHost) {
          try {
            await room.localParticipant.setCameraEnabled(true, { resolution: { width: 640, height: 360, frameRate: 20 } });
            if (!cancelled) setCameraOff(false);
          } catch (cameraError) {
            console.info('[LiveKit] Camera unavailable; continuing without video.', cameraError);
            if (!cancelled) setCameraOff(true);
          }
          try {
            await room.localParticipant.setMicrophoneEnabled(true, {
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: false
            });
            if (!cancelled) setMuted(false);
          } catch (audioError) {
            console.info('[LiveKit] Microphone unavailable; continuing in listen-only mode.', audioError);
            if (!cancelled) setMuted(true);
          }
          setTimeout(() => {
            if (!cancelled) {
              setIsInitialLoading(false);
              refreshParticipants();
            }
          }, 350);
        } else {
          // Pre-warm guest audio track as muted so unified "Hold to talk" is instant (0ms)
          try {
            await room.localParticipant.setMicrophoneEnabled(true, {
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: false
            });
            const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
            if (micPub?.track) {
              await micPub.track.mute();
            }
            if (!cancelled) setMuted(true);
          } catch {
            // Handled when user presses hold to talk if mic permission prompt needed
          }
          refreshParticipants();
          const hasHostVideo = Array.from(room.remoteParticipants.values()).some((p) =>
            Array.from(p.videoTrackPublications.values()).some((v) => v.isSubscribed && v.track)
          );
          if (hasHostVideo) {
            if (!cancelled) setIsInitialLoading(false);
          } else {
            setTimeout(() => {
              if (!cancelled) setIsInitialLoading(false);
            }, 1200);
          }
        }
        refreshParticipants();
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Unable to connect to the live room.');
          setIsInitialLoading(false);
        }
      }
    };

    const initialSafetyTimer = setTimeout(() => {
      if (!cancelled) setIsInitialLoading(false);
    }, 4500);

    room
      .on(RoomEvent.ParticipantConnected, refreshParticipants)
      .on(RoomEvent.ParticipantDisconnected, refreshParticipants)
      .on(RoomEvent.ParticipantMetadataChanged, refreshParticipants)
      .on(RoomEvent.TrackPublished, refreshParticipants)
      .on(RoomEvent.TrackUnpublished, refreshParticipants)
      .on(RoomEvent.TrackSubscribed, (track) => {
        refreshParticipants();
        if (!cancelled && !isHost && track.kind === Track.Kind.Video) {
          setIsInitialLoading(false);
        }
      })
      .on(RoomEvent.TrackUnsubscribed, refreshParticipants)
      .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => setActiveSpeakerIds(speakers.map((speaker) => speaker.identity)))
      .on(RoomEvent.LocalTrackPublished, (pub) => {
        refreshParticipants();
        if (!cancelled && isHost && pub.kind === Track.Kind.Video) {
          setTimeout(() => {
            if (!cancelled) setIsInitialLoading(false);
          }, 250);
        }
      })
      .on(RoomEvent.LocalTrackUnpublished, refreshParticipants)
      .on(RoomEvent.TrackMuted, refreshParticipants)
      .on(RoomEvent.TrackUnmuted, refreshParticipants)
      .on(RoomEvent.Reconnecting, () => { setIsReconnecting(true); setConnectionEnded(false); })
      .on(RoomEvent.Reconnected, () => { setIsReconnecting(false); setConnectionEnded(false); refreshParticipants(); })
      .on(RoomEvent.Disconnected, () => { setIsReconnecting(false); setConnectionEnded(true); });
    void connect();

    return () => {
      cancelled = true;
      clearTimeout(initialSafetyTimer);
      room.removeAllListeners();
      room.disconnect();
      if (AudioSession?.stopAudioSession) {
        void AudioSession.stopAudioSession();
      }
    };
  }, [room, serverUrl, token, isHost]);

  // Host Instant Toggles: Updates UI immediately (0ms) so icons slash and button turns red, then controls WebRTC track
  const toggleMicrophone = async () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    try {
      const micPub = room.localParticipant?.getTrackPublication(Track.Source.Microphone);
      if (micPub?.track) {
        if (nextMuted) {
          await micPub.track.mute();
        } else {
          await micPub.track.unmute();
        }
      } else {
        await room.localParticipant?.setMicrophoneEnabled(!nextMuted, {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: false
        });
      }
    } catch (err: any) {
      console.warn('[LiveKit] toggleMicrophone track warning:', err);
      try {
        await room.localParticipant?.setMicrophoneEnabled(!nextMuted, {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: false
        });
      } catch (e2) {
        console.warn('[LiveKit] fallback setMicrophoneEnabled error:', e2);
      }
    }
  };

  const toggleCamera = async () => {
    const nextCameraOff = !cameraOff;
    setCameraOff(nextCameraOff);
    try {
      const camPub = room.localParticipant?.getTrackPublication(Track.Source.Camera);
      if (camPub?.track) {
        if (nextCameraOff) {
          await camPub.track.mute();
        } else {
          await camPub.track.unmute();
        }
      } else {
        if (nextCameraOff) {
          await room.localParticipant?.setCameraEnabled(false);
        } else {
          await room.localParticipant?.setCameraEnabled(true, { resolution: { width: 640, height: 360, frameRate: 20 } });
        }
      }
    } catch (err: any) {
      console.warn('[LiveKit] toggleCamera track warning:', err);
      try {
        if (nextCameraOff) {
          await room.localParticipant?.setCameraEnabled(false);
        } else {
          await room.localParticipant?.setCameraEnabled(true, { resolution: { width: 640, height: 360, frameRate: 20 } });
        }
      } catch (e2) {
        console.warn('[LiveKit] fallback setCameraEnabled error:', e2);
      }
    }
  };

  // Guest Unified Push-to-Talk (Hold-to-Talk): Starts both audio and video, favoring audio first
  const startUnifiedTalk = async () => {
    if (unifiedPressedRef.current) return;
    unifiedPressedRef.current = true;
    setMuted(false);
    setCameraOff(false);

    // 1. Immediately prioritize audio (0ms latency, wideband natural sound)
    try {
      const micPub = room.localParticipant?.getTrackPublication(Track.Source.Microphone);
      if (micPub?.track) {
        await micPub.track.unmute();
      } else {
        await room.localParticipant?.setMicrophoneEnabled(true, {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: false
        });
      }
    } catch (err) {
      console.warn('[LiveKit] startUnifiedTalk audio error:', err);
    }

    // 2. Concurrently attempt video without blocking audio
    try {
      const camPub = room.localParticipant?.getTrackPublication(Track.Source.Camera);
      if (camPub?.track) {
        await camPub.track.unmute();
      } else {
        await room.localParticipant?.setCameraEnabled(true, {
          resolution: { width: 480, height: 360, frameRate: 15 }
        });
      }
    } catch (camErr) {
      // Audio is favored; video failing will not disrupt audio stream
      console.info('[LiveKit] Camera optional on hold-to-talk:', camErr);
    }
  };

  const stopUnifiedTalk = async () => {
    if (!unifiedPressedRef.current) return;
    unifiedPressedRef.current = false;
    setMuted(true);
    setCameraOff(true);

    try {
      const micPub = room.localParticipant?.getTrackPublication(Track.Source.Microphone);
      if (micPub?.track) await micPub.track.mute();
      else await room.localParticipant?.setMicrophoneEnabled(false);
    } catch (err) {
      console.warn('[LiveKit] stopUnifiedTalk audio mute error:', err);
    }

    try {
      const camPub = room.localParticipant?.getTrackPublication(Track.Source.Camera);
      if (camPub?.track) await camPub.track.mute();
      else await room.localParticipant?.setCameraEnabled(false);
    } catch (camErr) {
      console.warn('[LiveKit] stopUnifiedTalk camera mute error:', camErr);
    }
  };

  const hostParticipant = isHost
    ? room.localParticipant
    : participants.find((participant) => participant !== room.localParticipant && participant.permissions?.canPublish) ||
      participants.find((participant) => participant !== room.localParticipant && Boolean(participant.getTrackPublication(Track.Source.Camera)?.track || participant.getTrackPublication(Track.Source.Camera)?.videoTrack)) ||
      participants.find((participant) => participant !== room.localParticipant);

  // Update timestamps when participants speak (excluding host)
  useEffect(() => {
    if (activeSpeakerIds.length > 0) {
      const now = Date.now();
      activeSpeakerIds.forEach((id) => {
        if (id !== hostParticipant?.identity) {
          lastSpokenRef.current.set(id, now);
        }
      });
    }
  }, [activeSpeakerIds, hostParticipant]);

  // Position active speakers first in row, followed by most recently spoken
  const otherParticipants = useMemo(() => {
    return participants
      .filter((participant) => participant !== hostParticipant)
      .sort((a, b) => {
        const aIsSpeaking = activeSpeakerIds.includes(a.identity);
        const bIsSpeaking = activeSpeakerIds.includes(b.identity);
        if (aIsSpeaking && !bIsSpeaking) return -1;
        if (!aIsSpeaking && bIsSpeaking) return 1;
        if (aIsSpeaking && bIsSpeaking) {
          return activeSpeakerIds.indexOf(a.identity) - activeSpeakerIds.indexOf(b.identity);
        }
        const aTime = lastSpokenRef.current.get(a.identity) || 0;
        const bTime = lastSpokenRef.current.get(b.identity) || 0;
        if (aTime !== bTime) return bTime - aTime;
        return (a.joinedAt?.getTime() || 0) - (b.joinedAt?.getTime() || 0);
      });
  }, [participants, hostParticipant, activeSpeakerIds]);

  // When a guest / participant speaks, smoothly snap the strip so they appear first in row
  useEffect(() => {
    const hasOtherSpeaker = activeSpeakerIds.some(
      (id) => id !== hostParticipant?.identity && otherParticipants.some((p) => p.identity === id)
    );
    if (hasOtherSpeaker) {
      requestAnimationFrame(() => {
        participantStripRef.current?.scrollTo({ x: 0, animated: true });
      });
    }
  }, [activeSpeakerIds, hostParticipant, otherParticipants]);

  const renderParticipant = (participant: Participant, featured = false) => {
    const isLocal = participant === room.localParticipant;
    const videoPub = participant.getTrackPublication(Track.Source.Camera);
    const audioPub = participant.getTrackPublication(Track.Source.Microphone);
    const videoTrack = videoPub?.videoTrack || videoPub?.track;
    const audioTrack = audioPub?.audioTrack || audioPub?.track;

    // Detect if camera is off or muted (no undefined isEnabled check)
    const isCamOff = isLocal
      ? (cameraOff || !videoTrack || Boolean(videoPub?.isMuted) || Boolean(videoTrack?.isMuted))
      : (!videoTrack || Boolean(videoPub?.isMuted) || Boolean(videoTrack?.isMuted) || participant.isCameraEnabled === false);
    const isVideoAvailable = Boolean(!isCamOff && videoTrack);

    // Detect if microphone is muted
    const isMicMuted = isLocal
      ? (muted || !audioTrack || Boolean(audioPub?.isMuted) || Boolean(audioTrack?.isMuted))
      : (!audioTrack || Boolean(audioPub?.isMuted) || Boolean(audioTrack?.isMuted) || participant.isMicrophoneEnabled === false);

    const metadataAvatar = (() => { try { return JSON.parse(participant.metadata || '{}')?.avatarUrl; } catch { return ''; } })();
    const avatarUrl = metadataAvatar || (isLocal ? currentUserAvatar : '');

    // The host stage remains still (no highlight border, no mixer icon).
    // Only guest / participant cards show the glow border and animated mixer waves.
    const isHostTile = featured || participant === hostParticipant || (isHost && isLocal);
    const isSpeaking = !isHostTile && activeSpeakerIds.includes(participant.identity);

    return (
      <View
        key={participant.identity}
        style={[
          styles.tile,
          featured ? styles.featuredTile : styles.participantTile,
          isSpeaking && styles.speakingTile
        ]}
      >
        {isVideoAvailable && (VideoView || Platform.OS === 'web') ? (
          <LiveVideoTrackView videoTrack={videoTrack} style={StyleSheet.absoluteFill} mirror={isLocal} zOrder={featured ? 0 : 1} />
        ) : (
          <View style={styles.noVideo}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarCover} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {(participant.name || participant.identity).trim().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.nameTag}>
          <Text style={styles.captionText} numberOfLines={1}>
            {participant.name || participant.identity}
            {isLocal ? ' (You)' : ''}
          </Text>
        </View>
        <View style={styles.tileStatusRow}>
          {isMicMuted && (
            <View style={styles.tileBadgeMuted}>
              <MicOffIcon color="#ffffff" size={13} />
            </View>
          )}
          {isCamOff && (
            <View style={styles.tileBadgeMuted}>
              <CameraOffIcon color="#ffffff" size={13} />
            </View>
          )}
        </View>
        {isSpeaking && <SpeakingWaveBadge />}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#071b16"
        translucent={Platform.OS === 'android'}
      />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!isNetworkOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>You’re offline</Text>
            </View>
          )}
          <View style={[styles.liveBadge, connectionEnded && styles.liveBadgeEnded]}>
            <Text style={[styles.liveText, connectionEnded && styles.liveTextEnded]}>
              {connectionEnded ? '● ENDED' : '● LIVE'}
            </Text>
          </View>
          {!connectionEnded && (
            <Text style={styles.subtitle}>
              {participants.length} participant{participants.length === 1 ? '' : 's'}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeText}>{connectionEnded ? 'Exit' : isHost ? 'End room' : 'Leave room'}</Text>
        </TouchableOpacity>
      </View>

      {connectionEnded ? (
        <View style={styles.endedCardContainer}>
          <View style={styles.endedCard}>
            <View style={styles.endedCardDot} />
            <Text style={styles.endedCardTitle}>Connection ended</Text>
            <Text style={styles.endedCardSubtitle}>This live session has ended.</Text>
            <TouchableOpacity style={styles.endedCardExitBtn} onPress={onClose} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.endedCardExitText}>Exit live</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          {otherParticipants.length > 0 && (
            <ScrollView
              ref={participantStripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.participantStrip}
              contentContainerStyle={styles.participantStripContent}
            >
              {otherParticipants.map((participant) => renderParticipant(participant))}
            </ScrollView>
          )}
          <View style={styles.stage}>
            {hostParticipant ? renderParticipant(hostParticipant, true) : <ActivityIndicator color="#86efac" style={styles.loader} />}
          </View>

          {(isInitialLoading || isReconnecting || !isNetworkOnline) && (
            <View style={[styles.reconnectionOverlay, { top: topPadding + 40 }]}>
              {!isNetworkOnline ? (
                <>
                  <Text style={styles.reconnectionOffline}>You’re offline</Text>
                  <Text style={styles.reconnectionTitle}>Connection lost</Text>
                  <ActivityIndicator color="#8ce7bd" size="large" />
                  <Text style={styles.reconnectionMessage}>Reconnecting…</Text>
                </>
              ) : isReconnecting ? (
                <>
                  <Text style={styles.reconnectionTitle}>Reconnecting</Text>
                  <ActivityIndicator color="#8ce7bd" size="large" />
                  <Text style={styles.reconnectionMessage}>Restoring live stream…</Text>
                </>
              ) : isInitialLoading ? (
                <>
                  <Text style={styles.reconnectionTitle}>
                    {isHost ? 'Initializing…' : 'Connecting…'}
                  </Text>
                  <ActivityIndicator color="#8ce7bd" size="large" />
                  <Text style={styles.reconnectionMessage}>
                    {isHost ? 'Starting camera & audio…' : 'Connecting to live broadcast…'}
                  </Text>
                </>
              ) : null}
            </View>
          )}

          {isHost ? (
            <View
              style={[
                styles.controls,
                { bottom: controlsBottom },
                isInitialLoading && { opacity: 0.35 }
              ]}
              pointerEvents={isInitialLoading ? 'none' : 'box-none'}
            >
              <TouchableOpacity
                style={[styles.control, muted && styles.controlActive]}
                onPress={toggleMicrophone}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <View style={styles.controlIconWrap}>
                  {muted ? <MicOffIcon color="#ffffff" size={22} /> : <MicIcon color="#e8f1ec" size={22} />}
                </View>
                <Text style={styles.controlText}>{muted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.control, cameraOff && styles.controlActive]}
                onPress={toggleCamera}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={cameraOff ? 'Start camera' : 'Stop camera'}
              >
                <View style={styles.controlIconWrap}>
                  {cameraOff ? <CameraOffIcon color="#ffffff" size={22} /> : <CameraIcon color="#e8f1ec" size={22} />}
                </View>
                <Text style={styles.controlText}>{cameraOff ? 'Start camera' : 'Stop camera'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.controls,
                styles.participantControlsCentered,
                { bottom: controlsBottom },
                isInitialLoading && { opacity: 0.35 }
              ]}
              pointerEvents={isInitialLoading ? 'none' : 'box-none'}
            >
              <TouchableOpacity
                style={[styles.unifiedHoldBtn, (!muted || !cameraOff) && styles.unifiedHoldBtnActive]}
                onPressIn={startUnifiedTalk}
                onPressOut={stopUnifiedTalk}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={muted ? 'Hold to talk' : 'Release to mute'}
              >
                <View style={styles.unifiedIconGroup}>
                  <View style={styles.controlIconWrap}>
                    {muted ? <MicOffIcon color="#d0ddd7" size={22} /> : <MicIcon color="#071b16" size={22} />}
                  </View>
                  <View style={styles.controlIconWrap}>
                    {cameraOff ? <CameraOffIcon color="#d0ddd7" size={19} /> : <CameraIcon color="#071b16" size={19} />}
                  </View>
                </View>
                <Text style={[styles.unifiedHoldText, (!muted || !cameraOff) && styles.unifiedHoldTextActive]}>
                  {muted ? 'Hold to talk' : 'Release to mute'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071b16', paddingHorizontal: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offlineBadge: { backgroundColor: '#422b16', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  offlineText: { color: '#fcd38d', fontSize: 10, fontWeight: '800' },
  liveBadge: { backgroundColor: 'rgba(239, 68, 68, 0.22)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 3 },
  liveBadgeEnded: { backgroundColor: 'rgba(100, 116, 139, 0.22)', borderColor: '#64748b' },
  liveText: { color: '#ef4444', fontWeight: '800', fontSize: 12 },
  liveTextEnded: { color: '#94a3b8' },
  subtitle: { color: '#bbf7d0', fontSize: 12, fontWeight: '700' },
  closeButton: { backgroundColor: '#dc2626', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8 },
  closeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  endedCardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  endedCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0c221c',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#1e483b',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10
  },
  endedCardDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef4444',
    marginBottom: 16
  },
  endedCardTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center'
  },
  endedCardSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24
  },
  endedCardExitBtn: {
    width: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4
  },
  endedCardExitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  reconnectionOverlay: { ...StyleSheet.absoluteFillObject, top: 44, zIndex: 10, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: 'rgba(4, 12, 10, 0.84)' },
  reconnectionOffline: { position: 'absolute', top: 12, alignSelf: 'center', color: '#fcd38d', fontWeight: '800', fontSize: 12 },
  reconnectionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  reconnectionMessage: { color: '#d1fae5', fontSize: 14, fontWeight: '700' },
  reconnectionExit: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: '#a93643' },
  reconnectionExitText: { color: '#ffffff', fontWeight: '800' },
  participantStrip: { flexGrow: 0, flexShrink: 0, height: 92, marginBottom: 10 },
  participantStripContent: { flexDirection: 'row', gap: 9, alignItems: 'stretch' },
  stage: { flex: 1, minHeight: 0, paddingBottom: 68 },
  tile: { overflow: 'hidden', backgroundColor: '#12352b' },
  participantTile: { width: 92, height: 92, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  speakingTile: {
    borderColor: '#22c55e',
    borderWidth: 2.5,
    shadowColor: '#22c55e',
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 9
  },
  featuredTile: { width: '100%', height: '100%', borderRadius: 12 },
  noVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12352b' },
  avatarCover: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#14532d' },
  avatarInitial: { color: '#e8fff4', fontSize: 34, fontWeight: '800' },
  nameTag: { position: 'absolute', left: 5, top: 5, maxWidth: '86%', backgroundColor: 'rgba(3, 12, 9, 0.78)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 },
  captionText: { color: '#fff', fontWeight: '700', fontSize: 9 },
  tileStatusRow: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 4
  },
  tileBadgeMuted: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  speakingBadge: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2.5,
    height: 18,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: 'rgba(7, 27, 22, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)'
  },
  speakingBar: {
    width: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#22c55e'
  },
  controls: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 90,
    elevation: 25
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#14532d',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    zIndex: 95,
    elevation: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {})
  } as any,
  controlActive: {
    backgroundColor: '#b91c1c',
    borderColor: 'rgba(254, 202, 202, 0.35)'
  },
  participantControlsCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0
  },
  unifiedHoldBtn: {
    width: '78%',
    maxWidth: 290,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(18, 38, 32, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 95,
    elevation: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {})
  } as any,
  unifiedHoldBtnActive: {
    backgroundColor: '#22c55e',
    borderColor: '#86efac',
    shadowColor: '#22c55e',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 28
  },
  unifiedIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  unifiedHoldText: {
    color: '#f0fdf4',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  unifiedHoldTextActive: {
    color: '#071b16'
  },
  controlIconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  },
  loader: { flex: 1 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#fecaca', textAlign: 'center' }
});
