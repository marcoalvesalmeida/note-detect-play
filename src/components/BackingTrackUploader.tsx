import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Music2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackingTrackUploaderProps {
  exerciseId: string;
  currentTrack: { fileName: string; url: string } | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  compact?: boolean;
}

export function BackingTrackUploader({
  exerciseId,
  currentTrack,
  onUpload,
  onDelete,
  compact = false,
}: BackingTrackUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Por favor, selecione um arquivo de áudio (MP3, WAV, etc.)');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Error uploading track:', error);
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          className="hidden"
        />
        {currentTrack ? (
          <>
            <div className="flex items-center gap-1 text-xs text-success">
              <Music2 className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{currentTrack.fileName}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={isUploading}
          >
            <Upload className="w-3 h-3 mr-1" />
            {isUploading ? 'Enviando...' : 'Backing Track'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {currentTrack ? (
          <motion.div
            key="track"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Backing Track</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {currentTrack.fileName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
            )}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isUploading ? 'Enviando...' : 'Adicionar Backing Track'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Arraste um arquivo ou clique para selecionar
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
