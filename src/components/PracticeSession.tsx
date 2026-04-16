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

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border p-3 md:p-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <Button variant="ghost" size="icon" onClick={handleExit}>
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-sm md:text-base">{exercise.title}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{bpm} BPM</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {exerciseHasBackingTrack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBackingTrackEnabled(!backingTrackEnabled)}
                title={backingTrackEnabled ? 'Desativar backing track' : 'Ativar backing track'}
                className={backingTrackEnabled ? 'text-success' : ''}
              >
                <Music2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPlaybackEnabled(!playbackEnabled)}
              title={playbackEnabled ? 'Desativar notas' : 'Ativar notas'}
            >
              {playbackEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-5 h-5" />
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
            className="border-b border-border overflow-hidden flex-shrink-0"
          >
            <div className="max-w-5xl mx-auto p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Andamento:</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setBpm(Math.max(40, bpm - 10))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1 max-w-xs">
                  <Slider
                    value={[bpm]}
                    min={40}
                    max={180}
                    step={5}
                    onValueChange={([v]) => setBpm(v)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setBpm(Math.min(180, bpm + 10))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm font-mono w-16">{bpm} BPM</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Scrollable */}
      <main className="flex-1 flex flex-col gap-4 p-3 md:p-4 max-w-5xl mx-auto w-full overflow-y-auto min-h-0">
        {/* Current Note Display */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4 md:py-8"
        >
          <p className="text-sm text-muted-foreground mb-2">Nota Atual</p>
          <div
            className={cn(
              'text-5xl md:text-8xl font-display font-bold transition-colors duration-200',
              currentPitch && 'gradient-text'
            )}
          >
            {currentPitch
              ? `${getNoteNamePt(currentPitch.note)}${currentPitch.octave}`
              : '—'}
          </div>
          {currentPitch && (
            <p className="text-sm text-muted-foreground mt-2">
              {currentPitch.frequency.toFixed(1)} Hz
            </p>
          )}
        </motion.div>

        {/* Expected Note */}
        {currentNote && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Toque:</p>
            <p className="text-xl md:text-2xl font-display font-bold text-primary">
              {getNoteNamePt(currentNote.note)}{currentNote.octave}
            </p>
          </div>
        )}

        {/* Sheet Music */}
        <SheetMusic
          notes={exercise.notes}
          currentBeat={currentBeat}
          noteStatuses={noteStatuses}
          clef={exercise.clef}
        />

        {/* Virtual Keyboard */}
        <VirtualKeyboard
          activeNote={
            currentPitch
              ? { note: currentPitch.note, octave: currentPitch.octave }
              : null
          }
          highlightedNotes={highlightedNotes}
          compact
        />

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{
                width: `${(currentBeat / totalBeats) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
            <span>
              {correctNotes}/{exercise.notes.length} corretas
            </span>
            <span>
              {Math.floor(currentBeat)}/{totalBeats} tempos
            </span>
          </div>
        </div>
      </main>

      {/* Controls - Fixed at bottom */}
      <footer className="border-t border-border p-3 md:p-4 flex-shrink-0 bg-background">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={handleRestart}>
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            className="w-32 glow-primary"
            onClick={isPlaying ? handlePause : handleStart}
            disabled={isCountingDown}
          >
            {isCountingDown ? (
              <span className="text-lg font-bold">{countdownNumber}</span>
            ) : isPlaying ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                {currentBeat > 0 ? 'Continuar' : 'Iniciar'}
              </>
            )}
          </Button>
        </div>
      </footer>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {isCountingDown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              key={countdownNumber}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-9xl font-display font-bold gradient-text"
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
