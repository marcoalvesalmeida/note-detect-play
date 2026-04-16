import { useState, useCallback, useRef, useEffect } from 'react';
import { detectPitch, PitchResult } from '@/utils/pitchDetection';

interface AudioCaptureState {
  isListening: boolean;
  hasPermission: boolean | null;
  error: string | null;
  currentPitch: PitchResult | null;
}

export function useAudioCapture() {
  const [state, setState] = useState<AudioCaptureState>({
    isListening: false,
    hasPermission: null,
    error: null,
    currentPitch: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const detectPitchLoop = useCallback(() => {
    if (analyserRef.current && audioContextRef.current) {
      const pitch = detectPitch(analyserRef.current, audioContextRef.current.sampleRate);
      setState(prev => ({ ...prev, currentPitch: pitch }));
    }
    animationFrameRef.current = requestAnimationFrame(detectPitchLoop);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setState(prev => ({
        ...prev,
        isListening: true,
        hasPermission: true,
        error: null,
      }));

      detectPitchLoop();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar microfone';
      setState(prev => ({
        ...prev,
        hasPermission: false,
        error: errorMessage,
      }));
    }
  }, [detectPitchLoop]);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    setState(prev => ({
      ...prev,
      isListening: false,
      currentPitch: null,
    }));
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
  };
}
