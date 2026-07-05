import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PIANO_KEYS, getNoteNamePt } from '@/utils/musicData';

interface VirtualKeyboardProps {
  activeNote?: { note: string; octave: number } | null;
  highlightedNotes?: Array<{ note: string; octave: number; status: 'pending' | 'correct' | 'wrong' | 'close' }>;
  showLabels?: boolean;
  compact?: boolean;
  stretch?: boolean;
  height?: number;
}

export function VirtualKeyboard({
  activeNote,
  highlightedNotes = [],
  showLabels = true,
  compact = false,
  stretch = false,
  height,
}: VirtualKeyboardProps) {
  const whiteKeys = useMemo(() => PIANO_KEYS.filter(k => !k.isBlack), []);
  const blackKeys = useMemo(() => PIANO_KEYS.filter(k => k.isBlack), []);

  const getKeyStatus = (note: string, octave: number) => {
    const isActive = activeNote?.note === note && activeNote?.octave === octave;
    const highlighted = highlightedNotes.find(h => h.note === note && h.octave === octave);
    return { isActive, status: highlighted?.status };
  };

  const getBlackKeyPosition = (note: string, octave: number) => {
    for (let i = 0; i < whiteKeys.length; i++) {
      const wk = whiteKeys[i];
      if (
        (wk.note === 'C' && note === 'C#' && wk.octave === octave) ||
        (wk.note === 'D' && note === 'D#' && wk.octave === octave) ||
        (wk.note === 'F' && note === 'F#' && wk.octave === octave) ||
        (wk.note === 'G' && note === 'G#' && wk.octave === octave) ||
        (wk.note === 'A' && note === 'A#' && wk.octave === octave)
      ) {
        return i;
      }
    }
    return 0;
  };

  const keyWidth = compact ? 28 : 40;
  const keyHeight = height ?? (compact ? 100 : 150);
  const blackKeyWidth = compact ? 20 : 28;
  const blackKeyHeight = Math.round(keyHeight * 0.6);

  // SimplyPiano-style status colors
  const getStatusClasses = (status: string | undefined, isActive: boolean, isBlackKey: boolean) => {
    if (status === 'correct') {
      return 'bg-emerald-400 dark:bg-emerald-500 shadow-[0_0_16px_hsl(160_84%_45%/0.5)] ring-2 ring-emerald-300';
    }
    if (status === 'wrong') {
      return 'bg-red-400 dark:bg-red-500 shadow-[0_0_16px_hsl(0_72%_51%/0.5)] ring-2 ring-red-300';
    }
    if (status === 'close') {
      return 'bg-amber-400 dark:bg-amber-500 shadow-[0_0_16px_hsl(38_92%_50%/0.5)] ring-2 ring-amber-300';
    }
    if (status === 'pending') {
      return isBlackKey
        ? 'bg-teal-400 dark:bg-teal-500 shadow-[0_0_12px_hsl(174_72%_50%/0.5)]'
        : 'bg-teal-300 dark:bg-teal-400 ring-2 ring-teal-400';
    }
    if (isActive) {
      return isBlackKey
        ? 'bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.6)]'
        : 'bg-primary/20 ring-2 ring-primary';
    }
    return '';
  };

  const containerClass = stretch
    ? 'relative w-full'
    : 'relative overflow-x-auto pb-4';

  return (
    <div className={containerClass}>
      <div
        className={cn('relative', stretch ? 'w-full' : 'mx-auto')}
        style={{
          width: stretch ? '100%' : whiteKeys.length * keyWidth,
          height: keyHeight,
        }}
      >

        {/* White keys */}
        <div className={cn('flex h-full', stretch && 'w-full')}>
          {whiteKeys.map((key) => {
            const { isActive, status } = getKeyStatus(key.note, key.octave);
            const statusClass = getStatusClasses(status, isActive, false);
            const showKeyLabel = showLabels && (isActive || status === 'pending' || status === 'correct' || status === 'wrong' || status === 'close');
            return (
              <motion.div
                key={`${key.note}${key.octave}`}
                className={cn(
                  'relative flex flex-col justify-end items-center pb-2 cursor-pointer transition-all duration-100',
                  'border-r border-border/30 first:rounded-bl-lg last:rounded-br-lg',
                  stretch && 'flex-1 min-w-0',
                  !statusClass && !isActive && 'bg-white dark:bg-[hsl(var(--piano-white))] hover:bg-gray-50 dark:hover:bg-muted shadow-[inset_0_-2px_4px_rgba(0,0,0,0.08)] border border-gray-200 dark:border-border/30',
                  statusClass,
                )}
                style={stretch ? { height: keyHeight } : { width: keyWidth, height: keyHeight }}
                animate={isActive ? { scale: 0.98 } : { scale: 1 }}
                transition={{ duration: 0.1 }}
              >
                {showKeyLabel && (
                  <span className={cn(
                    'text-sm md:text-base font-bold',
                    status === 'correct' || status === 'wrong' || status === 'close' ? 'text-white' :
                    status === 'pending' ? 'text-white' :
                    'text-primary'
                  )}>
                    {getNoteNamePt(key.note)}
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
          const statusClass = getStatusClasses(status, isActive, true);
          const whiteW = stretch ? `calc(100% / ${whiteKeys.length})` : `${keyWidth}px`;
          const blackW = stretch ? `calc((100% / ${whiteKeys.length}) * 0.6)` : `${blackKeyWidth}px`;
          const leftStyle = stretch
            ? `calc((100% / ${whiteKeys.length}) * ${pos + 1} - (100% / ${whiteKeys.length}) * 0.3)`
            : `${pos * keyWidth + keyWidth - blackKeyWidth / 2}px`;

          return (
            <motion.div
              key={`${key.note}${key.octave}`}
              className={cn(
                'absolute top-0 cursor-pointer transition-all duration-100 z-10 rounded-b-md',
                !statusClass && !isActive && 'bg-gray-900 dark:bg-[hsl(var(--piano-black))] shadow-lg hover:bg-gray-800',
                statusClass,
              )}
              style={{
                left: leftStyle,
                width: blackW,
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
