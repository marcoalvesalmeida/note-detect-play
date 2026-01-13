import { motion } from 'framer-motion';
import { Trophy, Target, Clock, TrendingUp, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  totalNotes: number;
  correctNotes: number;
  closeNotes: number;
  wrongNotes: number;
  missedNotes: number;
  onRestart: () => void;
  onHome: () => void;
}

export function ScoreDisplay({
  totalNotes,
  correctNotes,
  closeNotes,
  wrongNotes,
  missedNotes,
  onRestart,
  onHome,
}: ScoreDisplayProps) {
  const accuracy = totalNotes > 0 ? (correctNotes / totalNotes) * 100 : 0;
  const closePercentage = totalNotes > 0 ? (closeNotes / totalNotes) * 100 : 0;
  
  const getGrade = () => {
    if (accuracy >= 95) return { grade: 'S', color: 'text-primary', label: 'Perfeito!' };
    if (accuracy >= 85) return { grade: 'A', color: 'text-success', label: 'Excelente!' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-accent', label: 'Muito Bom!' };
    if (accuracy >= 50) return { grade: 'C', color: 'text-warning', label: 'Bom trabalho!' };
    return { grade: 'D', color: 'text-muted-foreground', label: 'Continue praticando!' };
  };

  const { grade, color, label } = getGrade();

  const stats = [
    {
      icon: Target,
      label: 'Precisão',
      value: `${accuracy.toFixed(0)}%`,
      color: 'text-primary',
    },
    {
      icon: Trophy,
      label: 'Notas Corretas',
      value: `${correctNotes}/${totalNotes}`,
      color: 'text-success',
    },
    {
      icon: TrendingUp,
      label: 'Quase Certas',
      value: `${closeNotes}`,
      color: 'text-warning',
    },
    {
      icon: Clock,
      label: 'Erros/Perdidas',
      value: `${wrongNotes + missedNotes}`,
      color: 'text-destructive',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-6"
      >
        <div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className={cn(
              'text-8xl font-display font-bold mb-2',
              color
            )}
          >
            {grade}
          </motion.div>
          <p className="text-xl font-medium">{label}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-4 bg-muted rounded-xl"
            >
              <stat.icon className={cn('w-5 h-5 mx-auto mb-2', stat.color)} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Feedback */}
        <div className="p-4 bg-muted rounded-xl text-left space-y-2">
          <p className="font-medium">💡 Dicas de Melhoria:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {wrongNotes > correctNotes && (
              <li>• Pratique mais devagar para melhorar a precisão</li>
            )}
            {closeNotes > 2 && (
              <li>• Verifique a afinação do seu teclado</li>
            )}
            {missedNotes > 2 && (
              <li>• Tente acompanhar o ritmo mais de perto</li>
            )}
            {accuracy >= 80 && (
              <li>• Ótimo trabalho! Experimente aumentar o andamento</li>
            )}
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onHome}>
            <Home className="w-4 h-4 mr-2" />
            Menu
          </Button>
          <Button className="flex-1 glow-primary" onClick={onRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
