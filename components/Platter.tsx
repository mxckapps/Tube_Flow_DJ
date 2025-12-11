import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface PlatterProps {
  isPlaying: boolean;
  coverArt: string;
  playbackRate: number;
  onScratch: (velocity: number, isGrabbing: boolean) => void;
  color: string;
}

const Platter: React.FC<PlatterProps> = ({ isPlaying, coverArt, playbackRate, onScratch, color }) => {
  const [rotation, setRotation] = useState(0);
  const lastTime = useRef(0);
  const requestRef = useRef<number>();
  const isGrabbing = useRef(false);
  const lastMouseX = useRef(0);
  
  // Physics loop for rotation
  const animate = (time: number) => {
    if (lastTime.current !== undefined) {
      if (isPlaying && !isGrabbing.current) {
        // Normal playback rotation: 33 1/3 RPM approx
        // 360 deg / 1.8s approx per rev
        const delta = time - lastTime.current;
        const speed = 0.2 * playbackRate; 
        setRotation(r => (r + speed * delta) % 360);
      }
    }
    lastTime.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackRate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isGrabbing.current = true;
    lastMouseX.current = e.clientX;
    onScratch(0, true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isGrabbing.current) return;
      
      const deltaX = e.clientX - lastMouseX.current;
      lastMouseX.current = e.clientX;

      // Rotate platter visually
      setRotation(r => r + deltaX * 0.5);

      // Send velocity to audio engine
      // Normalize somewhat: 10px move = 1x speed roughly
      const velocity = deltaX / 10;
      onScratch(velocity, true);
    };

    const handleMouseUp = () => {
      if (isGrabbing.current) {
        isGrabbing.current = false;
        onScratch(1, false); // Return to normal
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onScratch]);

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto select-none">
       {/* Turntable Base Shadow */}
       <div className="absolute inset-0 rounded-full bg-black shadow-2xl opacity-50 transform scale-105" />
       
       {/* Main Platter */}
       <div 
        className="w-full h-full rounded-full bg-[#1a1a1a] relative border-4 border-[#2a2a2a] shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
       >
         {/* Rotating Vinyl */}
         <div 
            className="w-full h-full rounded-full relative"
            style={{ 
                transform: `rotate(${rotation}deg)`,
                background: 'conic-gradient(#111 0deg, #222 90deg, #111 180deg, #222 270deg, #111 360deg)'
            }}
         >
            {/* Vinyl Grooves Texture */}
            <div className="absolute inset-2 rounded-full border-2 border-white/5 opacity-50" />
            <div className="absolute inset-8 rounded-full border-2 border-white/5 opacity-40" />
            <div className="absolute inset-16 rounded-full border-2 border-white/5 opacity-30" />
            
            {/* Label / Cover Art */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full overflow-hidden border-4 bg-black"
                 style={{ borderColor: color }}
            >
                <img src={coverArt} alt="Cover" className="w-full h-full object-cover opacity-80" />
            </div>
         </div>

         {/* Shiny Reflection Overlay (Static) */}
         <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
       </div>

       {/* Strobe Dots (Static Decor for now) */}
       <div className="absolute -inset-2 border border-dashed border-white/10 rounded-full pointer-events-none animate-spin-slow" style={{ animationDuration: '10s' }} />
    </div>
  );
};

export default Platter;