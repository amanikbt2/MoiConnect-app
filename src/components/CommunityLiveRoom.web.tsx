import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Participant, Room, RoomEvent, Track, TrackPublication } from 'livekit-client';
import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from './Icons';

interface CommunityLiveRoomProps {
  serverUrl: string;
  token: string;
  isHost: boolean;
  isNetworkOnline?: boolean;
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
    return () => { track.detach(node); };
  }, [track]);

  if (kind === 'audio') {
    return React.createElement('audio', { ref: mediaRef, autoPlay: true, playsInline: true });
  }

  return React.createElement('video', {
    ref: mediaRef,
    autoPlay: true,
    playsInline: true,
    muted: true,
    style: { width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#172a26', transform: mirror ? 'scaleX(-1)' : undefined }
  });
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
  const [status, setStatus] = useState('Connecting to live room…');
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
        await room.connect(serverUrl, token, { autoSubscribe: true });
        if (cancelled) return;
        setStatus('Connected. Turn on your camera or microphone when ready.');
        refreshParticipants();
        onReadyRef.current?.();

        // Media capture is optional: a device without a usable camera or mic can still watch.
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
        if (!cancelled) {
          setError(err?.message || 'Unable to connect. Check your connection and try again.');
          setStatus('');
        }
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
      .on(RoomEvent.Reconnected, () => { setIsReconnecting(false); setConnectionEnded(false); setStatus('Connected.'); refreshParticipants(); })
      .on(RoomEvent.Disconnected, () => { setIsReconnecting(false); setConnectionEnded(true); });
    void connect();

    return () => {
      cancelled = true;
      room.removeAllListeners();
      void room.disconnect();
    };
  }, [room, serverUrl, token, isHost]);

  const setMicrophoneEnabled = (enabled: boolean) => {
    micTaskRef.current = micTaskRef.current.then(async () => {
      try {
        await room.localParticipant.setMicrophoneEnabled(enabled);
        setMuted(!enabled);
        setError('');
      } catch (err: any) {
        setError(err?.message || 'Microphone is unavailable. Check browser permission and try again.');
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
        setError(err?.message || 'Camera is unavailable. You can still watch and use chat.');
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
      participants.find((participant) => participant !== room.localParticipant && participant.getTrackPublication(Track.Source.Camera)?.track) ||
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
    const video = participant.getTrackPublication(Track.Source.Camera);
    const audio = participant.getTrackPublication(Track.Source.Microphone);
    const avatarUrl = (() => { try { return JSON.parse(participant.metadata || '{}')?.avatarUrl; } catch { return ''; } })();
    const isSpeaking = activeSpeakerIds.includes(participant.identity);
    return (
      <View key={participant.identity} style={[styles.tile, featured ? styles.featuredTile : styles.participantTile, isSpeaking && styles.speakingTile]}>
        {video?.track ? <LiveTrack publication={video} kind="video" mirror={participant === room.localParticipant} /> : (
          <View style={styles.noVideo}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarCover} resizeMode="cover" /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{(participant.name || participant.identity).trim().charAt(0).toUpperCase()}</Text></View>}</View>
        )}
        {audio?.track && <LiveTrack publication={audio} kind="audio" />}
        <View style={styles.nameTag}><Text style={styles.captionText} numberOfLines={1}>{participant.name || participant.identity}{participant === room.localParticipant ? ' (You)' : ''}</Text></View>
        {isSpeaking && <View style={styles.speakingBadge}><View style={styles.speakingBar} /><View style={[styles.speakingBar, styles.speakingBarTall]} /><View style={styles.speakingBar} /></View>}
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
        <TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeText}>{isHost ? 'End room' : 'Leave room'}</Text></TouchableOpacity>
      </View>
      {error ? <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text></View> : null}
      {otherParticipants.length > 0 && (
        <ScrollView ref={participantStripRef} horizontal showsHorizontalScrollIndicator={false} style={styles.participantStrip} contentContainerStyle={styles.participantStripContent}>
          {otherParticipants.map((participant) => renderParticipant(participant))}
        </ScrollView>
      )}
      <View style={styles.stage}>
        {hostParticipant ? renderParticipant(hostParticipant, true) : <ActivityIndicator color="#86efac" style={styles.loader} />}
      </View>
      {(isReconnecting || !isNetworkOnline || connectionEnded) && (
        <View style={styles.reconnectionOverlay}>
          {!isNetworkOnline && <Text style={styles.reconnectionOffline}>You’re offline</Text>}
          {connectionEnded ? <Text style={styles.reconnectionTitle}>Connection ended</Text> : <Text style={styles.reconnectionTitle}>Connection lost</Text>}
          {!connectionEnded && <><ActivityIndicator color="#8ce7bd" size="large" /><Text style={styles.reconnectionMessage}>Reconnecting…</Text></>}
          {connectionEnded && <TouchableOpacity style={styles.reconnectionExit} onPress={onClose}><Text style={styles.reconnectionExitText}>Exit live</Text></TouchableOpacity>}
        </View>
      )}
      {isHost ? (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.control, muted && styles.controlActive]} onPress={() => void toggleMicrophone()}><View style={styles.controlIconWrap}>{muted ? <MicOffIcon color="#ffb2b7" size={22} /> : <MicIcon color="#e8f1ec" size={22} />}</View><Text style={styles.controlText}>{muted ? 'Unmute' : 'Mute'}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.control, cameraOff && styles.controlActive]} onPress={() => void toggleCamera()}><View style={styles.controlIconWrap}>{cameraOff ? <CameraOffIcon color="#ffb2b7" size={22} /> : <CameraIcon color="#e8f1ec" size={22} />}</View><Text style={styles.controlText}>{cameraOff ? 'Start camera' : 'Stop camera'}</Text></TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#0b1110', padding: 16, minHeight: 360, borderRadius: 20, borderWidth: 1, borderColor: '#263431' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 },
  roomIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#351d22', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fb6472' },
  liveText: { color: '#ff9aa3', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  offlineBadge: { backgroundColor: '#422b16', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  offlineText: { color: '#fcd38d', fontSize: 11, fontWeight: '800' },
  subtitle: { color: '#a5b4af', fontSize: 12 },
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: '#131d1a', borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#55d6a0' },
  status: { color: '#b6c8c1', textAlign: 'center', fontSize: 12 },
  closeButton: { backgroundColor: '#a93643', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  closeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  reconnectionOverlay: { ...StyleSheet.absoluteFillObject, top: 48, zIndex: 5, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: 'rgba(4, 12, 10, 0.82)' },
  reconnectionOffline: { position: 'absolute', top: 12, alignSelf: 'center', color: '#fcd38d', fontWeight: '800', fontSize: 12 },
  reconnectionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  reconnectionMessage: { color: '#d1fae5', fontSize: 14, fontWeight: '700' },
  reconnectionExit: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: '#a93643' },
  reconnectionExitText: { color: '#ffffff', fontWeight: '800' },
  participantStrip: { flexGrow: 0, flexShrink: 0, height: 94, marginBottom: 10 },
  participantStripContent: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  stage: { flex: 1, minHeight: 0 },
  tile: { overflow: 'hidden', backgroundColor: '#182522', borderWidth: 1, borderColor: '#33443f' },
  participantTile: { width: 94, height: 94, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  speakingTile: { borderColor: '#57e5a5', shadowColor: '#57e5a5', shadowOpacity: 0.65, shadowRadius: 10, elevation: 8 },
  featuredTile: { width: '100%', height: '100%', borderRadius: 16 },
  noVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#162522' },
  avatarCover: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#14532d' },
  avatarInitial: { color: '#e8fff4', fontSize: 34, fontWeight: '800' },
  nameTag: { position: 'absolute', left: 5, top: 5, maxWidth: '86%', backgroundColor: 'rgba(3, 12, 9, 0.78)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 },
  captionText: { color: '#fff', fontWeight: '700', fontSize: 9, flexShrink: 1 },
  speakingBadge: { position: 'absolute', right: 5, bottom: 5, flexDirection: 'row', alignItems: 'center', gap: 2, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: '#0b241a' },
  speakingBar: { width: 2, height: 5, borderRadius: 1, backgroundColor: '#57e5a5' },
  speakingBarTall: { height: 9 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 14 },
  control: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1c2925', borderWidth: 1, borderColor: '#34443e', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  controlActive: { backgroundColor: '#672b33', borderColor: '#9a414a' },
  holdControl: { minWidth: 145 },
  holdControlActive: { backgroundColor: '#74e2b1', borderColor: '#74e2b1' },
  controlIconWrap: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  controlText: { color: '#f4f7f5', fontWeight: '700', fontSize: 13 },
  holdControlText: { color: '#071b16' },
  loader: { flex: 1 },
  errorBar: { backgroundColor: '#381d22', borderRadius: 10, marginBottom: 10 },
  errorText: { color: '#ffc3c8', textAlign: 'center', padding: 10, fontSize: 12 }
});
