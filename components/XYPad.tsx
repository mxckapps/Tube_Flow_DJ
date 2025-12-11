import React, { useRef, useState, useEffect } from 'react';
import { EffectState } from '../types';

interface XYPadProps {
  color: string;
  effectState: EffectState;
  onChange: (cutoff: number, resonance: number) => void;
}

const XYPad: React.FC<XYPadProps> = ({ color, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 }); // Normalized 0-1
  const [active, setActive] = useState(false);

  const update = (clientX: number, clientY: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    
    setPosition({ x, y });
    
    // Map X to Cutoff (20Hz - 20kHz log scale approx)
    // Map Y to Resonance (0 - 1)
    const cutoff = 20 * Math.pow(1000, x); 
    const resonance = 1 - y; // Y is 0 at top, so 1-y makes top high res
    
    onChange(cutoff, resonance);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setActive(true);
    update(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!active) return;
      update(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setActive(false);
      // Reset filter on release? Usually yes for momentary pads, or no for latch
      // Let's implement Momentary style reset for dramatic DJ effect
       onChange(20000, 0); 
       setPosition({ x: 1, y: 1 });
    };

    if (active) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [active, onChange]);

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div 
        ref={ref}
        className="relative w-full aspect-square bg-white/5 rounded-lg border border-white/10 overflow-hidden cursor-crosshair shadow-inner"
        onMouseDown={handleMouseDown}
      >
        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
               backgroundSize: '20px 20px'
             }} 
        />
        
        {/* Cursor */}
        <div 
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] pointer-events-none transition-transform duration-75"
          style={{ 
            left: `${position.x * 100}%`, 
            top: `${position.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: active ? color : 'transparent'
          }}
        />
        
        {/* Label Overlay */}
        <div className="absolute bottom-2 left-2 text-[10px] text-gray-500 font-mono pointer-events-none">
          FLTR/RES
        </div>
      </div>
    </div>
  );
};

export default XYPad;