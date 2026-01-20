"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export interface PlayableItem {
  id: string;
  audioUrl: string;
  startTime: number;
  endTime: number;
  title: string;
  episodeTitle?: string;
  type: "chapter" | "clip" | "episode";
}

interface AudioPlayerContextValue {
  currentItem: PlayableItem | null;
  isPlaying: boolean;
  isLoading: boolean; // P1 fix: loading state
  currentTime: number;
  clipProgress: number;
  clipDuration: number;
  play: (item: PlayableItem) => void;
  pause: () => void;
  toggle: () => void;
  seek: (progress: number) => void;
  clear: () => void; // P3 fix: add clear method
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

// Safe hook that returns null if not in provider (for optional use)
export function useAudioPlayerOptional() {
  return useContext(AudioPlayerContext);
}

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export function AudioPlayerProvider({ children }: AudioPlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentItem, setCurrentItem] = useState<PlayableItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // P1 fix
  const [currentTime, setCurrentTime] = useState(0);

  // P1 fix: Load generation counter to prevent race conditions
  const loadGenerationRef = useRef(0);
  // Track which item is associated with which generation
  const itemByGenerationRef = useRef<Map<number, PlayableItem>>(new Map());

  // P2 fix: Throttle time updates
  const lastTimeUpdateRef = useRef(0);

  // Calculate clip-relative values
  const clipDuration = currentItem ? currentItem.endTime - currentItem.startTime : 0;
  const clipProgress = currentItem && clipDuration > 0
    ? Math.max(0, Math.min(1, (currentTime - currentItem.startTime) / clipDuration))
    : 0;

  // Initialize audio element on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    // P1 fix: Handle metadata loaded with generation check
    const handleLoadedMetadata = () => {
      const currentGeneration = loadGenerationRef.current;
      const item = itemByGenerationRef.current.get(currentGeneration);

      // Stale load - a newer request superseded this one
      if (!item || !audioRef.current) {
        return;
      }

      setIsLoading(false);
      audioRef.current.currentTime = item.startTime;
      audioRef.current.play().catch((err) => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
    };

    // P2 fix: Throttled time updates (limit to ~10Hz to reduce re-renders)
    const handleTimeUpdate = () => {
      if (!audioRef.current) return;

      const now = performance.now();
      // Throttle to ~100ms intervals to reduce re-renders
      if (now - lastTimeUpdateRef.current < 100) return;
      lastTimeUpdateRef.current = now;

      const time = audioRef.current.currentTime;
      setCurrentTime(time);

      // Auto-pause at end of clip - use current generation's item
      const currentGeneration = loadGenerationRef.current;
      const item = itemByGenerationRef.current.get(currentGeneration);
      if (item && time >= item.endTime) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    // P1 fix: Handle load errors
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const play = useCallback((item: PlayableItem) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    // P1 fix: Increment generation for every play request
    const thisGeneration = ++loadGenerationRef.current;
    itemByGenerationRef.current.set(thisGeneration, item);

    // Clean up old generations to prevent memory leak
    for (const [gen] of itemByGenerationRef.current) {
      if (gen < thisGeneration - 5) {
        itemByGenerationRef.current.delete(gen);
      }
    }

    setCurrentItem(item);

    // Check if same source (same episode audio file)
    const isSameSource = audio.src && audio.src === item.audioUrl;

    if (isSameSource) {
      // Same audio file - just seek and play (no load needed)
      setIsLoading(false);
      audio.currentTime = item.startTime;
      audio.play().catch((err) => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
    } else {
      // Different audio file - load new source
      setIsLoading(true);
      audio.src = item.audioUrl;
      audio.load();
      // loadedmetadata handler will seek and play
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const toggle = useCallback(() => {
    if (isLoading) return; // P1 fix: ignore toggle during load

    if (isPlaying) {
      pause();
    } else if (currentItem && audioRef.current?.src) {
      // P1 fix: Only resume if we have a valid src
      audioRef.current.play().catch((err) => {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      });
    }
  }, [isPlaying, isLoading, currentItem, pause]);

  const seek = useCallback((progress: number) => {
    // P1 fix: Disable seek during loading
    if (!audioRef.current || !currentItem || isLoading) return;

    const duration = currentItem.endTime - currentItem.startTime;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const targetTime = currentItem.startTime + clampedProgress * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  }, [currentItem, isLoading]);

  // P3 fix: Add clear method to fully dismiss player
  const clear = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setCurrentItem(null);
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTime(0);
  }, []);

  // P2 fix: Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AudioPlayerContextValue>(() => ({
    currentItem,
    isPlaying,
    isLoading,
    currentTime,
    clipProgress,
    clipDuration,
    play,
    pause,
    toggle,
    seek,
    clear,
  }), [
    currentItem,
    isPlaying,
    isLoading,
    currentTime,
    clipProgress,
    clipDuration,
    play,
    pause,
    toggle,
    seek,
    clear,
  ]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
