import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { COLORS } from '../constants';

interface WaveformProps {
  url?: string;
  color: string;
  isPlaying: boolean;
  onReady?: () => void;
}

const Waveform: React.FC<WaveformProps> = ({ url, color, isPlaying, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#333',
      progressColor: color,
      cursorColor: 'white',
      barWidth: 2,
      barGap: 3,
      height: 60,
      normalize: true,
      minPxPerSec: 50,
      interact: false, // Make it view-only, control via deck
    });

    if (url) {
      wavesurfer.current.load(url);
    }

    wavesurfer.current.on('ready', () => {
      onReady?.();
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [url, color]);

  useEffect(() => {
    if (wavesurfer.current) {
      if (isPlaying) {
        wavesurfer.current.play();
      } else {
        wavesurfer.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="w-full h-[60px] bg-black/40 rounded border border-white/10 overflow-hidden relative">
        <div ref={containerRef} className="w-full h-full" />
        {/* Center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50 z-10 pointer-events-none" />
    </div>
  );
};

export default Waveform;