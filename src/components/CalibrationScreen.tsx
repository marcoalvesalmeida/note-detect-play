import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Music, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { getNoteNamePt } from '@/utils/musicData';

interface CalibrationScreenProps {
  onComplete: () => void;
}

export function CalibrationScreen({ onComplete }: CalibrationScreenProps) {
  const [step, setStep] = useState<'permission' | 'detecting' | 'success'>('permission');
  const [detectedNotes, setDetectedNotes] = useState<string[]>([]);
  const { isListening, hasPermission, error, currentPitch, startListening, stopListening } = useAudioCapture();

  useEffect(() => {
    if (currentPitch && currentPitch.confidence > 0.1) {
      const noteName = `${currentPitch.note}${currentPitch.octave}`;
      setDetectedNotes(prev => {
        if (!prev.includes(noteName)) {
          const newNotes = [...prev, noteName];
          if (newNotes.length >= 3) {
            setStep('success');
            stopListening();
          }
          return newNotes;
        }
        return prev;
      });
    }
  }, [currentPitch, stopListening]);

  const handleRequestPermission = async () => {
    await startListening();
    setStep('detecting');
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 text-center">
          <AnimatePresence mode="wait">
            {step === 'permission' && (
              <motion.div
                key="permission"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-primary" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">
                    Vamos Calibrar
                  </h2>
                  <p className="text-muted-foreground">
                    Precisamos de acesso ao seu microfone para detectar as notas do seu teclado.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleRequestPermission}
                  className="w-full glow-primary"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Permitir Microfone
                </Button>
              </motion.div>
            )}

            {step === 'detecting' && (
              <motion.div
                key="detecting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse-glow">
                  <Volume2 className="w-10 h-10 text-primary" />
                </div>

                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">
                    Toque Algumas Notas
                  </h2>
                  <p className="text-muted-foreground">
                    Toque pelo menos 3 notas diferentes no seu teclado para calibrar o sistema.
                  </p>
                </div>

                {/* Current detection */}
                <div className="p-4 bg-muted rounded-xl">
                  {currentPitch ? (
                    <div className="space-y-1">
                      <p className="text-4xl font-display font-bold text-primary">
                        {getNoteNamePt(currentPitch.note)}{currentPitch.octave}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentPitch.frequency.toFixed(1)} Hz
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aguardando nota...</p>
                  )}
                </div>

                {/* Detected notes */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Notas detectadas: {detectedNotes.length}/3
                  </p>
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{
                          scale: detectedNotes[i] ? 1 : 0.8,
                          opacity: detectedNotes[i] ? 1 : 0.5,
                        }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                          detectedNotes[i]
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {detectedNotes[i] ? (
                          <Music className="w-5 h-5" />
                        ) : (
                          i + 1
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center glow-success"
                >
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">
                    Calibração Completa!
                  </h2>
                  <p className="text-muted-foreground">
                    Seu instrumento foi identificado como um teclado/piano. Vamos começar!
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Notas detectadas:</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {detectedNotes.map((note, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="w-full glow-primary"
                >
                  Começar a Praticar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
