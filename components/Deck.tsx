import React, { useState, useEffect } from 'react';
import { DeckId, DeckState } from '../types';
import Platter from './Platter';
import Waveform from './Waveform';
import AudioEngine from '../services/audioEngine';
import { COLORS } from '../constants';
import { Play, Pause, Disc, Upload, RefreshCw } from 'lucide-react';
import XYPad from './XYPad';

interface DeckProps {
  id: DeckId;
  state: DeckState;
  color: string;
  onStateChange: (newState: Partial<DeckState>) => void;
}

const Deck: React.FC<DeckProps> = ({ id, state, color, onStateChange }) => {
  const engine = AudioEngine.getInstance();
  const [pitch, setPitch] = useState(0); // -10 to +10 percent

  const togglePlay = () => {
    if (state.isPlaying) {
      engine.pause(id);
      onStateChange({ isPlaying: false });
    } else {
      engine.play(id);
      onStateChange({ isPlaying: true });
    }
  };

  const handleScratch = (velocity: number, isGrabbing: boolean) => {
    engine.scratch(id, velocity, isGrabbing);
    if (isGrabbing && state.isPlaying) {
        // Visually pause rotation logic inside platter handles itself, 
        // but we might want to update state if needed.
    }
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPitch(val);
    // Standard DJ pitch range +/- 8% usually. Let's do 10%
    const rate = 1 + (val / 100);
    engine.setPlaybackRate(id, rate);
    onStateChange({ playbackRate: rate });
  };

  const handleFilterChange = (cutoff: number, res: number) => {
      engine.setFilter(id, cutoff, res);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#161616] rounded-xl border border-white/5 shadow-2xl relative overflow-hidden group">
      {/* Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" style={{ color }} />

      {/* Header Info */}
      <div className="flex justify-between items-end border-b border-white/5 pb-2">
        <div className="flex flex-col">
            <span className="text-4xl font-black text-white/10 select-none">DECK {id}</span>
            <div className="text-white font-mono text-sm truncate max-w-[200px]">{state.title || "No Track Loaded"}</div>
            <div className="text-gray-500 text-xs">{state.artist}</div>
        </div>
        <div className="text-2xl font-mono text-white font-bold">{state.bpm} <span className="text-xs text-gray-500">BPM</span></div>
      </div>

      {/* Main Platter Area */}
      <div className="flex-1 relative flex justify-center py-4">
        <Platter 
            isPlaying={state.isPlaying} 
            coverArt={state.coverArt} 
            playbackRate={state.playbackRate}
            onScratch={handleScratch}
            color={color}
        />
        
        {/* Pitch Slider (Vertical) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-64 flex flex-col items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono">PITCH</span>
            <input 
                type="range" 
                min="-10" max="10" step="0.1"
                value={pitch}
                onChange={handlePitchChange}
                className="h-full w-2 appearance-none bg-[#333] rounded-full outline-none slider-vertical"
                style={{ WebkitAppearance: 'slider-vertical' as any }}
            />
            <span className="text-[10px] font-mono w-8 text-center" style={{color}}>{pitch > 0 ? '+' : ''}{pitch.toFixed(1)}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-4 gap-4 items-center">
        <button 
            onClick={togglePlay}
            className={`col-span-1 aspect-square rounded-full flex items-center justify-center transition-all ${state.isPlaying ? 'bg-white text-black shadow-[0_0_20px_white]' : 'bg-[#222] text-white hover:bg-[#333]'}`}
        >
            {state.isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="white" />}
        </button>

        <div className="col-span-3">
             <XYPad color={color} effectState={{cutoff: 20000, resonance: 0, active: false}} onChange={handleFilterChange} />
        </div>
      </div>

      {/* Waveform */}
      <Waveform url={undefined} color={color} isPlaying={state.isPlaying} />

      {/* Load Button Overlay if empty */}
      {!state.isLoaded && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
             <Disc size={48} className="text-gray-600 mb-4" />
             <p className="text-gray-400 font-mono">Load a track to begin</p>
          </div>
      )}
    </div>
  );
};

export default Deck;