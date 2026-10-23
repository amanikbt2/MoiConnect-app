import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Participant, Room, RoomEvent, Track, TrackPublication } from 'livekit-client';
import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from './Icons';

interface CommunityLiveRoomProps {
  serverUrl: string;
  token: string;
  isHost: boolean;
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

export function CommunityLiveRoom({ serverUrl, token, isHost, onClose, onReady }: CommunityLiveRoomProps) {
  const room = useMemo(() => new Room({ adaptiveStream: true, dynacast: true }), []);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [muted, setMuted] = useState(!isHost);
  const [cameraOff, setCameraOff] = useState(!isHost);
  const [status, setStatus] = useState('Connecting to live room…');
  const [error, setError] = useState('');
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
      .on(RoomEvent.LocalTrackPublished, refreshParticipants)
      .on(RoomEvent.LocalTrackUnpublished, refreshParticipants);
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

  const renderParticipant = (participant: Participant, index: number) => {
    const video = participant.getTrackPublication(Track.Source.Camera);
    const audio = participant.getTrackPublication(Track.Source.Microphone);
    return (
      <View key={participant.identity} style={[styles.tile, index === 0 && styles.primaryTile]}>
        {video?.track ? <LiveTrack publication={video} kind="video" mirror={participant === room.localParticipant} /> : (
          <View style={styles.noVideo}><Text style={styles.noVideoIcon}>●</Text><Text style={styles.name}>{participant.name || participant.identity}</Text><Text style={styles.audioLabel}>Audio / chat</Text></View>
        )}
        {audio?.track && <LiveTrack publication={audio} kind="audio" />}
        <View style={styles.caption}><Text style={styles.captionText} numberOfLines={2}>{participant.name || participant.identity}{participant === room.localParticipant ? ' (You)' : ''}</Text></View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.roomIdentity}>
          <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
          <Text style={styles.subtitle}>{participants.length} participant{participants.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeText}>{isHost ? 'End room' : 'Leave room'}</Text></TouchableOpacity>
      </View>
      {error ? <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text></View> : null}
      {participants.length === 0 ? <ActivityIndicator color="#86efac" style={styles.loader} /> : <View style={styles.grid}>{participants.map(renderParticipant)}</View>}
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
  subtitle: { color: '#a5b4af', fontSize: 12 },
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: '#131d1a', borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#55d6a0' },
  status: { color: '#b6c8c1', textAlign: 'center', fontSize: 12 },
  closeButton: { backgroundColor: '#a93643', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  closeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignContent: 'flex-start' },
  tile: { width: '48%', height: 176, borderRadius: 16, overflow: 'hidden', backgroundColor: '#182522', borderWidth: 1, borderColor: '#33443f' },
  primaryTile: { width: '100%', height: 250 },
  noVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#162522' },
  noVideoIcon: { color: '#74e2b1', fontSize: 24, backgroundColor: '#203c32', overflow: 'hidden', borderRadius: 32, padding: 12 },
  audioLabel: { color: '#91a79e', fontSize: 11, marginTop: 4 },
  name: { color: '#f2f7f4', marginTop: 8, fontWeight: '700' },
  caption: { position: 'absolute', left: 10, top: 10, alignSelf: 'flex-start', maxWidth: '82%', backgroundColor: '#07100dcc', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  captionText: { color: '#fff', fontWeight: '600', fontSize: 12, flexShrink: 1 },
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
