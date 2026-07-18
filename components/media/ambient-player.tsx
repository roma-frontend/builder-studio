'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AmbientPlayerProps {
  themeId?: string;
}

export function AmbientPlayer({ themeId = 'default' }: AmbientPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Audio nodes refs for dynamic control / cleaning up
  const masterGainRef = useRef<GainNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // Map themeId to specific ambient presets
  const getSoundscapeName = () => {
    const t = themeId.toLowerCase();
    if (t.includes('tech') || t.includes('saas') || t.includes('cyber')) {
      return { name: 'Cosmic Drone', style: 'tech' };
    }
    if (t.includes('luxury') || t.includes('classic') || t.includes('hotel')) {
      return { name: 'Lofi Vinyl', style: 'vinyl' };
    }
    return { name: 'Organic Wind', style: 'wind' };
  };

  const soundscape = getSoundscapeName();

  const startAudio = async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      setIsPlaying(true);
      return;
    }

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // 1. Procedural Synthesizer (Ambient Chords)
      const synthGain = ctx.createGain();
      synthGain.gain.setValueAtTime(0.08, ctx.currentTime);
      synthGainRef.current = synthGain;

      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(320, ctx.currentTime);
      lowpassFilter.Q.setValueAtTime(1.5, ctx.currentTime);

      synthGain.connect(lowpassFilter);
      lowpassFilter.connect(masterGain);

      // Determine chord frequencies based on style
      // tech: minor 7th chord (C3, Eb3, G3, Bb3)
      // vinyl: major 7th chord (F3, A3, C4, E4)
      // wind: minor chord (D3, F3, A3)
      let freqs = [146.83, 174.61, 220.00]; // D3, F3, A3 (wind)
      if (soundscape.style === 'tech') {
        freqs = [130.81, 155.56, 196.00, 233.08]; // C3, Eb3, G3, Bb3
      } else if (soundscape.style === 'vinyl') {
        freqs = [174.61, 220.00, 261.63, 329.63]; // F3, A3, C4, E4
      }

      const oscillators: OscillatorNode[] = [];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        // Alternating wave types for a richer texture
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Detune slightly for beautiful chorus effect
        osc.detune.setValueAtTime((Math.random() - 0.5) * 8, ctx.currentTime);
        
        osc.connect(synthGain);
        osc.start();
        oscillators.push(osc);
      });
      oscillatorsRef.current = oscillators;

      // 2. Slow LFO to modulate filter frequency (adds movement)
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow modulation (80mHz)
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(120, ctx.currentTime); // modulate filter by +/- 120Hz
      
      lfo.connect(lfoGain);
      lfoGain.connect(lowpassFilter.frequency);
      lfo.start();
      lfoRef.current = lfo;

      // 3. Procedural Noise generator
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(soundscape.style === 'vinyl' ? 0.04 : 0.015, ctx.currentTime);
      noiseGainRef.current = noiseGain;

      // Fill a 2-second buffer with random floats (White Noise)
      const bufferSize = ctx.sampleRate * 2.0;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2.0 - 1.0;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Filters for noise depending on preset
      const noiseFilter = ctx.createBiquadFilter();
      if (soundscape.style === 'vinyl') {
        // Highpass filter for crackles + lowpass for dust
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1200, ctx.currentTime);
        noiseFilter.Q.setValueAtTime(0.8, ctx.currentTime);
      } else {
        // Soft lowpass filter for wind roar
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(180, ctx.currentTime);
      }

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start();
      noiseSourceRef.current = noiseSource;

      // Fade in master gain slowly to avoid pops
      masterGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 2.0);
      setIsPlaying(true);
    } catch (e) {
      console.error('Failed to initialize Web Audio:', e);
    }
  };

  const stopAudio = () => {
    if (!masterGainRef.current || !audioCtxRef.current) return;
    
    const ctx = audioCtxRef.current;
    masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
    masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
    
    setTimeout(() => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'suspended') {
        audioCtxRef.current.suspend();
      }
      setIsPlaying(false);
    }, 1000);
  };

  const togglePlayback = () => {
    if (!hasInteracted) setHasInteracted(true);
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  // Auto-listen for interaction to warm up audio context
  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      // Clean listeners
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('scroll', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
    };
  }, []);

  // Clean up nodes on unmount
  useEffect(() => {
    return () => {
      try {
        oscillatorsRef.current.forEach((osc) => osc.stop());
        if (noiseSourceRef.current) noiseSourceRef.current.stop();
        if (lfoRef.current) lfoRef.current.stop();
        if (audioCtxRef.current) audioCtxRef.current.close();
      } catch {
        /* ignore cleanups if context is already dead */
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <button
        type="button"
        onClick={togglePlayback}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/80 bg-background/80 hover:bg-background/90 text-xs font-medium backdrop-blur shadow-lg transition-all duration-300 hover:border-primary/50 text-foreground cursor-pointer group"
      >
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
          {isPlaying ? (
            <Volume2 className="h-3 w-3" />
          ) : (
            <VolumeX className="h-3 w-3 text-muted-foreground" />
          )}
        </span>

        <div className="flex flex-col items-start pr-1">
          <span className="text-[10px] leading-tight text-muted-foreground font-semibold uppercase tracking-wider">
            {soundscape.name}
          </span>
          <span className="text-[9px] leading-none text-white/50">
            {isPlaying ? 'Synthesizer Active' : 'Sound Ambient'}
          </span>
        </div>

        {isPlaying && (
          <span className="flex items-center gap-0.5 h-3 shrink-0 pl-1">
            <span className="w-0.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_100ms] h-2" />
            <span className="w-0.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_300ms] h-3.5" />
            <span className="w-0.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_200ms] h-1.5" />
            <span className="w-0.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_400ms] h-2.5" />
          </span>
        )}
      </button>
    </div>
  );
}
