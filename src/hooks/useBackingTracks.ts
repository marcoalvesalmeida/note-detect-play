import { useState, useEffect, useCallback, useRef } from 'react';

const DB_NAME = 'piano-master-db';
const STORE_NAME = 'backing-tracks';
const DB_VERSION = 1;

// Initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'exerciseId' });
      }
    };
  });
}

interface BackingTrack {
  exerciseId: string;
  blob: Blob;
  fileName: string;
}

export function useBackingTracks() {
  const [tracks, setTracks] = useState<Record<string, { fileName: string; url: string }>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load all tracks on mount
  useEffect(() => {
    const loadTracks = async () => {
      try {
        const db = await openDatabase();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const loadedTracks: Record<string, { fileName: string; url: string }> = {};
          (request.result as BackingTrack[]).forEach((track) => {
            const url = URL.createObjectURL(track.blob);
            loadedTracks[track.exerciseId] = { fileName: track.fileName, url };
          });
          setTracks(loadedTracks);
        };
      } catch (error) {
        console.error('Error loading backing tracks:', error);
      }
    };

    loadTracks();

    // Cleanup URLs on unmount
    return () => {
      Object.values(tracks).forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, []);

  const saveTrack = useCallback(async (exerciseId: string, file: File) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const track: BackingTrack = {
        exerciseId,
        blob: file,
        fileName: file.name,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(track);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Revoke old URL if exists
      if (tracks[exerciseId]) {
        URL.revokeObjectURL(tracks[exerciseId].url);
      }

      const url = URL.createObjectURL(file);
      setTracks((prev) => ({
        ...prev,
        [exerciseId]: { fileName: file.name, url },
      }));
    } catch (error) {
      console.error('Error saving backing track:', error);
      throw error;
    }
  }, [tracks]);

  const deleteTrack = useCallback(async (exerciseId: string) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(exerciseId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      if (tracks[exerciseId]) {
        URL.revokeObjectURL(tracks[exerciseId].url);
      }

      setTracks((prev) => {
        const newTracks = { ...prev };
        delete newTracks[exerciseId];
        return newTracks;
      });
    } catch (error) {
      console.error('Error deleting backing track:', error);
      throw error;
    }
  }, [tracks]);

  const hasTrack = useCallback((exerciseId: string) => {
    return !!tracks[exerciseId];
  }, [tracks]);

  const getTrack = useCallback((exerciseId: string) => {
    return tracks[exerciseId] || null;
  }, [tracks]);

  const playTrack = useCallback((exerciseId: string, startTime: number = 0) => {
    const track = tracks[exerciseId];
    if (!track) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(track.url);
    audio.currentTime = startTime;
    audioRef.current = audio;

    audio.play();
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
    };
  }, [tracks]);

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stopTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return audioRef.current?.currentTime || 0;
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  return {
    tracks,
    saveTrack,
    deleteTrack,
    hasTrack,
    getTrack,
    playTrack,
    pauseTrack,
    stopTrack,
    isPlaying,
    getCurrentTime,
    seekTo,
  };
}
