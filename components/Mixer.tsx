import React from 'react';
import Knob from './Knob';
import { MixerState, DeckId, StemState, StemType } from '../types';
import { COLORS } from '../constants';
import { Mic, Music, Disc, Layers } from 'lucide-react';

interface MixerProps {
  state: MixerState;
  onChange: (key: keyof MixerState, value: any) => void;
  stemsA: StemState;
  stemsB: StemState;
  onStemToggle: (deck: DeckId, stem: StemType) => void;
}

const Mixer: React.FC<MixerProps> = ({ state, onChange, stemsA, stemsB, onStemToggle }) => {

  const handleEQChange = (deck: DeckId, band: 'high' | 'mid' | 'low', val: number) => {
    if (deck === 'A') {
        onChange('eqA', { ...state.eqA, [band]: val });
    } else {
        onChange('eqB', { ...state.eqB, [band]: val });
    }
  };

  const StemButton = ({ deck, type, icon: Icon }: { deck: DeckId, type: StemType, icon: any }) => {
    const isActive = deck === 'A' ? stemsA[type] : stemsB[type];
    const color = deck === 'A' ? COLORS.deckA : COLORS.deckB;
    return (
        <button 
            onClick={() => onStemToggle(deck, type)}
            className={`p-2 rounded flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all border border-white/10
                ${isActive ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-gray-600 bg-black'}`}
            style={{ borderColor: isActive ? color : 'transparent' }}
        >
            <Icon size={16} />
            {type.toUpperCase()}
        </button>
    );
  };

  return (
    <div className="w-full max-w-md bg-[#1a1a1a] rounded-xl border-x-2 border-white/5 flex flex-col p-4 shadow-2xl relative z-10">
        
        {/* Top Section: Gains & EQ */}
        <div className="grid grid-cols-2 gap-8 mb-8 relative">
            {/* Center Divider */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2" />

            {/* Deck A Strip */}
            <div className="flex flex-col items-center gap-4">
                <h3 className="text-cyan-400 font-mono text-xs mb-2">CH A</h3>
                <Knob label="HIGH" value={state.eqA.high} min={-12} max={12} onChange={(v) => handleEQChange('A', 'high', v)} color={COLORS.deckA} size={50} />
                <Knob label="MID" value={state.eqA.mid} min={-12} max={12} onChange={(v) => handleEQChange('A', 'mid', v)} color={COLORS.deckA} size={50} />
                <Knob label="LOW" value={state.eqA.low} min={-12} max={12} onChange={(v) => handleEQChange('A', 'low', v)} color={COLORS.deckA} size={50} />
            </div>

            {/* Deck B Strip */}
            <div className="flex flex-col items-center gap-4">
                <h3 className="text-pink-500 font-mono text-xs mb-2">CH B</h3>
                <Knob label="HIGH" value={state.eqB.high} min={-12} max={12} onChange={(v) => handleEQChange('B', 'high', v)} color={COLORS.deckB} size={50} />
                <Knob label="MID" value={state.eqB.mid} min={-12} max={12} onChange={(v) => handleEQChange('B', 'mid', v)} color={COLORS.deckB} size={50} />
                <Knob label="LOW" value={state.eqB.low} min={-12} max={12} onChange={(v) => handleEQChange('B', 'low', v)} color={COLORS.deckB} size={50} />
            </div>
        </div>

        {/* Neural Stems Section */}
        <div className="mb-8 p-3 bg-black/40 rounded-lg border border-white/5">
            <div className="text-center text-[10px] text-gray-500 tracking-widest mb-3">NEURAL STEMS</div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                    <StemButton deck="A" type="vocals" icon={Mic} />
                    <StemButton deck="A" type="drums" icon={Disc} />
                    <StemButton deck="A" type="bass" icon={Layers} />
                    <StemButton deck="A" type="other" icon={Music} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <StemButton deck="B" type="vocals" icon={Mic} />
                    <StemButton deck="B" type="drums" icon={Disc} />
                    <StemButton deck="B" type="bass" icon={Layers} />
                    <StemButton deck="B" type="other" icon={Music} />
                </div>
            </div>
        </div>

        {/* Faders */}
        <div className="flex justify-between items-end h-40 px-4 mb-6">
            {/* Vol A */}
            <div className="h-full w-10 bg-black rounded-full relative border border-white/10 group">
                <div 
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-12 bg-gray-700 rounded shadow border border-gray-600 cursor-ns-resize hover:bg-gray-600 active:bg-cyan-500 transition-colors"
                    style={{ bottom: `${((state.volumeA + 60) / 66) * 80}%` }} // simplistic mapping -60 to +6db
                />
            </div>
            
            {/* VU Meters (Simulated) */}
            <div className="flex gap-1 h-full items-end pb-2">
                <div className="w-1 h-20 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 opacity-50"></div>
                <div className="w-1 h-20 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 opacity-50"></div>
            </div>

            {/* Vol B */}
            <div className="h-full w-10 bg-black rounded-full relative border border-white/10 group">
                <div 
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-12 bg-gray-700 rounded shadow border border-gray-600 cursor-ns-resize hover:bg-gray-600 active:bg-pink-500 transition-colors"
                    style={{ bottom: `${((state.volumeB + 60) / 66) * 80}%` }}
                />
            </div>
        </div>

        {/* Crossfader */}
        <div className="px-6 pb-4">
             <div className="relative h-12 bg-[#111] rounded border border-white/10 flex items-center px-2">
                <div className="absolute inset-x-2 h-1 bg-[#222] rounded-full" />
                <div className="w-0.5 h-full absolute left-1/2 bg-white/20" />
                
                <input 
                    type="range"
                    min="-1" max="1" step="0.01"
                    value={state.crossfader}
                    onChange={(e) => onChange('crossfader', parseFloat(e.target.value))}
                    className="w-full absolute inset-0 opacity-0 cursor-ew-resize z-20"
                />

                {/* Visible Fader Handle */}
                <div 
                    className="absolute h-10 w-6 bg-gradient-to-b from-gray-600 to-gray-800 rounded shadow-lg border border-gray-500 pointer-events-none transform -translate-x-1/2 transition-transform duration-75"
                    style={{ left: `${((state.crossfader + 1) / 2) * 100}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-black/50" />
                </div>
             </div>
             <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                 <span>A</span>
                 <span>CROSSFADER</span>
                 <span>B</span>
             </div>
        </div>

    </div>
  );
};

export default Mixer;