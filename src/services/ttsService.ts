import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
  speechRate: number;
  speechPitch: number;
}

type TTSListener = (state: TTSState) => void;

class TTSService {
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private activeText: string = '';
  private voices: VoiceOption[] = [];
  private selectedVoiceId: string | null = null;
  private speechRate = 0.9;
  private speechPitch = 1.08;
  private listeners: Set<TTSListener> = new Set();

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const stored = Platform.OS === 'web'
        ? (typeof localStorage !== 'undefined' ? localStorage.getItem('moi_tts_preferences') : null)
        : await SecureStore.getItemAsync('moi_tts_preferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        if (typeof preferences.voiceId === 'string') this.selectedVoiceId = preferences.voiceId;
        if (Number.isFinite(preferences.speechRate)) this.speechRate = this.clamp(preferences.speechRate, 0.7, 1.3);
        if (Number.isFinite(preferences.speechPitch)) this.speechPitch = this.clamp(preferences.speechPitch, 0.8, 1.3);
      }
    } catch (error) {
      console.warn('[TTS] Could not load speech preferences:', error);
    }
    await this.loadVoices();
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private async savePreferences(): Promise<void> {
    try {
      const preferences = JSON.stringify({
        voiceId: this.selectedVoiceId,
        speechRate: this.speechRate,
        speechPitch: this.speechPitch
      });
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem('moi_tts_preferences', preferences);
      } else {
        await SecureStore.setItemAsync('moi_tts_preferences', preferences);
      }
    } catch (error) {
      console.warn('[TTS] Could not save speech preferences:', error);
    }
  }

  private choosePreferredVoice(): VoiceOption | undefined {
    const isEnglish = (voice: VoiceOption) => /(^|-)en([_-]|$)/i.test(voice.language || '') || /english/i.test(voice.name);
    const isBritish = (voice: VoiceOption) => /en[-_]gb/i.test(voice.language || '') || /\b(uk|british)\b/i.test(voice.name);
    const googleFemale = this.voices.find((voice) => /google.*(uk|united kingdom|en[-_]gb).*female|google uk english female/i.test(`${voice.name} ${voice.language}`));
    const britishFemale = this.voices.find((voice) => isBritish(voice) && /female|woman/i.test(voice.name));
    const britishNatural = this.voices.find((voice) => isBritish(voice) && /google|natural|enhanced|network/i.test(`${voice.name} ${voice.quality || ''}`));
    return googleFemale || britishFemale || britishNatural || this.voices.find(isBritish) ||
      this.voices.find((voice) => isEnglish(voice) && /google|natural|enhanced/i.test(`${voice.name} ${voice.quality || ''}`)) ||
      this.voices.find(isEnglish) || this.voices[0];
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

            if (!this.voices.some((voice) => voice.id === this.selectedVoiceId)) {
              this.selectedVoiceId = this.choosePreferredVoice()?.id || null;
              void this.savePreferences();
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

            if (!this.voices.some((voice) => voice.id === this.selectedVoiceId)) {
              this.selectedVoiceId = this.choosePreferredVoice()?.id || null;
              void this.savePreferences();
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
    void this.savePreferences();
    this.notify();

    if (this.isSpeaking && this.activeText) {
      const currentText = this.activeText;
      this.stop();
      setTimeout(() => {
        void this.speak(currentText);
      }, 150);
    }
  }

  public setSpeechRate(rate: number): void {
    this.speechRate = this.clamp(rate, 0.7, 1.3);
    void this.savePreferences();
    this.notify();
  }

  public setSpeechPitch(pitch: number): void {
    this.speechPitch = this.clamp(pitch, 0.8, 1.3);
    void this.savePreferences();
    this.notify();
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
      selectedVoiceId: this.selectedVoiceId,
      speechRate: this.speechRate,
      speechPitch: this.speechPitch
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
          language: this.voices.find((v) => v.id === this.selectedVoiceId)?.language || 'en-GB',
          pitch: this.speechPitch,
          rate: this.speechRate,
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
        utterance.rate = this.speechRate;
        utterance.pitch = this.speechPitch;
        utterance.lang = this.voices.find((v) => v.id === this.selectedVoiceId)?.language || 'en-GB';

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

  public pause(): void {
    if (!this.isSpeaking || this.isPaused) return;
    try {
      if (ExpoSpeech && Platform.OS !== 'web' && typeof ExpoSpeech.pause === 'function') {
        ExpoSpeech.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      this.isPaused = true;
      this.notify();
    } catch (error) {
      console.warn('[TTS] Could not pause speech:', error);
    }
  }

  public resume(): void {
    if (!this.isSpeaking || !this.isPaused) return;
    try {
      if (ExpoSpeech && Platform.OS !== 'web' && typeof ExpoSpeech.resume === 'function') {
        ExpoSpeech.resume();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      this.isPaused = false;
      this.notify();
    } catch (error) {
      console.warn('[TTS] Could not resume speech:', error);
    }
  }

  public togglePause(): void {
    if (this.isPaused) this.resume();
    else this.pause();
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

