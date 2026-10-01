import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Participant, Room, RoomEvent, Track } from 'livekit-client';

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
  onClose: () => void;
}

export function CommunityLiveRoom({ serverUrl, token, isHost, onClose }: CommunityLiveRoomProps) {
  const room = useMemo(() => new Room({ adaptiveStream: true, dynacast: true }), []);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const refreshParticipants = () => {
      if (!cancelled) setParticipants([room.localParticipant, ...Array.from(room.remoteParticipants.values())]);
    };

    const connect = async () => {
      try {
        if (AudioSession?.startAudioSession) {
          await AudioSession.startAudioSession();
        }
        await room.connect(serverUrl, token);
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
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
      .on(RoomEvent.LocalTrackPublished, refreshParticipants)
      .on(RoomEvent.LocalTrackUnpublished, refreshParticipants);
    void connect();

    return () => {
      cancelled = true;
      room.removeAllListeners();
      room.disconnect();
      if (AudioSession?.stopAudioSession) {
        void AudioSession.stopAudioSession();
      }
    };
  }, [room, serverUrl, token]);

  const toggleMicrophone = async () => {
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  const toggleCamera = async () => {
    const next = !cameraOff;
    await room.localParticipant.setCameraEnabled(!next);
    setCameraOff(next);
  };

  const renderParticipant = (participant: Participant, index: number) => {
    const videoTrack = participant.getTrackPublication(Track.Source.Camera)?.videoTrack;
    return (
      <View key={participant.identity} style={[styles.tile, index === 0 && styles.primaryTile]}>
        {videoTrack && VideoView ? (
          <VideoView videoTrack={videoTrack} style={StyleSheet.absoluteFillObject} objectFit="cover" mirror={participant === room.localParticipant} />
        ) : (
          <View style={styles.noVideo}><Text style={styles.noVideoText}>📷</Text><Text style={styles.name}>{participant.name || participant.identity}</Text></View>
        )}
        <View style={styles.caption}><Text style={styles.captionText} numberOfLines={1}>{participant.name || participant.identity}{participant === room.localParticipant ? ' (You)' : ''}</Text></View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.liveText}>● LIVE</Text><Text style={styles.subtitle}>{participants.length} participant{participants.length === 1 ? '' : 's'}</Text></View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeText}>{isHost ? 'End' : 'Leave'}</Text></TouchableOpacity>
      </View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : participants.length === 0 ? <ActivityIndicator color="#86efac" style={styles.loader} /> : <View style={styles.grid}>{participants.map(renderParticipant)}</View>}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.control, muted && styles.controlActive]} onPress={() => void toggleMicrophone()}><Text style={styles.controlText}>{muted ? '🔇 Unmute' : '🎙 Mute'}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.control, cameraOff && styles.controlActive]} onPress={() => void toggleCamera()}><Text style={styles.controlText}>{cameraOff ? '📷 Start cam' : '📹 Stop cam'}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071b16', padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  liveText: { color: '#f87171', fontWeight: '800', fontSize: 15 },
  subtitle: { color: '#bbf7d0', fontSize: 12, marginTop: 2 },
  closeButton: { backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  closeText: { color: '#fff', fontWeight: '800' },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' },
  tile: { width: '48%', height: 170, borderRadius: 12, overflow: 'hidden', backgroundColor: '#12352b' },
  primaryTile: { width: '100%', height: 245 },
  noVideo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noVideoText: { fontSize: 34 },
  name: { color: '#fff', marginTop: 6, fontWeight: '700' },
  caption: { position: 'absolute', left: 8, right: 8, bottom: 7 },
  captionText: { color: '#fff', fontWeight: '700', textShadowColor: '#000', textShadowRadius: 4 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 12 },
  control: { backgroundColor: '#14532d', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  controlActive: { backgroundColor: '#7f1d1d' },
  controlText: { color: '#fff', fontWeight: '700' },
  loader: { flex: 1 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#fecaca', textAlign: 'center' }
});

