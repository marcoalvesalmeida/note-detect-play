import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Note, getNoteNamePt } from '@/utils/musicData';

interface SheetMusicProps {
  notes: Note[];
  currentBeat: number;
  noteStatuses: Array<'pending' | 'correct' | 'wrong' | 'close' | 'missed'>;
  clef?: 'treble' | 'bass';
}

// Staff line positions for treble clef (from bottom to top: E4, G4, B4, D5, F5)
const TREBLE_LINES = [
  { note: 'E', octave: 4 },
  { note: 'G', octave: 4 },
  { note: 'B', octave: 4 },
  { note: 'D', octave: 5 },
  { note: 'F', octave: 5 },
];

// Vertical positions in diatonic steps from top of staff area.
// Treble staff lines: F5=2, D5=4, B4=6, G4=8, E4=10 (spacing = 2 per line).
// Each diatonic step = 1 position unit = lineSpacing/2 pixels.
const NOTE_POSITIONS: Record<string, number> = {
  'C6': -2, 'B5': -1, 'A5': 0, 'G5': 1, 'F5': 2, 'E5': 3, 'D5': 4,
  'C5': 5, 'B4': 6, 'A4': 7, 'G4': 8, 'F4': 9, 'E4': 10, 'D4': 11,
  'C4': 12, 'B3': 13, 'A3': 14, 'G3': 15, 'F3': 16, 'E3': 17, 'D3': 18, 'C3': 19,
};

export function SheetMusic({
  notes,
  currentBeat,
  noteStatuses,
  clef = 'treble',
}: SheetMusicProps) {
  const staffHeight = 120;
  const lineSpacing = staffHeight / 6;
  const noteSpacing = 72;

  const getNoteY = (note: string, octave: number) => {
    const key = `${note.replace('#', '')}${octave}`;
    const position = NOTE_POSITIONS[key] ?? 8;
    // Center the note head (h-4 = 16px) on the staff line/space
    return 20 + position * (lineSpacing / 2) - 8;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct':
        return 'bg-emerald-500 border-emerald-600';
      case 'wrong':
        return 'bg-red-500 border-red-600';
      case 'close':
        return 'bg-amber-500 border-amber-600';
      case 'missed':
        return 'bg-red-400 border-red-500 opacity-60';
      default:
        return 'bg-neutral-900 border-neutral-900 dark:bg-neutral-100 dark:border-neutral-100';
    }
  };

  const getStemColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-emerald-600';
      case 'wrong': return 'bg-red-600';
      case 'close': return 'bg-amber-600';
      default: return 'bg-neutral-900 dark:bg-neutral-100';
    }
  };

  const visibleNotes = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(currentBeat) - 2);
    const endIndex = Math.min(notes.length, startIndex + 8);
    return notes.slice(startIndex, endIndex).map((note, i) => ({
      ...note,
      index: startIndex + i,
    }));
  }, [notes, currentBeat]);

  return (
    <div className="w-full overflow-hidden bg-card rounded-xl p-4 border border-border">
      <div className="relative" style={{ height: staffHeight + 40 }}>
        {/* Staff lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Treble clef symbol placeholder */}
          <text
            x="10"
            y={staffHeight / 2 + 10}
            className="fill-foreground text-4xl font-serif"
          >
            𝄞
          </text>

          {/* Staff lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="50"
              y1={20 + i * lineSpacing}
              x2="100%"
              y2={20 + i * lineSpacing}
              className="stroke-border"
              strokeWidth="1"
            />
          ))}

          {/* Current beat indicator */}
          <motion.line
            x1={100}
            y1={10}
            x2={100}
            y2={staffHeight}
            className="stroke-primary"
            strokeWidth="2"
            strokeDasharray="4 2"
            initial={false}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </svg>

        {/* Notes */}
        <div
          className="absolute left-24 top-0 flex items-start transition-transform duration-300"
          style={{
            transform: `translateX(-${Math.max(0, (currentBeat - 2)) * noteSpacing}px)`,
          }}
        >
          {notes.map((note, i) => {
            const status = noteStatuses[i];
            const y = getNoteY(note.note, note.octave);
            const isSharp = note.note.includes('#');
            const isCurrent = i === Math.floor(currentBeat);

            return (
              <div
                key={i}
                className="relative flex-shrink-0"
                style={{
                  width: noteSpacing,
                  height: staffHeight,
                }}
              >
                {/* Ledger lines if needed */}
                {y > staffHeight - 10 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1="10"
                      y1={staffHeight - 10}
                      x2="50"
                      y2={staffHeight - 10}
                      className="stroke-border"
                      strokeWidth="1"
                    />
                  </svg>
                )}

                {/* Note head */}
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 w-5 h-4 rounded-full border-2 transition-colors duration-150',
                    getStatusColor(status),
                    isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-white',
                  )}
                  style={{ top: y }}
                >
                  {/* Sharp symbol */}
                  {isSharp && (
                    <span className="absolute -left-4 -top-1 text-sm text-neutral-900 dark:text-neutral-100">♯</span>
                  )}

                  {/* Note stem */}
                  {note.duration <= 2 && (
                    <div
                      className={cn(
                        'absolute w-0.5 h-8',
                        y < staffHeight / 2 ? 'left-0 top-2' : 'right-0 -top-8',
                        getStemColor(status)
                      )}
                    />
                  )}
                </div>

                {/* Note name label */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap"
                  style={{ top: staffHeight + 5 }}
                >
                  {getNoteNamePt(note.note)}{note.octave}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
