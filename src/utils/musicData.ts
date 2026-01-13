// Sheet music data structures and sample exercises

export interface Note {
  note: string;
  octave: number;
  duration: number; // in beats
  startBeat: number;
}

export interface Exercise {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  bpm: number;
  timeSignature: [number, number];
  clef: 'treble' | 'bass';
  notes: Note[];
}

export const SAMPLE_EXERCISES: Exercise[] = [
  {
    id: 'do-re-mi',
    title: 'Dó Ré Mi Fá Sol',
    difficulty: 'beginner',
    bpm: 80,
    timeSignature: [4, 4],
    clef: 'treble',
    notes: [
      { note: 'C', octave: 4, duration: 1, startBeat: 0 },
      { note: 'D', octave: 4, duration: 1, startBeat: 1 },
      { note: 'E', octave: 4, duration: 1, startBeat: 2 },
      { note: 'F', octave: 4, duration: 1, startBeat: 3 },
      { note: 'G', octave: 4, duration: 1, startBeat: 4 },
      { note: 'A', octave: 4, duration: 1, startBeat: 5 },
      { note: 'B', octave: 4, duration: 1, startBeat: 6 },
      { note: 'C', octave: 5, duration: 1, startBeat: 7 },
    ],
  },
  {
    id: 'twinkle',
    title: 'Brilha Brilha Estrelinha',
    difficulty: 'beginner',
    bpm: 100,
    timeSignature: [4, 4],
    clef: 'treble',
    notes: [
      { note: 'C', octave: 4, duration: 1, startBeat: 0 },
      { note: 'C', octave: 4, duration: 1, startBeat: 1 },
      { note: 'G', octave: 4, duration: 1, startBeat: 2 },
      { note: 'G', octave: 4, duration: 1, startBeat: 3 },
      { note: 'A', octave: 4, duration: 1, startBeat: 4 },
      { note: 'A', octave: 4, duration: 1, startBeat: 5 },
      { note: 'G', octave: 4, duration: 2, startBeat: 6 },
      { note: 'F', octave: 4, duration: 1, startBeat: 8 },
      { note: 'F', octave: 4, duration: 1, startBeat: 9 },
      { note: 'E', octave: 4, duration: 1, startBeat: 10 },
      { note: 'E', octave: 4, duration: 1, startBeat: 11 },
      { note: 'D', octave: 4, duration: 1, startBeat: 12 },
      { note: 'D', octave: 4, duration: 1, startBeat: 13 },
      { note: 'C', octave: 4, duration: 2, startBeat: 14 },
    ],
  },
  {
    id: 'ode-to-joy',
    title: 'Ode à Alegria',
    difficulty: 'intermediate',
    bpm: 90,
    timeSignature: [4, 4],
    clef: 'treble',
    notes: [
      { note: 'E', octave: 4, duration: 1, startBeat: 0 },
      { note: 'E', octave: 4, duration: 1, startBeat: 1 },
      { note: 'F', octave: 4, duration: 1, startBeat: 2 },
      { note: 'G', octave: 4, duration: 1, startBeat: 3 },
      { note: 'G', octave: 4, duration: 1, startBeat: 4 },
      { note: 'F', octave: 4, duration: 1, startBeat: 5 },
      { note: 'E', octave: 4, duration: 1, startBeat: 6 },
      { note: 'D', octave: 4, duration: 1, startBeat: 7 },
      { note: 'C', octave: 4, duration: 1, startBeat: 8 },
      { note: 'C', octave: 4, duration: 1, startBeat: 9 },
      { note: 'D', octave: 4, duration: 1, startBeat: 10 },
      { note: 'E', octave: 4, duration: 1, startBeat: 11 },
      { note: 'E', octave: 4, duration: 1.5, startBeat: 12 },
      { note: 'D', octave: 4, duration: 0.5, startBeat: 13.5 },
      { note: 'D', octave: 4, duration: 2, startBeat: 14 },
    ],
  },
];

// Piano keyboard layout
export const PIANO_KEYS = [
  { note: 'C', octave: 3, isBlack: false },
  { note: 'C#', octave: 3, isBlack: true },
  { note: 'D', octave: 3, isBlack: false },
  { note: 'D#', octave: 3, isBlack: true },
  { note: 'E', octave: 3, isBlack: false },
  { note: 'F', octave: 3, isBlack: false },
  { note: 'F#', octave: 3, isBlack: true },
  { note: 'G', octave: 3, isBlack: false },
  { note: 'G#', octave: 3, isBlack: true },
  { note: 'A', octave: 3, isBlack: false },
  { note: 'A#', octave: 3, isBlack: true },
  { note: 'B', octave: 3, isBlack: false },
  { note: 'C', octave: 4, isBlack: false },
  { note: 'C#', octave: 4, isBlack: true },
  { note: 'D', octave: 4, isBlack: false },
  { note: 'D#', octave: 4, isBlack: true },
  { note: 'E', octave: 4, isBlack: false },
  { note: 'F', octave: 4, isBlack: false },
  { note: 'F#', octave: 4, isBlack: true },
  { note: 'G', octave: 4, isBlack: false },
  { note: 'G#', octave: 4, isBlack: true },
  { note: 'A', octave: 4, isBlack: false },
  { note: 'A#', octave: 4, isBlack: true },
  { note: 'B', octave: 4, isBlack: false },
  { note: 'C', octave: 5, isBlack: false },
  { note: 'C#', octave: 5, isBlack: true },
  { note: 'D', octave: 5, isBlack: false },
  { note: 'D#', octave: 5, isBlack: true },
  { note: 'E', octave: 5, isBlack: false },
  { note: 'F', octave: 5, isBlack: false },
  { note: 'F#', octave: 5, isBlack: true },
  { note: 'G', octave: 5, isBlack: false },
  { note: 'G#', octave: 5, isBlack: true },
  { note: 'A', octave: 5, isBlack: false },
  { note: 'A#', octave: 5, isBlack: true },
  { note: 'B', octave: 5, isBlack: false },
];

// Map note names to Portuguese
export const NOTE_NAMES_PT: Record<string, string> = {
  'C': 'Dó',
  'D': 'Ré',
  'E': 'Mi',
  'F': 'Fá',
  'G': 'Sol',
  'A': 'Lá',
  'B': 'Si',
  'C#': 'Dó#',
  'D#': 'Ré#',
  'F#': 'Fá#',
  'G#': 'Sol#',
  'A#': 'Lá#',
};

export function getNoteNamePt(note: string): string {
  return NOTE_NAMES_PT[note] || note;
}
