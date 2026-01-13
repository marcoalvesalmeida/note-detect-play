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

// All notes from C3 to C6 with their vertical positions
const NOTE_POSITIONS: Record<string, number> = {
  'C3': 13, 'D3': 12.5, 'E3': 12, 'F3': 11.5, 'G3': 11, 'A3': 10.5, 'B3': 10,
  'C4': 9.5, 'D4': 9, 'E4': 8.5, 'F4': 8, 'G4': 7.5, 'A4': 7, 'B4': 6.5,
  'C5': 6, 'D5': 5.5, 'E5': 5, 'F5': 4.5, 'G5': 4, 'A5': 3.5, 'B5': 3,
  'C6': 2.5,
};

export function SheetMusic({
  notes,
  currentBeat,
  noteStatuses,
  clef = 'treble',
}: SheetMusicProps) {
  const staffHeight = 120;
  const lineSpacing = staffHeight / 6;
  const noteSpacing = 60;

  const getNoteY = (note: string, octave: number) => {
    const key = `${note.replace('#', '')}${octave}`;
    const position = NOTE_POSITIONS[key] ?? 7;
    return position * (lineSpacing / 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct':
        return 'text-note-correct fill-note-correct';
      case 'wrong':
        return 'text-note-wrong fill-note-wrong';
      case 'close':
        return 'text-note-close fill-note-close';
      case 'missed':
        return 'text-destructive fill-destructive opacity-50';
      default:
        return 'text-foreground fill-foreground';
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
              <motion.div
                key={i}
                className="relative flex-shrink-0"
                style={{
                  width: noteSpacing,
                  height: staffHeight,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
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
                <motion.div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 w-5 h-4 rounded-full border-2',
                    getStatusColor(status),
                    isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                    note.duration >= 2 ? 'bg-transparent' : '',
                  )}
                  style={{ top: y }}
                  animate={
                    isCurrent
                      ? { scale: [1, 1.1, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
                >
                  {/* Sharp symbol */}
                  {isSharp && (
                    <span className="absolute -left-4 -top-1 text-sm">♯</span>
                  )}

                  {/* Note stem */}
                  {note.duration <= 2 && (
                    <div
                      className={cn(
                        'absolute w-0.5 h-8',
                        y < staffHeight / 2 ? 'left-0 top-2' : 'right-0 -top-8',
                        getStatusColor(status).includes('fill') ? 'bg-current' : 'bg-foreground'
                      )}
                    />
                  )}
                </motion.div>

                {/* Note name label */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap"
                  style={{ top: staffHeight + 5 }}
                >
                  {getNoteNamePt(note.note)}{note.octave}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
