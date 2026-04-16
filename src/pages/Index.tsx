import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalibrationScreen } from '@/components/CalibrationScreen';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { PracticeSession } from '@/components/PracticeSession';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Exercise } from '@/utils/musicData';
import { Music, Piano, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppState = 'welcome' | 'calibration' | 'select' | 'practice';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const handleStart = () => {
    setAppState('calibration');
  };

  const handleCalibrationComplete = () => {
    setAppState('select');
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setAppState('practice');
  };

  const handleExitPractice = () => {
    setSelectedExercise(null);
    setAppState('select');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Theme toggle - always visible */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <AnimatePresence mode="wait">
        {appState === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="max-w-lg w-full text-center space-y-8">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="relative inline-block"
              >
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                  <Piano className="w-12 h-12 text-primary-foreground" />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-accent-foreground" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="space-y-2"
              >
                <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text">
                  Piano Master
                </h1>
                <p className="text-muted-foreground text-lg">
                  Aprenda piano com feedback em tempo real
                </p>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="grid grid-cols-3 gap-4"
              >
                {[
                  { icon: Music, label: 'Partituras\nDinâmicas' },
                  { icon: Target, label: 'Detecção\nPrecisa' },
                  { icon: Sparkles, label: 'Pontuação\nInstantânea' },
                ].map((feature, i) => (
                  <div key={i} className="p-4 bg-muted rounded-xl">
                    <feature.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {feature.label}
                    </p>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <Button
                  size="lg"
                  className="w-full text-lg h-14 glow-primary"
                  onClick={handleStart}
                >
                  Começar Agora
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Conecte seu teclado e comece a tocar
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {appState === 'calibration' && (
          <motion.div
            key="calibration"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <CalibrationScreen onComplete={handleCalibrationComplete} />
          </motion.div>
        )}

        {appState === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <ExerciseSelector onSelect={handleSelectExercise} />
          </motion.div>
        )}

        {appState === 'practice' && selectedExercise && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <PracticeSession exercise={selectedExercise} onExit={handleExitPractice} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
