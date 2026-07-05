import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, X, Minus, Plus, Volume2, VolumeX, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { VirtualKeyboard } from './VirtualKeyboard';
import { SheetMusic } from './SheetMusic';
import { ScoreDisplay } from './ScoreDisplay';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useBackingTracks } from '@/hooks/useBackingTracks';
import { compareNotes } from '@/utils/pitchDetection';
import { Exercise, getNoteNamePt } from '@/utils/musicData';
import { cn } from '@/lib/utils';

interface PracticeSessionProps {
  exercise: Exercise;
  onExit: () => void;
}

type NoteStatus = 'pending' | 'correct' | 'wrong' | 'close' | 'missed';

export function PracticeSession({ exercise, onExit }: PracticeSessionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [bpm, setBpm] = useState(exercise.bpm);
  const [showSettings, setShowSettings] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [playbackEnabled, setPlaybackEnabled] = useState(false); // Note playback disabled by default
  const [backingTrackEnabled, setBackingTrackEnabled] = useState(true);
  const [noteStatuses, setNoteStatuses] = useState<NoteStatus[]>(
    exercise.notes.map(() => 'pending')
  );

  const { currentPitch, startListening, stopListening, isListening } = useAudioCapture();
  const { playCountdown, playNote, stopPlayback } = useAudioPlayback();
  const { getTrack, playTrack, pauseTrack, stopTrack, seekTo, hasTrack } = useBackingTracks();
  
  const lastProcessedNote = useRef(-1);
  const lastPlayedNoteIndex = useRef(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const msPerBeat = (60 / bpm) * 1000;
  const exerciseHasBackingTrack = hasTrack(exercise.id);

  const getCurrentNoteIndex = useCallback(() => {
    return exercise.notes.findIndex(
      (note) =>
        currentBeat >= note.startBeat &&
        currentBeat < note.startBeat + note.duration
    );
  }, [currentBeat, exercise.notes]);

  const currentNoteIndex = getCurrentNoteIndex();
  const currentNote = currentNoteIndex >= 0 ? exercise.notes[currentNoteIndex] : null;

  // Play note when it becomes active
  useEffect(() => {
    if (!isPlaying || !playbackEnabled || currentNoteIndex < 0) return;
    if (currentNoteIndex === lastPlayedNoteIndex.current) return;

    const note = exercise.notes[currentNoteIndex];
    const durationMs = note.duration * msPerBeat;
    playNote(note.note, note.octave, durationMs);
    lastPlayedNoteIndex.current = currentNoteIndex;
  }, [isPlaying, playbackEnabled, currentNoteIndex, exercise.notes, msPerBeat, playNote]);

  // Process detected pitch
  useEffect(() => {
    if (!isPlaying || !currentPitch || currentNoteIndex < 0) return;
    if (currentNoteIndex === lastProcessedNote.current) return;

    const expectedNote = exercise.notes[currentNoteIndex];
    const result = compareNotes(
      { note: currentPitch.note, octave: currentPitch.octave },
      { note: expectedNote.note, octave: expectedNote.octave }
    );

    if (result !== 'none') {
      lastProcessedNote.current = currentNoteIndex;
      setNoteStatuses((prev) => {
        const newStatuses = [...prev];
        newStatuses[currentNoteIndex] = result;
        return newStatuses;
      });
    }
  }, [currentPitch, isPlaying, currentNoteIndex, exercise.notes]);

  // Beat progression
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentBeat((prev) => {
        const lastNote = exercise.notes[exercise.notes.length - 1];
        const totalBeats = lastNote.startBeat + lastNote.duration;

        if (prev >= totalBeats) {
          setIsPlaying(false);
          stopPlayback();
          stopTrack();
          // Mark remaining pending notes as missed
          setNoteStatuses((statuses) =>
            statuses.map((s) => (s === 'pending' ? 'missed' : s))
          );
          setShowResults(true);
          return prev;
        }

        return prev + 0.1;
      });
    }, msPerBeat / 10);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, msPerBeat, exercise.notes, stopPlayback]);

  const handleStart = async () => {
    if (!isListening) {
      await startListening();
    }
    
    // Start countdown
    setIsCountingDown(true);
    setCountdownNumber(4);
    
    // Animate countdown numbers
    for (let i = 4; i >= 1; i--) {
      setCountdownNumber(i);
      await new Promise((resolve) => setTimeout(resolve, msPerBeat));
    }
    
    // Play click sounds for countdown
    await playCountdown(4, bpm);
    
    setIsCountingDown(false);
    setCountdownNumber(0);
    setIsPlaying(true);

    // Start backing track if available and enabled
    if (exerciseHasBackingTrack && backingTrackEnabled) {
      playTrack(exercise.id);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopPlayback();
    pauseTrack();
  };

  const handleRestart = () => {
    setIsPlaying(false);
    stopPlayback();
    stopTrack();
    setCurrentBeat(0);
    setNoteStatuses(exercise.notes.map(() => 'pending'));
    lastProcessedNote.current = -1;
    lastPlayedNoteIndex.current = -1;
    setShowResults(false);
  };

  const handleExit = () => {
    stopListening();
    stopPlayback();
    stopTrack();
    onExit();
  };

  const correctNotes = noteStatuses.filter((s) => s === 'correct').length;
  const closeNotes = noteStatuses.filter((s) => s === 'close').length;
  const wrongNotes = noteStatuses.filter((s) => s === 'wrong').length;
  const missedNotes = noteStatuses.filter((s) => s === 'missed').length;

  const highlightedNotes = currentNote
    ? [
        {
          note: currentNote.note,
          octave: currentNote.octave,
          status: noteStatuses[currentNoteIndex] as 'pending' | 'correct' | 'wrong' | 'close',
        },
      ]
    : [];

  const totalBeats = exercise.notes[exercise.notes.length - 1].startBeat +
    exercise.notes[exercise.notes.length - 1].duration;

  const currentIndexForCount = Math.max(0, Math.min(exercise.notes.length, currentNoteIndex >= 0 ? currentNoteIndex + 1 : Math.floor(currentBeat) === 0 ? 0 : exercise.notes.length));
  const progressPct = Math.min(100, (currentBeat / totalBeats) * 100);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[hsl(265_70%_65%)] dark:bg-[hsl(265_45%_35%)] text-white">
      {/* Top Bar */}
      <header className="flex-shrink-0 px-3 md:px-6 py-3 flex items-center gap-3 md:gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={isPlaying ? handlePause : (currentBeat > 0 ? handleStart : handleExit)}
          className="rounded-full h-11 w-11 bg-white/15 hover:bg-white/25 text-white border border-white/30"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : currentBeat > 0 ? <Play className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </Button>

        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-lg font-semibold truncate">
            {currentNote ? (
              <>Toque a nota <span className="font-bold">{getNoteNamePt(currentNote.note)}</span></>
            ) : isPlaying ? (
              'Prepare-se…'
            ) : (
              exercise.title
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:block w-32 md:w-56 h-2.5 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ ease: 'linear', duration: 0.1 }}
            />
          </div>
          <span className="text-xs md:text-sm font-semibold tabular-nums whitespace-nowrap">
            {currentIndexForCount}/{exercise.notes.length}
          </span>
          <div className="flex items-center gap-1">
            {exerciseHasBackingTrack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBackingTrackEnabled(!backingTrackEnabled)}
                className="rounded-full h-9 w-9 text-white hover:bg-white/15"
                title="Backing track"
              >
                <Music2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full h-9 w-9 text-white hover:bg-white/15"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRestart}
              className="rounded-full h-9 w-9 text-white hover:bg-white/15"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0 bg-black/10"
          >
            <div className="max-w-3xl mx-auto p-3 md:p-4 flex items-center gap-3 text-white">
              <span className="text-sm font-medium">Andamento:</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={() => setBpm(Math.max(40, bpm - 10))}>
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex-1 max-w-xs">
                <Slider value={[bpm]} min={40} max={180} step={5} onValueChange={([v]) => setBpm(v)} />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={() => setBpm(Math.min(180, bpm + 10))}>
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono w-16">{bpm} BPM</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/15"
                onClick={() => setPlaybackEnabled(!playbackEnabled)}
                title={playbackEnabled ? 'Desativar notas' : 'Ativar notas'}
              >
                {playbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheet Music (large area) */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-2 md:px-6 py-3 md:py-6">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden">
          <SheetMusic
            notes={exercise.notes}
            currentBeat={currentBeat}
            noteStatuses={noteStatuses}
            clef={exercise.clef}
          />
        </div>
      </main>

      {/* Piano Keyboard - full width bottom */}
      <div className="flex-shrink-0 w-full bg-black/20">
        <VirtualKeyboard
          activeNote={
            currentPitch ? { note: currentPitch.note, octave: currentPitch.octave } : null
          }
          highlightedNotes={highlightedNotes}
          stretch
          height={typeof window !== 'undefined' && window.innerWidth < 768 ? 110 : 160}
        />
      </div>

      {/* Start overlay when not yet started */}
      {!isPlaying && !isCountingDown && currentBeat === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Button
            size="lg"
            className="pointer-events-auto rounded-full h-20 w-20 md:h-24 md:w-24 bg-white text-primary hover:bg-white/90 shadow-2xl"
            onClick={handleStart}
          >
            <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" />
          </Button>
        </div>
      )}

      {/* Countdown Overlay */}
      <AnimatePresence>
        {isCountingDown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              key={countdownNumber}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-9xl font-display font-bold text-white drop-shadow-lg"
            >
              {countdownNumber}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      {showResults && (
        <ScoreDisplay
          totalNotes={exercise.notes.length}
          correctNotes={correctNotes}
          closeNotes={closeNotes}
          wrongNotes={wrongNotes}
          missedNotes={missedNotes}
          onRestart={handleRestart}
          onHome={handleExit}
        />
      )}
    </div>
  );
}
