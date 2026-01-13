// Pitch detection using autocorrelation algorithm
export interface PitchResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  confidence: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQUENCY = 440;
const A4_NOTE_NUMBER = 69;

export function frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
  if (frequency <= 0) {
    return { note: '', octave: 0, cents: 0 };
  }

  const noteNumber = 12 * Math.log2(frequency / A4_FREQUENCY) + A4_NOTE_NUMBER;
  const roundedNote = Math.round(noteNumber);
  const cents = Math.round((noteNumber - roundedNote) * 100);
  
  const octave = Math.floor(roundedNote / 12) - 1;
  const noteIndex = ((roundedNote % 12) + 12) % 12;
  const note = NOTE_NAMES[noteIndex];

  return { note, octave, cents };
}

export function noteToFrequency(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 0;
  
  const noteNumber = (octave + 1) * 12 + noteIndex;
  return A4_FREQUENCY * Math.pow(2, (noteNumber - A4_NOTE_NUMBER) / 12);
}

export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Not enough signal
  if (rms < 0.01) return -1;

  // Trim the buffer to remove silence
  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmedBuffer = buffer.slice(r1, r2);
  const trimmedSize = trimmedBuffer.length;

  // Autocorrelation
  const c = new Float32Array(trimmedSize);
  for (let i = 0; i < trimmedSize; i++) {
    for (let j = 0; j < trimmedSize - i; j++) {
      c[i] += trimmedBuffer[j] * trimmedBuffer[j + i];
    }
  }

  // Find the first peak
  let d = 0;
  while (c[d] > c[d + 1] && d < trimmedSize - 1) d++;

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < trimmedSize; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }

  let T0 = maxPos;

  // Parabolic interpolation
  const x1 = c[T0 - 1] || 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] || 0;

  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export function detectPitch(analyser: AnalyserNode, sampleRate: number): PitchResult | null {
  const bufferLength = analyser.fftSize;
  const buffer = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(buffer);

  const frequency = autoCorrelate(buffer, sampleRate);

  if (frequency === -1 || frequency < 20 || frequency > 5000) {
    return null;
  }

  const { note, octave, cents } = frequencyToNote(frequency);
  
  // Calculate confidence based on signal clarity
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  const confidence = Math.min(rms * 10, 1);

  return {
    frequency,
    note,
    octave,
    cents,
    confidence,
  };
}

export function compareNotes(
  detected: { note: string; octave: number } | null,
  expected: { note: string; octave: number },
  toleranceCents: number = 50
): 'correct' | 'close' | 'wrong' | 'none' {
  if (!detected) return 'none';

  if (detected.note === expected.note && detected.octave === expected.octave) {
    return 'correct';
  }

  // Check if it's a close note (same note, different octave or adjacent semitone)
  const detectedIndex = NOTE_NAMES.indexOf(detected.note);
  const expectedIndex = NOTE_NAMES.indexOf(expected.note);
  
  if (Math.abs(detectedIndex - expectedIndex) <= 1 || Math.abs(detectedIndex - expectedIndex) >= 11) {
    return 'close';
  }

  return 'wrong';
}

export function getNoteName(note: string, octave: number): string {
  return `${note}${octave}`;
}
