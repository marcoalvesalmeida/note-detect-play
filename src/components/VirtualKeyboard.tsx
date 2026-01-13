import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PIANO_KEYS, getNoteNamePt } from '@/utils/musicData';

interface VirtualKeyboardProps {
  activeNote?: { note: string; octave: number } | null;
  highlightedNotes?: Array<{ note: string; octave: number; status: 'pending' | 'correct' | 'wrong' | 'close' }>;
  showLabels?: boolean;
  compact?: boolean;
}

export function VirtualKeyboard({
  activeNote,
  highlightedNotes = [],
  showLabels = true,
  compact = false,
}: VirtualKeyboardProps) {
  const whiteKeys = useMemo(() => PIANO_KEYS.filter(k => !k.isBlack), []);
  const blackKeys = useMemo(() => PIANO_KEYS.filter(k => k.isBlack), []);

  const getKeyStatus = (note: string, octave: number) => {
    const isActive = activeNote?.note === note && activeNote?.octave === octave;
    const highlighted = highlightedNotes.find(h => h.note === note && h.octave === octave);
    return { isActive, status: highlighted?.status };
  };

  const getBlackKeyPosition = (note: string, octave: number) => {
    const whiteIndex = whiteKeys.findIndex(
      (k, i, arr) =>
        (k.note === 'C' && note === 'C#' && k.octave === octave) ||
        (k.note === 'D' && note === 'D#' && k.octave === octave) ||
        (k.note === 'F' && note === 'F#' && k.octave === octave) ||
        (k.note === 'G' && note === 'G#' && k.octave === octave) ||
        (k.note === 'A' && note === 'A#' && k.octave === octave)
    );
    
    // Calculate position based on which white key it's next to
    let pos = 0;
    for (let i = 0; i < whiteKeys.length; i++) {
      const wk = whiteKeys[i];
      if (
        (wk.note === 'C' && note === 'C#' && wk.octave === octave) ||
        (wk.note === 'D' && note === 'D#' && wk.octave === octave) ||
        (wk.note === 'F' && note === 'F#' && wk.octave === octave) ||
        (wk.note === 'G' && note === 'G#' && wk.octave === octave) ||
        (wk.note === 'A' && note === 'A#' && wk.octave === octave)
      ) {
        pos = i;
        break;
      }
    }
    return pos;
  };

  const keyWidth = compact ? 28 : 40;
  const keyHeight = compact ? 100 : 150;
  const blackKeyWidth = compact ? 20 : 28;
  const blackKeyHeight = compact ? 60 : 90;

  return (
    <div className="relative overflow-x-auto pb-4">
      <div 
        className="relative mx-auto"
        style={{ 
          width: whiteKeys.length * keyWidth,
          height: keyHeight + 10,
        }}
      >
        {/* White keys */}
        <div className="flex">
          {whiteKeys.map((key, index) => {
            const { isActive, status } = getKeyStatus(key.note, key.octave);
            return (
              <motion.div
                key={`${key.note}${key.octave}`}
                className={cn(
                  'relative flex flex-col justify-end items-center pb-2 cursor-pointer transition-all duration-100',
                  'border-r border-border/30 first:rounded-bl-lg last:rounded-br-lg',
                  isActive && 'piano-key-pressed',
                  !isActive && 'piano-key-white hover:bg-muted',
                  status === 'pending' && 'ring-2 ring-inset ring-note-pending',
                  status === 'correct' && 'bg-note-correct/30 ring-2 ring-inset ring-note-correct',
                  status === 'wrong' && 'bg-note-wrong/30 ring-2 ring-inset ring-note-wrong',
                  status === 'close' && 'bg-note-close/30 ring-2 ring-inset ring-note-close',
                )}
                style={{ 
                  width: keyWidth,
                  height: keyHeight,
                }}
                animate={isActive ? { scale: 0.98 } : { scale: 1 }}
                transition={{ duration: 0.1 }}
              >
                {showLabels && (
                  <span className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                    {getNoteNamePt(key.note)}
                    <sub className="text-[10px]">{key.octave}</sub>
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Black keys */}
        {blackKeys.map((key) => {
          const { isActive, status } = getKeyStatus(key.note, key.octave);
          const pos = getBlackKeyPosition(key.note, key.octave);
          
          return (
            <motion.div
              key={`${key.note}${key.octave}`}
              className={cn(
                'absolute top-0 cursor-pointer transition-all duration-100 z-10',
                isActive && 'piano-key-pressed',
                !isActive && 'piano-key-black hover:bg-[hsl(var(--piano-black)/0.9)]',
                status === 'pending' && 'ring-2 ring-note-pending',
                status === 'correct' && 'bg-note-correct ring-2 ring-note-correct',
                status === 'wrong' && 'bg-note-wrong ring-2 ring-note-wrong',
                status === 'close' && 'bg-note-close ring-2 ring-note-close',
              )}
              style={{
                left: pos * keyWidth + keyWidth - blackKeyWidth / 2,
                width: blackKeyWidth,
                height: blackKeyHeight,
              }}
              animate={isActive ? { scale: 0.98 } : { scale: 1 }}
              transition={{ duration: 0.1 }}
            />
          );
        })}
      </div>
    </div>
  );
}
