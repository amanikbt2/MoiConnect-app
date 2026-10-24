import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Participant, Room, RoomEvent, Track } from 'livekit-client';
import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from './Icons';

let AudioSession: any = null;
let VideoView: any = null;

if (Platform.OS !== 'web') {
  try {
    const livekitRN = require('@livekit/react-native');
    AudioSession = livekitRN.AudioSession;
    VideoView = livekitRN.VideoView;
  } catch (e) {
    console.warn('[LiveKit] @livekit/react-native is not available:', e);
  }
}

interface CommunityLiveRoomProps {
  serverUrl: string;
  token: string;
  isHost: boolean;
  isNetworkOnline?: boolean;
  onClose: () => void;
  onReady?: () => void;
}

export function CommunityLiveRoom({ serverUrl, token, isHost, isNetworkOnline = true, onClose, onReady }: CommunityLiveRoomProps) {
  const room = useMemo(() => new Room({ adaptiveStream: true, dynacast: true }), []);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<string[]>([]);
  const participantStripRef = useRef<ScrollView | null>(null);
  const [muted, setMuted] = useState(!isHost);
  const [cameraOff, setCameraOff] = useState(!isHost);
  const [error, setError] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionEnded, setConnectionEnded] = useState(false);
  const micPressedRef = useRef(false);
  const cameraPressedRef = useRef(false);
  const micTaskRef = useRef<Promise<void>>(Promise.resolve());
  const cameraTaskRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    const refreshParticipants = () => {
      if (!cancelled) setParticipants([room.localParticipant, ...Array.from(room.remoteParticipants.values())]);
    };

    const connect = async () => {
      try {
        if (AudioSession?.startAudioSession) {
          try { await AudioSession.startAudioSession(); }
          catch (audioSessionError) { console.info('[LiveKit] Audio session setup failed; attempting room connection anyway.', audioSessionError); }
        }
        await room.connect(serverUrl, token, { autoSubscribe: true });
        if (cancelled) return;
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
            await room.localParticipant.setMicrophoneEnabled(true);
            if (!cancelled) setMuted(false);
          } catch (audioError) {
            console.info('[LiveKit] Microphone unavailable; continuing in listen-only mode.', audioError);
            if (!cancelled) setMuted(true);
          }
        }
        refreshParticipants();
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Unable to connect to the live room.');
      }
    };

    room
      .on(RoomEvent.ParticipantConnected, refreshParticipants)
      .on(RoomEvent.ParticipantDisconnected, refreshParticipants)
      .on(RoomEvent.TrackSubscribed, refreshParticipants)
      .on(RoomEvent.TrackUnsubscribed, refreshParticipants)
      .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => setActiveSpeakerIds(speakers.map((speaker) => speaker.identity)))
      .on(RoomEvent.LocalTrackPublished, refreshParticipants)
      .on(RoomEvent.LocalTrackUnpublished, refreshParticipants)
      .on(RoomEvent.Reconnecting, () => { setIsReconnecting(true); setConnectionEnded(false); })
      .on(RoomEvent.Reconnected, () => { setIsReconnecting(false); setConnectionEnded(false); refreshParticipants(); })
      .on(RoomEvent.Disconnected, () => { setIsReconnecting(false); setConnectionEnded(true); });
    void connect();

    return () => {
      cancelled = true;
      room.removeAllListeners();
      room.disconnect();
      if (AudioSession?.stopAudioSession) {
        void AudioSession.stopAudioSession();
      }
    };
  }, [room, serverUrl, token, isHost]);

  const setMicrophoneEnabled = (enabled: boolean) => {
    micTaskRef.current = micTaskRef.current.then(async () => {
      try {
        await room.localParticipant.setMicrophoneEnabled(enabled);
        setMuted(!enabled);
        setError('');
      } catch (err: any) {
        setError(err?.message || 'Microphone unavailable. Check the app permission and try again.');
      }
    });
  };

  const setCameraEnabled = (enabled: boolean) => {
    cameraTaskRef.current = cameraTaskRef.current.then(async () => {
      try {
        await room.localParticipant.setCameraEnabled(enabled, { resolution: { width: 640, height: 360, frameRate: 20 } });
        setCameraOff(!enabled);
        setError('');
      } catch (err: any) {
        setCameraOff(true);
        setError(err?.message || 'Camera unavailable. You can still join and use chat.');
      }
    });
  };

  const toggleMicrophone = () => setMicrophoneEnabled(!muted);
  const toggleCamera = () => setCameraEnabled(!cameraOff);
  const startTalking = () => {
    if (micPressedRef.current) return;
    micPressedRef.current = true;
    setMicrophoneEnabled(true);
  };
  const stopTalking = () => {
    if (!micPressedRef.current) return;
    micPressedRef.current = false;
    setMicrophoneEnabled(false);
  };
  const startCamera = () => {
    if (cameraPressedRef.current) return;
    cameraPressedRef.current = true;
    setCameraEnabled(true);
  };
  const stopCamera = () => {
    if (!cameraPressedRef.current) return;
    cameraPressedRef.current = false;
    setCameraEnabled(false);
  };

  const hostParticipant = isHost
    ? room.localParticipant
    : participants.find((participant) => participant !== room.localParticipant && participant.permissions?.canPublish) ||
      participants.find((participant) => participant !== room.localParticipant && participant.getTrackPublication(Track.Source.Camera)?.videoTrack) ||
      participants.find((participant) => participant !== room.localParticipant);
  const otherParticipants = participants
    .filter((participant) => participant !== hostParticipant)
    .sort((a, b) => Number(activeSpeakerIds.includes(b.identity)) - Number(activeSpeakerIds.includes(a.identity)));

  useEffect(() => {
    if (activeSpeakerIds.some((id) => otherParticipants.some((participant) => participant.identity === id))) {
      participantStripRef.current?.scrollTo({ x: 0, animated: true });
    }
  }, [activeSpeakerIds, hostParticipant]);

  const renderParticipant = (participant: Participant, featured = false) => {
    const videoTrack = participant.getTrackPublication(Track.Source.Camera)?.videoTrack;
    const avatarUrl = (() => { try { return JSON.parse(participant.metadata || '{}')?.avatarUrl; } catch { return ''; } })();
    const isSpeaking = activeSpeakerIds.includes(participant.identity);
    return (
      <View key={participant.identity} style={[styles.tile, featured ? styles.featuredTile : styles.participantTile, isSpeaking && styles.speakingTile]}>
        {videoTrack && VideoView ? (
          <VideoView videoTrack={videoTrack} style={StyleSheet.absoluteFill} objectFit="cover" mirror={participant === room.localParticipant} />
        ) : (
          <View style={styles.noVideo}>
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarCover} resizeMode="cover" /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{(participant.name || participant.identity).trim().charAt(0).toUpperCase()}</Text></View>}
          </View>
        )}
        <View style={styles.nameTag}><Text style={styles.captionText} numberOfLines={1}>{participant.name || participant.identity}{participant === room.localParticipant ? ' (You)' : ''}</Text></View>
        {isSpeaking && <View style={styles.speakingBadge}><View style={styles.speakingBar} /><View style={[styles.speakingBar, styles.speakingBarTall]} /><View style={styles.speakingBar} /></View>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.headerBadges}>
            {!isNetworkOnline && <View style={styles.offlineBadge}><Text style={styles.offlineText}>You’re offline</Text></View>}
            <Text style={styles.liveText}>● LIVE</Text>
          </View>
          <Text style={styles.subtitle}>{participants.length} participant{participants.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeText}>{isHost ? 'End' : 'Leave'}</Text></TouchableOpacity>
      </View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : (
        <>
          {otherParticipants.length > 0 && (
            <ScrollView ref={participantStripRef} horizontal showsHorizontalScrollIndicator={false} style={styles.participantStrip} contentContainerStyle={styles.participantStripContent}>
              {otherParticipants.map((participant) => renderParticipant(participant))}
            </ScrollView>
          )}
          <View style={styles.stage}>
            {hostParticipant ? renderParticipant(hostParticipant, true) : <ActivityIndicator color="#86efac" style={styles.loader} />}
          </View>
        </>
      )}
      {(isReconnecting || !isNetworkOnline || connectionEnded) && (
        <View style={styles.reconnectionOverlay}>
          {!isNetworkOnline && <Text style={styles.reconnectionOffline}>You’re offline</Text>}
          <Text style={styles.reconnectionTitle}>{connectionEnded ? 'Connection ended' : 'Connection lost'}</Text>
          {!connectionEnded && <><ActivityIndicator color="#8ce7bd" size="large" /><Text style={styles.reconnectionMessage}>Reconnecting…</Text></>}
          {connectionEnded && <TouchableOpacity style={styles.reconnectionExit} onPress={onClose}><Text style={styles.reconnectionExitText}>Exit live</Text></TouchableOpacity>}
        </View>
      )}
      {isHost ? (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.control, muted && styles.controlActive]} onPress={toggleMicrophone}><View style={styles.controlIconWrap}>{muted ? <MicOffIcon color="#ffb2b7" size={22} /> : <MicIcon color="#e8f1ec" size={22} />}</View><Text style={styles.controlText}>{muted ? 'Unmute' : 'Mute'}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.control, cameraOff && styles.controlActive]} onPress={toggleCamera}><View style={styles.controlIconWrap}>{cameraOff ? <CameraOffIcon color="#ffb2b7" size={22} /> : <CameraIcon color="#e8f1ec" size={22} />}</View><Text style={styles.controlText}>{cameraOff ? 'Start camera' : 'Stop camera'}</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.control, styles.holdControl, !muted && styles.holdControlActive]} onPressIn={startTalking} onPressOut={stopTalking} accessibilityRole="button" accessibilityLabel="Hold to talk">
            <View style={styles.controlIconWrap}>{muted ? <MicOffIcon color="#d0ddd7" size={22} /> : <MicIcon color="#071b16" size={22} />}</View>
            <Text style={[styles.controlText, !muted && styles.holdControlText]}>{muted ? 'Hold to talk' : 'Release to mute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.control, styles.holdControl, !cameraOff && styles.holdControlActive]} onPressIn={startCamera} onPressOut={stopCamera} accessibilityRole="button" accessibilityLabel="Hold to turn on camera">
            <View style={styles.controlIconWrap}>{cameraOff ? <CameraOffIcon color="#d0ddd7" size={22} /> : <CameraIcon color="#071b16" size={22} />}</View>
            <Text style={[styles.controlText, !cameraOff && styles.holdControlText]}>{cameraOff ? 'Hold for video' : 'Release to stop'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071b16', padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  headerBadges: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  offlineBadge: { backgroundColor: '#422b16', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  offlineText: { color: '#fcd38d', fontSize: 10, fontWeight: '800' },
  liveText: { color: '#f87171', fontWeight: '800', fontSize: 15 },
  subtitle: { color: '#bbf7d0', fontSize: 12, marginTop: 2 },
  closeButton: { backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  closeText: { color: '#fff', fontWeight: '800' },
  reconnectionOverlay: { ...StyleSheet.absoluteFillObject, top: 44, zIndex: 5, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: 'rgba(4, 12, 10, 0.84)' },
  reconnectionOffline: { position: 'absolute', top: 12, alignSelf: 'center', color: '#fcd38d', fontWeight: '800', fontSize: 12 },
  reconnectionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  reconnectionMessage: { color: '#d1fae5', fontSize: 14, fontWeight: '700' },
  reconnectionExit: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: '#a93643' },
  reconnectionExitText: { color: '#ffffff', fontWeight: '800' },
  participantStrip: { flexGrow: 0, flexShrink: 0, height: 92, marginBottom: 10 },
  participantStripContent: { flexDirection: 'row', gap: 9, alignItems: 'stretch' },
  stage: { flex: 1, minHeight: 0 },
  tile: { overflow: 'hidden', backgroundColor: '#12352b' },
  participantTile: { width: 92, height: 92, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  speakingTile: { borderColor: '#57e5a5', shadowColor: '#57e5a5', shadowOpacity: 0.55, shadowRadius: 9, elevation: 8 },
  featuredTile: { width: '100%', height: '100%', borderRadius: 12 },
  noVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12352b' },
  avatarCover: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#14532d' },
  avatarInitial: { color: '#e8fff4', fontSize: 34, fontWeight: '800' },
  nameTag: { position: 'absolute', left: 5, top: 5, maxWidth: '86%', backgroundColor: 'rgba(3, 12, 9, 0.78)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 },
  captionText: { color: '#fff', fontWeight: '700', fontSize: 9 },
  speakingBadge: { position: 'absolute', right: 5, bottom: 5, flexDirection: 'row', alignItems: 'center', gap: 2, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: '#0b241a' },
  speakingBar: { width: 2, height: 5, borderRadius: 1, backgroundColor: '#57e5a5' },
  speakingBarTall: { height: 9 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 12 },
  control: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#14532d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  controlActive: { backgroundColor: '#7f1d1d' },
  holdControl: { minWidth: 140, backgroundColor: '#1c2925', borderWidth: 1, borderColor: '#34443e' },
  holdControlActive: { backgroundColor: '#74e2b1', borderColor: '#74e2b1' },
  controlIconWrap: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  controlText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  holdControlText: { color: '#071b16' },
  loader: { flex: 1 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#fecaca', textAlign: 'center' }
});

