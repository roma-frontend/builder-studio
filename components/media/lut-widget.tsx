'use client';

import { useState } from 'react';
import { Sliders, Check } from 'lucide-react';

interface LutWidgetProps {
  activeLut: string;
  onLutChange: (lut: string) => void;
}

const LUTS = [
  { id: 'default', name: 'Original', desc: 'No color processing' },
  { id: 'matrix', name: 'Matrix Green', desc: 'Slight green hue, high contrast' },
  { id: 'noir', name: 'Noir Monochrome', desc: 'Grayscale film, high contrast' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Deep violet/blue shadows, vivid colors' },
  { id: 'kodachrome', name: 'Kodachrome Retro', desc: 'Warm vintage tones, rich contrast' },
];

export function LutWidget({ activeLut, onLutChange }: LutWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="mb-2 w-64 rounded-2xl border border-border/80 bg-background/90 p-3.5 backdrop-blur shadow-2xl transition-all duration-300 animate-fade-in">
          <div className="mb-2 pb-1.5 border-b border-border/60">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Cinema LUT Grading
            </h4>
            <p className="text-[9px] text-white/50 leading-tight">
              Apply a real-time cinematic color grade to the page
            </p>
          </div>
          <div className="space-y-1">
            {LUTS.map((lut) => (
              <button
                key={lut.id}
                type="button"
                onClick={() => onLutChange(lut.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-white/5 cursor-pointer ${
                  activeLut === lut.id ? 'text-primary font-bold bg-primary/5' : 'text-foreground'
                }`}
              >
                <div>
                  <div className="leading-tight">{lut.name}</div>
                  <div className="text-[9px] text-muted-foreground font-normal leading-none mt-0.5">
                    {lut.desc}
                  </div>
                </div>
                {activeLut === lut.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-all duration-300 hover:scale-105 cursor-pointer ${
          isOpen
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-border/80 bg-background/80 hover:border-primary/50 text-foreground'
        }`}
        title="LUT Color Grading"
      >
        <Sliders className={`h-4.5 w-4.5 ${isOpen ? 'animate-spin-slow' : ''}`} />
      </button>
    </div>
  );
}
