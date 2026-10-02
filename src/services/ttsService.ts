import { Platform } from 'react-native';

let ExpoSpeech: any = null;
try {
  ExpoSpeech = require('expo-speech');
} catch (e) {
  ExpoSpeech = null;
}

export interface VoiceOption {
  id: string;
  name: string;
  language?: string;
  quality?: string;
}

export interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  activeText?: string;
  voices: VoiceOption[];
  selectedVoiceId: string | null;
}

type TTSListener = (state: TTSState) => void;

class TTSService {
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private activeText: string = '';
  private voices: VoiceOption[] = [];
  private selectedVoiceId: string | null = null;
  private listeners: Set<TTSListener> = new Set();

  constructor() {
    void this.loadVoices();
  }

  public async loadVoices(): Promise<VoiceOption[]> {
    try {
      // 1. Mobile Native (Android / iOS) via expo-speech
      if (ExpoSpeech && Platform.OS !== 'web') {
        if (typeof ExpoSpeech.getAvailableVoicesAsync === 'function') {
          const rawVoices = await ExpoSpeech.getAvailableVoicesAsync();
          if (Array.isArray(rawVoices) && rawVoices.length > 0) {
            this.voices = rawVoices.map((v: any) => ({
              id: v.identifier || v.name,
              name: v.name || v.identifier || 'Default Voice',
              language: v.language || 'en',
              quality: v.quality
            }));

            if (!this.selectedVoiceId) {
              const preferredGoogleUk = this.voices.find(
                (v) =>
                  v.name.toLowerCase().includes('google uk english female') ||
                  (v.language?.toLowerCase() === 'en-gb' && v.name.toLowerCase().includes('female'))
              );
              const pref = this.voices.find(
                (v) =>
                  (v.language?.toLowerCase().includes('en') || v.name.toLowerCase().includes('en')) &&
                  (v.quality === 'Enhanced' || v.name.includes('Google') || v.name.includes('Natural'))
              );
              const anyEn = this.voices.find((v) => v.language?.toLowerCase().includes('en'));
              if (preferredGoogleUk) this.selectedVoiceId = preferredGoogleUk.id;
              else if (pref) this.selectedVoiceId = pref.id;
              else if (anyEn) this.selectedVoiceId = anyEn.id;
              else if (this.voices[0]) this.selectedVoiceId = this.voices[0].id;
            }

            this.notify();
            return this.voices;
          }
        }
      }

      // 2. Web & Browser Fallback via Web Speech API
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const fetchWebVoices = () => {
          const webVoices = window.speechSynthesis.getVoices();
          if (Array.isArray(webVoices) && webVoices.length > 0) {
            this.voices = webVoices.map((v) => ({
              id: v.voiceURI || v.name,
              name: v.name,
              language: v.lang
            }));

            if (!this.selectedVoiceId) {
              const preferredGoogleUk = this.voices.find(
                (v) =>
                  v.name.toLowerCase().includes('google uk english female') ||
                  (v.language?.toLowerCase() === 'en-gb' && v.name.toLowerCase().includes('female'))
              );
              const pref = this.voices.find(
                (v) =>
                  (v.language?.toLowerCase().startsWith('en') || v.name.includes('English')) &&
                  (v.name.includes('Google') ||
                    v.name.includes('Natural') ||
                    v.name.includes('Online') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Alex'))
              );
              const anyEn = this.voices.find((v) => v.language?.toLowerCase().startsWith('en'));
              if (preferredGoogleUk) this.selectedVoiceId = preferredGoogleUk.id;
              else if (pref) this.selectedVoiceId = pref.id;
              else if (anyEn) this.selectedVoiceId = anyEn.id;
              else if (this.voices[0]) this.selectedVoiceId = this.voices[0].id;
            }

            this.notify();
          }
        };

        fetchWebVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = fetchWebVoices;
        }
      }
    } catch (e) {
      console.warn('[TTS] Error loading voices:', e);
    }
    return this.voices;
  }

  public setVoice(voiceId: string): void {
    this.selectedVoiceId = voiceId;
    this.notify();

    if (this.isSpeaking && this.activeText) {
      const currentText = this.activeText;
      this.stop();
      setTimeout(() => {
        void this.speak(currentText);
      }, 150);
    }
  }

  public subscribe(listener: TTSListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): TTSState {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      activeText: this.activeText,
      voices: this.voices,
      selectedVoiceId: this.selectedVoiceId
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public async speak(text: string): Promise<void> {
    this.stop();
    const cleanText = text?.trim();
    if (!cleanText) return;

    this.activeText = cleanText;

    // 1. Mobile Native (iOS / Android) via expo-speech
    if (ExpoSpeech && Platform.OS !== 'web') {
      try {
        this.isSpeaking = true;
        this.isPaused = false;
        this.notify();

        const options: any = {
          language: this.voices.find((v) => v.id === this.selectedVoiceId)?.language || 'en-US',
          pitch: 1.0,
          rate: 0.95,
          onStart: () => {
            this.isSpeaking = true;
            this.isPaused = false;
            this.notify();
          },
          onDone: () => {
            this.isSpeaking = false;
            this.isPaused = false;
            this.notify();
          },
          onStopped: () => {
            this.isSpeaking = false;
            this.isPaused = false;
            this.notify();
          },
          onError: () => {
            this.isSpeaking = false;
            this.isPaused = false;
            this.notify();
          }
        };

        if (this.selectedVoiceId) {
          options.voice = this.selectedVoiceId;
        }

        await ExpoSpeech.speak(cleanText, options);
        return;
      } catch (e) {
        console.warn('[TTS] Native speech error:', e);
      }
    }

    // 2. Web & Browser Fallback via Web Speech API (window.speechSynthesis)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          let chosenVoice = null;
          if (this.selectedVoiceId) {
            chosenVoice = voices.find((v) => v.voiceURI === this.selectedVoiceId || v.name === this.selectedVoiceId);
          }
          if (!chosenVoice) {
            chosenVoice = voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.includes('Google') ||
                  v.name.includes('Natural') ||
                  v.name.includes('Android') ||
                  v.name.includes('Samantha') ||
                  v.name.includes('Alex'))
            );
          }
          if (chosenVoice) {
            utterance.voice = chosenVoice;
          }
        }

        utterance.onstart = () => {
          this.isSpeaking = true;
          this.isPaused = false;
          this.notify();
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          this.isPaused = false;
          this.notify();
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          this.isPaused = false;
          this.notify();
        };

        window.speechSynthesis.speak(utterance);
        this.isSpeaking = true;
        this.isPaused = false;
        this.notify();
      } catch (err) {
        console.warn('[TTS] Web speech error:', err);
      }
    }
  }

  /** Speak one chunk and resolve when the native/browser engine finishes it. */
  public speakAndWait(text: string): Promise<void> {
    const cleanText = text?.trim();
    if (!cleanText) return Promise.resolve();

    return new Promise((resolve) => {
      let started = false;
      let settled = false;
      const unsubscribe = this.subscribe((state) => {
        if (state.isSpeaking) started = true;
        if (started && !state.isSpeaking && !settled) {
          settled = true;
          unsubscribe();
          resolve();
        }
      });

      void this.speak(cleanText);

      // If no speech engine is available, do not leave the chunk queue waiting forever.
      setTimeout(() => {
        if (!started && !settled) {
          settled = true;
          unsubscribe();
          resolve();
        }
      }, 1500);
    });
  }

  public stop(): void {
    if (ExpoSpeech && Platform.OS !== 'web') {
      try {
        ExpoSpeech.stop();
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this.isSpeaking = false;
    this.isPaused = false;
    this.activeText = '';
    this.notify();
  }

  public toggle(text: string): void {
    if (this.isSpeaking) {
      this.stop();
    } else {
      void this.speak(text);
    }
  }
}

export const ttsService = new TTSService();

