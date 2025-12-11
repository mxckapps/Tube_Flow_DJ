import React, { useState, useRef, useEffect } from 'react';

interface KnobProps {
  label: string;
  value: number; // min to max
  min: number;
  max: number;
  onChange: (val: number) => void;
  color?: string;
  size?: number;
}

const Knob: React.FC<KnobProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  onChange, 
  color = '#00F0FF', 
  size = 60 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startValue = useRef<number>(0);

  // Map value to angle (-135 to 135 degrees)
  const percent = (value - min) / (max - min);
  const angle = -135 + (percent * 270);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dy = startY.current - e.clientY;
      const sensitivity = 200; // pixels for full range
      const delta = (dy / sensitivity) * (max - min);
      
      let newValue = startValue.current + delta;
      newValue = Math.max(min, Math.min(max, newValue));
      
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, max, min, onChange]);

  return (
    <div className="flex flex-col items-center gap-2 select-none group">
      <div 
        className="relative cursor-ns-resize"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        {/* Background Ring */}
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="40" 
            fill="none" 
            stroke="#333" 
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset="62.8" /* partial circle */
            transform="rotate(135 50 50)"
          />
          {/* Active Ring */}
          <circle 
            cx="50" cy="50" r="40" 
            fill="none" 
            stroke={color} 
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 * (1 - (percent * 0.75))} /* Map 0-1 to arc length */
            strokeLinecap="round"
            transform="rotate(135 50 50)"
            className="transition-all duration-75"
          />
        </svg>
        
        {/* Indicator Line (Knob cap) */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-white/10 shadow-lg"
          style={{ 
            background: 'radial-gradient(circle at 30% 30%, #444, #111)',
            transform: `rotate(${angle}deg)`
          }}
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-white rounded-full shadow-[0_0_5px_white]" />
        </div>
      </div>
      <span className="text-xs font-mono text-gray-400 font-bold group-hover:text-white transition-colors">{label}</span>
    </div>
  );
};

export default Knob;