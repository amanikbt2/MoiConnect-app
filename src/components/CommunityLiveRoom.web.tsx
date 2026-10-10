import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommunityLiveRoomProps {
  serverUrl: string;
  token: string;
  isHost: boolean;
  onClose: () => void;
}

export function CommunityLiveRoom({ isHost, onClose }: CommunityLiveRoomProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live rooms are available in the Android app.</Text>
      <Text style={styles.subtitle}>Open MConnect on Android to join this broadcast.</Text>
      <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{isHost ? 'End Live' : 'Close'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#071b16'
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    color: '#bbf7d0',
    marginTop: 8,
    textAlign: 'center'
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#15803d'
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800'
  }
});
