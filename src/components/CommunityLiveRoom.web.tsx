import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Participant, Room, RoomEvent, Track, TrackPublication } from 'livekit-client';
import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from './Icons';

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

function LiveTrack({ publication, kind, mirror = false }: { publication: TrackPublication | undefined; kind: 'video' | 'audio'; mirror?: boolean }) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const track = publication?.track;

  useEffect(() => {
    const node = mediaRef.current;
    if (!node || !track) return;
    track.attach(node);
    return () => {
      try {
        track.detach(node);
      } catch {}
    };
  }, [track]);

  if (kind === 'audio') {
    return React.createElement('audio', { ref: mediaRef, autoPlay: true, playsInline: true });
  }

  return React.createElement('video', {
    ref: mediaRef,
    autoPlay: true,
    playsInline: true,
    muted: true,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      backgroundColor: '#172a26',
      transform: mirror ? 'scaleX(-1)' : undefined
    }
  });
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
      noiseSuppression: false
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
  const participantStripRef = useRef<any>(null);
  const lastSpokenRef = useRef<Map<string, number>>(new Map());
  const [muted, setMuted] = useState(!isHost);
  const [cameraOff, setCameraOff] = useState(!isHost);
  const [status, setStatus] = useState('Connecting to live room…');
  const [error, setError] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [connectionEnded, setConnectionEnded] = useState(false);
  const unifiedPressedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const refreshParticipants = () => {
      if (!cancelled) {
        setParticipants([room.localParticipant, ...Array.from(room.remoteParticipants.values())]);
      }
    };

    const connect = async () => {
      try {
        await room.connect(serverUrl, token, { autoSubscribe: true });
        if (cancelled) return;
        setStatus('Connected. Turn on your camera or microphone when ready.');
        refreshParticipants();
        onReadyRef.current?.();

        // Host initializes with camera and mic on by default
        if (isHost) {
          try {
            await room.localParticipant.setCameraEnabled(true, { resolution: { width: 640, height: 360, frameRate: 20 } });
            if (!cancelled) setCameraOff(false);
          } catch (cameraError) {
            console.info('[LiveKit Web] Camera unavailable; continuing without video.', cameraError);
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
            console.info('[LiveKit Web] Microphone unavailable; continuing in listen-only mode.', audioError);
            if (!cancelled) setMuted(true);
          }
          setTimeout(() => {
            if (!cancelled) {
              setIsInitialLoading(false);
              refreshParticipants();
            }
          }, 350);
        } else {
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
          setError(err?.message || 'Unable to connect. Check your connection and try again.');
          setStatus('');
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
      .on(RoomEvent.TrackSubscribed, (track) => {
        refreshParticipants();
        if (!cancelled && !isHost && track.kind === Track.Kind.Video) {
          setIsInitialLoading(false);
        }
      })
      .on(RoomEvent.TrackUnsubscribed, refreshParticipants)
      .on(RoomEvent.TrackMuted, refreshParticipants)
      .on(RoomEvent.TrackUnmuted, refreshParticipants)
      .on(RoomEvent.LocalTrackPublished, (pub) => {
        refreshParticipants();
        if (!cancelled && isHost && pub.kind === Track.Kind.Video) {
          setTimeout(() => {
            if (!cancelled) setIsInitialLoading(false);
          }, 300);
        }
      })
      .on(RoomEvent.LocalTrackUnpublished, refreshParticipants)
      .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => setActiveSpeakerIds(speakers.map((speaker) => speaker.identity)))
      .on(RoomEvent.Reconnecting, () => { setIsReconnecting(true); setConnectionEnded(false); })
      .on(RoomEvent.Reconnected, () => { setIsReconnecting(false); setConnectionEnded(false); setStatus('Connected.'); refreshParticipants(); })
      .on(RoomEvent.Disconnected, () => { setIsReconnecting(false); setConnectionEnded(true); });

    void connect();

    return () => {
      cancelled = true;
      clearTimeout(initialSafetyTimer);
      room.removeAllListeners();
      void room.disconnect();
    };
  }, [room, serverUrl, token, isHost]);

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
      }
      await room.localParticipant?.setMicrophoneEnabled(!nextMuted);
      setError('');
    } catch (err: any) {
      console.warn('[LiveKit Web] toggleMicrophone error:', err);
      try {
        await room.localParticipant?.setMicrophoneEnabled(!nextMuted);
      } catch (e2: any) {
        setError(e2?.message || 'Microphone is unavailable. Check browser permission.');
      }
    }
  };

  const toggleCamera = async () => {
    const nextCameraOff = !cameraOff;
    setCameraOff(nextCameraOff);
    try {
      const camPub = room.localParticipant?.getTrackPublication(Track.Source.Camera);
      if (nextCameraOff) {
        if (camPub?.track) {
          try { await camPub.track.mute(); } catch {}
        }
        await room.localParticipant?.setCameraEnabled(false);
      } else {
        await room.localParticipant?.setCameraEnabled(true, {
          resolution: { width: 640, height: 360, frameRate: 20 }
        });
        const newCamPub = room.localParticipant?.getTrackPublication(Track.Source.Camera);
        if (newCamPub?.track && newCamPub.track.isMuted) {
          try { await newCamPub.track.unmute(); } catch {}
        }
      }
      setError('');
    } catch (err: any) {
      console.warn('[LiveKit Web] toggleCamera error:', err);
      try {
        if (nextCameraOff) {
          await room.localParticipant?.setCameraEnabled(false);
        } else {
          await room.localParticipant?.setCameraEnabled(true, {
            resolution: { width: 640, height: 360, frameRate: 20 }
          });
        }
      } catch (e2: any) {
        setError(e2?.message || 'Camera is unavailable. Check browser permission.');
      }
    }
  };

  const startUnifiedTalk = async () => {
    if (unifiedPressedRef.current) return;
    unifiedPressedRef.current = true;
    setMuted(false);
    setCameraOff(false);

    // 1. Immediately favor audio (0ms latency)
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
      console.warn('[LiveKit Web] startUnifiedTalk audio error:', err);
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
      console.info('[LiveKit Web] Camera optional on hold-to-talk:', camErr);
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
      console.warn('[LiveKit Web] stopUnifiedTalk audio mute error:', err);
    }

    try {
      const camPub = room.localParticipant?.getTrackPublication(Track.Source.Camera);
      if (camPub?.track) await camPub.track.mute();
      else await room.localParticipant?.setCameraEnabled(false);
    } catch (camErr) {
      console.warn('[LiveKit Web] stopUnifiedTalk camera mute error:', camErr);
    }
  };

  const hostParticipant = isHost
    ? room.localParticipant
    : participants.find((participant) => participant !== room.localParticipant && participant.permissions?.canPublish) ||
      participants.find((participant) => participant !== room.localParticipant && participant.getTrackPublication(Track.Source.Camera)?.track) ||
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

  useEffect(() => {
    const hasOtherSpeaker = activeSpeakerIds.some(
      (id) => id !== hostParticipant?.identity && otherParticipants.some((p) => p.identity === id)
    );
    if (hasOtherSpeaker) {
      try {
        requestAnimationFrame(() => {
          participantStripRef.current?.scrollTo?.({ x: 0, animated: true });
        });
      } catch {}
    }
  }, [activeSpeakerIds, hostParticipant, otherParticipants]);

  const renderParticipant = (participant: Participant, featured = false) => {
    const isLocal = participant === room.localParticipant;
    const videoPub = participant.getTrackPublication(Track.Source.Camera);
    const audioPub = participant.getTrackPublication(Track.Source.Microphone);
    const videoTrack = videoPub?.track;
    const audioTrack = audioPub?.track;

    // Detect if camera is off or muted
    const isCamOff = isLocal
      ? (cameraOff || !videoTrack || Boolean(videoPub?.isMuted))
      : (!videoTrack || Boolean(videoPub?.isMuted) || participant.isCameraEnabled === false);

    // Detect if mic is muted
    const isMicMuted = isLocal
      ? (muted || !audioTrack || Boolean(audioPub?.isMuted))
      : (!audioTrack || Boolean(audioPub?.isMuted) || participant.isMicrophoneEnabled === false);

    const metadataAvatar = (() => {
      try { return JSON.parse(participant.metadata || '{}')?.avatarUrl; } catch { return ''; }
    })();
    const avatarUrl = metadataAvatar || (isLocal ? currentUserAvatar : '');
    const isSpeaking = activeSpeakerIds.includes(participant.identity);
    const displayName = (participant.name || (isLocal ? currentUserName : '') || participant.identity || 'Student').trim();
    const initial = displayName.charAt(0).toUpperCase() || 'S';

    return (
      <View
        key={participant.identity}
        style={[
          styles.tile,
          featured ? styles.featuredTile : styles.participantTile,
          isSpeaking && styles.speakingTile
        ]}
      >
        {!isCamOff && videoPub?.track ? (
          <LiveTrack publication={videoPub} kind="video" mirror={isLocal} />
        ) : (
          <View style={styles.noVideo}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarCover} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.avatarOverlayScrim} />
          </View>
        )}

        {/* Remote audio track playback */}
        {audioPub?.track && !isLocal && <LiveTrack publication={audioPub} kind="audio" />}

        {/* Name tag */}
        <View style={styles.nameTag}>
          <Text style={styles.captionText} numberOfLines={1}>
            {displayName}{isLocal ? ' (You)' : ''}
          </Text>
        </View>

        {/* Tile badges indicating muted mic or camera off */}
        <View style={styles.tileStatusRow}>
          {isMicMuted && (
            <View style={styles.tileBadgeMuted} accessibilityLabel="Microphone muted">
              <MicOffIcon color="#ffffff" size={13} />
            </View>
          )}
          {isCamOff && (
            <View style={styles.tileBadgeMuted} accessibilityLabel="Camera off">
              <CameraOffIcon color="#ffffff" size={13} />
            </View>
          )}
          {!isMicMuted && isSpeaking && (
            <View style={styles.speakingBadge}>
              <View style={styles.speakingBar} />
              <View style={[styles.speakingBar, styles.speakingBarTall]} />
              <View style={styles.speakingBar} />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.roomIdentity}>
          {!isNetworkOnline && <View style={styles.offlineBadge}><Text style={styles.offlineText}>You’re offline</Text></View>}
          <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
          <Text style={styles.subtitle}>{participants.length} participant{participants.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>{isHost ? 'End room' : 'Leave room'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text></View> : null}

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
            <View style={styles.reconnectionOverlay}>
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
                isInitialLoading && { opacity: 0.35, pointerEvents: 'none' as any }
              ]}
            >
              <TouchableOpacity
                style={[styles.control, muted && styles.controlActive]}
                onPress={() => void toggleMicrophone()}
                accessibilityRole="button"
                accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <View style={styles.controlIconWrap}>
                  {muted ? <MicOffIcon color="#fca5a5" size={22} /> : <MicIcon color="#e8f1ec" size={22} />}
                </View>
                <Text style={[styles.controlText, muted && styles.controlTextActive]}>
                  {muted ? 'Unmute' : 'Mute'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.control, cameraOff && styles.controlActive]}
                onPress={() => void toggleCamera()}
                accessibilityRole="button"
                accessibilityLabel={cameraOff ? 'Start camera' : 'Stop camera'}
              >
                <View style={styles.controlIconWrap}>
                  {cameraOff ? <CameraOffIcon color="#fca5a5" size={22} /> : <CameraIcon color="#e8f1ec" size={22} />}
                </View>
                <Text style={[styles.controlText, cameraOff && styles.controlTextActive]}>
                  {cameraOff ? 'Start camera' : 'Stop camera'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.controls,
                styles.participantControlsCentered,
                isInitialLoading && { opacity: 0.35, pointerEvents: 'none' as any }
              ]}
            >
              <TouchableOpacity
                style={[styles.unifiedHoldBtn, (!muted || !cameraOff) && styles.unifiedHoldBtnActive]}
                onPressIn={startUnifiedTalk}
                onPressOut={stopUnifiedTalk}
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
  container: {
    flex: 1,
    backgroundColor: '#0b1110',
    padding: 16,
    minHeight: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#263431'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14
  },
  roomIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#351d22',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fb6472' },
  liveText: { color: '#ff9aa3', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  offlineBadge: { backgroundColor: '#422b16', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  offlineText: { color: '#fcd38d', fontSize: 11, fontWeight: '800' },
  subtitle: { color: '#a5b4af', fontSize: 12 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#131d1a',
    borderRadius: 12
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#55d6a0' },
  status: { color: '#b6c8c1', textAlign: 'center', fontSize: 12 },
  closeButton: { backgroundColor: '#a93643', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  closeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  endedCardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  endedCard: {
    width: '100%',
    maxWidth: 360,
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
    elevation: 4,
    cursor: 'pointer' as any
  },
  endedCardExitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  reconnectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 48,
    bottom: 0,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: 'rgba(4, 12, 10, 0.88)'
  },
  reconnectionOffline: { position: 'absolute', top: 12, alignSelf: 'center', color: '#fcd38d', fontWeight: '800', fontSize: 12 },
  reconnectionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  reconnectionMessage: { color: '#d1fae5', fontSize: 14, fontWeight: '700' },
  reconnectionExit: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: '#a93643' },
  reconnectionExitText: { color: '#ffffff', fontWeight: '800' },
  participantStrip: { flexGrow: 0, flexShrink: 0, height: 94, marginBottom: 10 },
  participantStripContent: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  stage: { flex: 1, minHeight: 0 },
  tile: { overflow: 'hidden', backgroundColor: '#182522', borderWidth: 1, borderColor: '#33443f', position: 'relative' },
  participantTile: { width: 94, height: 94, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  speakingTile: { borderColor: '#57e5a5', shadowColor: '#57e5a5', shadowOpacity: 0.65, shadowRadius: 10, elevation: 8 },
  featuredTile: { width: '100%', height: '100%', borderRadius: 16 },
  noVideo: { flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#162522', position: 'relative' },
  avatarCover: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#14532d' },
  avatarInitial: { color: '#e8fff4', fontSize: 44, fontWeight: '800' },
  avatarOverlayScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.22)'
  },
  nameTag: {
    position: 'absolute',
    left: 8,
    top: 8,
    maxWidth: '80%',
    backgroundColor: 'rgba(3, 12, 9, 0.78)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    zIndex: 3
  },
  captionText: { color: '#fff', fontWeight: '700', fontSize: 11, flexShrink: 1 },
  tileStatusRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 4
  },
  tileBadgeMuted: {
    backgroundColor: 'rgba(220, 38, 38, 0.88)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  speakingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#0b241a'
  },
  speakingBar: { width: 2, height: 6, borderRadius: 1, backgroundColor: '#57e5a5' },
  speakingBarTall: { height: 11 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingTop: 14 },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1c2925',
    borderWidth: 1,
    borderColor: '#34443e',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    cursor: 'pointer' as any
  },
  controlActive: {
    backgroundColor: '#3b1c21',
    borderColor: '#ef4444'
  },
  participantControlsCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  unifiedHoldBtn: {
    width: '78%',
    maxWidth: 290,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1c2925',
    borderWidth: 1.5,
    borderColor: '#34443e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8
  },
  unifiedHoldBtnActive: {
    backgroundColor: '#22c55e',
    borderColor: '#86efac',
    shadowColor: '#22c55e',
    shadowOpacity: 0.6,
    shadowRadius: 14
  },
  unifiedIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  unifiedHoldText: {
    color: '#f4f7f5',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  unifiedHoldTextActive: {
    color: '#071b16'
  },
  controlIconWrap: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  controlText: { color: '#f4f7f5', fontWeight: '700', fontSize: 13 },
  controlTextActive: { color: '#ffb2b7' },
  holdControlText: { color: '#071b16' },
  loader: { flex: 1 },
  errorBar: { backgroundColor: '#381d22', borderRadius: 10, marginBottom: 10 },
  errorText: { color: '#ffc3c8', textAlign: 'center', padding: 10, fontSize: 12 }
});
