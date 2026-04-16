import { motion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { Music, Star, Clock, Zap, ArrowLeft, Music2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Exercise, SAMPLE_EXERCISES } from '@/utils/musicData';
import { BackingTrackUploader } from './BackingTrackUploader';
import { useBackingTracks } from '@/hooks/useBackingTracks';
import { cn } from '@/lib/utils';

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  onBack?: () => void;
}

export function ExerciseSelector({ onSelect, onBack }: ExerciseSelectorProps) {
  const { saveTrack, deleteTrack, getTrack } = useBackingTracks();

  const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-success/10 text-success border-success/30';
      case 'intermediate':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'advanced':
        return 'bg-destructive/10 text-destructive border-destructive/30';
    }
  };

  const getDifficultyLabel = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
    }
  };

  const getEstimatedDuration = (exercise: Exercise) => {
    const lastNote = exercise.notes[exercise.notes.length - 1];
    const totalBeats = lastNote.startBeat + lastNote.duration;
    const seconds = (totalBeats / exercise.bpm) * 60;
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 mb-6 relative"
        >
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text">
            Escolha um Exercício
          </h1>
          <p className="text-muted-foreground">
            Selecione uma música para praticar
          </p>
        </motion.div>

        {/* Exercise Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1 content-start pb-4">
          {SAMPLE_EXERCISES.map((exercise, i) => {
            const track = getTrack(exercise.id);
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={cn(
                    'p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
                    'border-2 hover:border-primary/50 glass-card h-full'
                  )}
                  onClick={() => onSelect(exercise)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Music className="w-6 h-6 text-primary" />
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getDifficultyColor(exercise.difficulty))}
                      >
                        {getDifficultyLabel(exercise.difficulty)}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-lg mb-1">
                        {exercise.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {exercise.notes.length} notas • {getEstimatedDuration(exercise)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{exercise.bpm} BPM</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>{exercise.timeSignature.join('/')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-4 h-4',
                              star <= (exercise.difficulty === 'beginner' ? 1 : exercise.difficulty === 'intermediate' ? 2 : 3)
                                ? 'fill-accent text-accent'
                                : 'text-muted'
                            )}
                          />
                        ))}
                      </div>
                      {track && (
                        <div className="flex items-center gap-1 text-xs text-success">
                          <Music2 className="w-3 h-3" />
                          <span>Backing Track</span>
                        </div>
                      )}
                    </div>

                    {/* Backing Track Upload */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <BackingTrackUploader
                        exerciseId={exercise.id}
                        currentTrack={track}
                        onUpload={(file) => saveTrack(exercise.id, file)}
                        onDelete={() => deleteTrack(exercise.id)}
                        compact
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
