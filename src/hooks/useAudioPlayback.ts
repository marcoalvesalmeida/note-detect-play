import { useRef, useCallback } from 'react';

// Frequency mapping for notes (A4 = 440Hz as reference)
const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88,
};

function getFrequency(note: string, octave: number): number {
  const baseFreq = NOTE_FREQUENCIES[note];
  if (!baseFreq) return 440;
  // Adjust for octave (octave 4 is the base)
  return baseFreq * Math.pow(2, octave - 4);
}

export function useAudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playClickSound = useCallback(async () => {
    const ctx = getAudioContext();
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Short click sound - woodblock-like
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, [getAudioContext]);

  const playCountdown = useCallback(async (beats: number = 4, bpm: number = 100): Promise<void> => {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const msPerBeat = (60 / bpm) * 1000;

    return new Promise((resolve) => {
      let count = 0;
      const interval = setInterval(() => {
        playClickSound();
        count++;
        if (count >= beats) {
          clearInterval(interval);
          resolve();
        }
      }, msPerBeat);
    });
  }, [getAudioContext, playClickSound]);

  const playNote = useCallback((note: string, octave: number, durationMs: number) => {
    const ctx = getAudioContext();
    
    // Stop any active oscillator
    if (activeOscillatorRef.current) {
      try {
        activeOscillatorRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Piano-like sound using sine wave with gentle envelope
    osc.type = 'sine';
    const freq = getFrequency(note, octave);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // ADSR-like envelope
    const attackTime = 0.02;
    const decayTime = 0.1;
    const sustainLevel = 0.2;
    const releaseTime = 0.3;
    const totalDuration = durationMs / 1000;
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + attackTime);
    gain.gain.linearRampToValueAtTime(sustainLevel, ctx.currentTime + attackTime + decayTime);
    gain.gain.setValueAtTime(sustainLevel, ctx.currentTime + totalDuration - releaseTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + totalDuration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + totalDuration + 0.05);
    
    activeOscillatorRef.current = osc;
  }, [getAudioContext]);

  const playMetronome = useCallback(() => {
    const ctx = getAudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [getAudioContext]);

  const stopPlayback = useCallback(() => {
    if (activeOscillatorRef.current) {
      try {
        activeOscillatorRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      activeOscillatorRef.current = null;
    }
  }, []);

  return {
    playClickSound,
    playCountdown,
    playNote,
    playMetronome,
    stopPlayback,
  };
}
