'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** Start/stop playback */
  play: boolean;
  /** Audio file path (public folder) */
  src: string;
  /** Base volume while waiting (0..1) */
  volume?: number;
  /** Whether to duck while the agent is speaking */
  duck?: boolean;
  /** True when the agent is speaking */
  isSpeaking?: boolean;
  /** Fade durations */
  fadeInMs?: number;
  fadeOutMs?: number;
};

export default function WaitMusic({
  play,
  src,
  volume = 0.25,
  duck = true,
  isSpeaking = false,
  fadeInMs = 350,
  fadeOutMs = 250,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volRef = useRef({ target: volume, current: 0 });

  // Lazy create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio(src);
      a.loop = true;
      a.preload = 'auto';
      a.crossOrigin = 'anonymous';
      a.volume = 0;
      audioRef.current = a;
    }
  }, [src]);

  // Simple volume fader
  function fade(to: number, ms: number) {
    const a = audioRef.current;
    if (!a) return;
    const steps = Math.max(1, Math.floor(ms / 16));
    const from = a.volume;
    const delta = (to - from) / steps;
    let i = 0;
    const tick = () => {
      if (!audioRef.current) return;
      i++;
      const v = from + delta * i;
      audioRef.current.volume = Math.min(1, Math.max(0, v));
      if (i < steps) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Start/stop playback with fade
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    if (play) {
      // play() must follow a user gesture; StartAudio in your app unlocks audio.
      a.play().catch(() => {/* ignore */});
      fade(duck && isSpeaking ? Math.min(0.08, volume * 0.3) : volume, fadeInMs);
    } else {
      // fade out then pause
      fade(0, fadeOutMs);
      const t = setTimeout(() => {
        try { a.pause(); } catch {}
      }, fadeOutMs + 30);
      return () => clearTimeout(t);
    }
  }, [play, duck, isSpeaking, volume, fadeInMs, fadeOutMs]);

  // While speaking, duck; otherwise return to base volume
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!play) return;
    const target = duck && isSpeaking ? Math.min(0.08, volume * 0.3) : volume;
    fade(target, 180);
  }, [isSpeaking, duck, play, volume]);

  return null;
}
