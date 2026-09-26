import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

type IceMessageButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type IceMessage = {
  title: string;
  message?: string;
  buttons?: IceMessageButton[];
};

type Listener = (message: IceMessage) => void;

let listener: Listener | null = null;

export const showIceMessage = (
  title: string,
  message?: string,
  buttons?: IceMessageButton[]
) => {
  listener?.({ title, message, buttons });
};

export const IceMessageHost: React.FC = () => {
  const [message, setMessage] = useState<IceMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listener = (nextMessage) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(nextMessage);
      if (!nextMessage.buttons?.length) {
        timeoutRef.current = setTimeout(() => setMessage(null), 3800);
      }
    };

    return () => {
      listener = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!message) return null;

  const close = () => setMessage(null);
  const buttons = message.buttons?.length
    ? message.buttons
    : [{ text: 'OK', style: 'default' as const }];

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iceOrb}><Text style={styles.iceOrbText}>✦</Text></View>
          <Text style={styles.title}>{message.title}</Text>
          {!!message.message && <Text style={styles.message}>{message.message}</Text>}
          <View style={styles.actions}>
            {buttons.map((button, index) => (
              <Pressable
                key={`${button.text}-${index}`}
                style={[styles.button, button.style === 'cancel' && styles.cancelButton, button.style === 'destructive' && styles.destructiveButton]}
                onPress={() => {
                  close();
                  button.onPress?.();
                }}
              >
                <Text style={[styles.buttonText, button.style === 'cancel' && styles.cancelText, button.style === 'destructive' && styles.destructiveText]}>
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 18,
    paddingBottom: 34,
    backgroundColor: 'rgba(15, 23, 42, 0.22)'
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#f8fdff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    shadowColor: '#0c4a6e',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12
  },
  iceOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dff6ff',
    borderWidth: 1,
    borderColor: '#7dd3fc',
    marginBottom: 12
  },
  iceOrbText: { color: '#0284c7', fontSize: 22, fontWeight: '800' },
  title: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  message: { color: '#475569', fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 18, flexWrap: 'wrap' },
  button: { backgroundColor: '#0284c7', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  cancelButton: { backgroundColor: '#e0f2fe' },
  destructiveButton: { backgroundColor: '#fee2e2' },
  buttonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  cancelText: { color: '#0369a1' },
  destructiveText: { color: '#b91c1c' }
});