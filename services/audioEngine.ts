import * as Tone from 'tone';
import { DeckId, StemType } from '../types';

interface LoadResult {
    success: boolean;
    error?: string;
}

class AudioEngine {
  private static instance: AudioEngine;
  
  // Tone.js nodes
  public players: Record<DeckId, Tone.Player>;
  public eqs: Record<DeckId, Tone.EQ3>;
  public filters: Record<DeckId, Tone.Filter>;
  public channelMergers: Record<DeckId, Tone.Channel>;
  public crossfader: Tone.CrossFade;
  
  // Simulated Stems (EQ/Filter Banks)
  private stemFilters: Record<DeckId, Record<StemType, Tone.Filter>>;

  // Concurrency lock
  private loadingPromises: Record<DeckId, Promise<LoadResult> | null> = { A: null, B: null };
  
  private constructor() {
    this.players = {
      A: new Tone.Player(),
      B: new Tone.Player(),
    };
    
    // EQ3: Low, Mid, High
    this.eqs = {
      A: new Tone.EQ3(0, 0, 0),
      B: new Tone.EQ3(0, 0, 0),
    };

    // Main Filter for XY Pad
    this.filters = {
      A: new Tone.Filter(20000, "lowpass"),
      B: new Tone.Filter(20000, "lowpass"),
    };

    this.stemFilters = {
      A: this.createStemFilters(),
      B: this.createStemFilters()
    };

    this.channelMergers = {
      A: new Tone.Channel(),
      B: new Tone.Channel(),
    };

    this.crossfader = new Tone.CrossFade(0.5);

    this.setupChain('A');
    this.setupChain('B');

    // Master Output
    this.crossfader.toDestination();
  }

  private createStemFilters(): Record<StemType, Tone.Filter> {
    return {
      vocals: new Tone.Filter(0, "peaking"),
      drums: new Tone.Filter(0, "peaking"),
      bass: new Tone.Filter(0, "peaking"),
      other: new Tone.Filter(0, "peaking"),
    };
  }

  private setupChain(deck: DeckId) {
    const player = this.players[deck];
    const eq = this.eqs[deck];
    const filter = this.filters[deck];
    const channel = this.channelMergers[deck];

    // Chain: Player -> EQ -> Filter -> Channel -> Crossfader
    player.chain(eq, filter, channel);
    
    if (deck === 'A') {
      channel.connect(this.crossfader.a);
    } else {
      channel.connect(this.crossfader.b);
    }
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initialize() {
    await Tone.start();
  }

  /**
   * Generates a 10-second audio buffer client-side.
   * Uses explicit linear scheduling with collision prevention to avoid Tone.Offline errors.
   */
  private async generateDemoBuffer(style: 'breakbeat' | 'house'): Promise<Tone.ToneAudioBuffer> {
     return await Tone.Offline(({ transport }) => {
        // Use MembraneSynth for Kick/Bass
        const kick = new Tone.MembraneSynth({
            envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }
        }).toDestination();
        
        // Use NoiseSynth for Hats/Snare (More stable than MetalSynth in Offline)
        const hat = new Tone.NoiseSynth({
            envelope: { attack: 0.001, decay: 0.1, sustain: 0 },
            volume: -10
        }).toDestination();

        const bass = new Tone.MembraneSynth({
            pitchDecay: 0.01,
            octaves: 2,
            envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.5 },
            volume: -5
        }).toDestination();

        const bpm = style === 'breakbeat' ? 130 : 124;
        const spb = 60 / bpm; 
        
        // Generate 4 measures
        const measures = 4;
        
        for(let i=0; i < measures * 4; i++) {
            const beatTime = i * spb;
            const beatInMeasure = i % 4; // 0, 1, 2, 3
            
            if (style === 'house') {
                // House: Kick on every beat
                kick.triggerAttackRelease("C2", 0.1, beatTime);
                
                // Hat on offbeat (beatTime + 0.5*spb)
                // No conflict with downbeat because it's a different time
                hat.triggerAttackRelease("16n", beatTime + (spb * 0.5));
                
                // Bass on offbeat
                bass.triggerAttackRelease("C2", 0.2, beatTime + (spb * 0.5));

            } else {
                // Breakbeat Pattern
                
                // Kick Logic: Beats 1 and 3, plus syncopation
                if (beatInMeasure === 0) {
                     kick.triggerAttackRelease("C2", 0.1, beatTime);
                } else if (beatInMeasure === 2) {
                     kick.triggerAttackRelease("C2", 0.1, beatTime);
                     // Ghost kick
                     kick.triggerAttackRelease("C2", 0.1, beatTime + (spb * 0.75));
                }

                // Hat/Snare Logic
                // Snare usually on 2 and 4 (Indices 1 and 3)
                if (beatInMeasure === 1 || beatInMeasure === 3) {
                     // Loud Snare hit
                     hat.triggerAttackRelease("8n", beatTime, 1);
                } else {
                     // Quiet Hat on 1 and 3
                     hat.triggerAttackRelease("32n", beatTime, 0.3);
                }

                // Offbeat hats (always safe, different time)
                hat.triggerAttackRelease("32n", beatTime + (spb * 0.5), 0.5);
            }
        }
        
        transport.start(0);
     }, 10);
  }

  /**
   * Creates a silent buffer as a last resort fallback.
   */
  private createSilentBuffer(): Tone.ToneAudioBuffer {
      // Create a 1 second silent buffer
      const buffer =  Tone.context.createBuffer(2, Tone.context.sampleRate, Tone.context.sampleRate);
      return new Tone.ToneAudioBuffer(buffer);
  }

  public async loadTrack(deck: DeckId, url: string): Promise<LoadResult> {
    if (this.loadingPromises[deck]) {
        return this.loadingPromises[deck]!;
    }

    // Wrap the operation to return true (success) or false (fallback used)
    this.loadingPromises[deck] = (async (): Promise<LoadResult> => {
        try {
            this.players[deck].stop();
            const cleanUrl = url ? url.trim() : '';
            
            if (!cleanUrl) return { success: false, error: 'Empty URL' };

            if (cleanUrl.startsWith('internal://')) {
                const style = cleanUrl.replace('internal://', '') as 'breakbeat' | 'house';
                const validStyle = (style === 'breakbeat' || style === 'house') ? style : 'house';
                const buffer = await this.generateDemoBuffer(validStyle);
                this.players[deck].buffer = buffer;
                this.players[deck].loop = true;
                return { success: true }; // Internal load considered success
            } else {
                // Network Connectivity Check
                // We attempt to fetch just the headers first.
                // This allows us to fail fast with a descriptive error if the server is down or blocked.
                try {
                  const res = await fetch(cleanUrl, { method: 'HEAD' });
                  if (!res.ok) {
                    throw new Error(`Server returned ${res.status} ${res.statusText}`);
                  }
                } catch (netErr: any) {
                  // If this fails, it's likely a network/server issue, not a Tone.js issue.
                  let friendlyMsg = netErr.message;
                  if (netErr.message.includes('Failed to fetch')) {
                    friendlyMsg = "Server Unreachable (Is 'node server' running?)";
                  }
                  throw new Error(friendlyMsg);
                }

                // External load attempt with Timeout
                // Race the load against a 60s timeout (increased from 2.5s)
                // Cloud Run cold starts or large audio files can take time.
                await Promise.race([
                    this.players[deck].load(cleanUrl),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connection Timeout (60s)')), 60000))
                ]);
                return { success: true }; // External load success
            }
        } catch (e: any) {
            // Log as warning instead of error to prevent "Failed to fetch" spam in console
            // when backend is offline.
            const msg = e.message || 'Unknown Error';
            console.warn(`AudioEngine: Connection to proxy failed or timed out for ${deck}. Reason: ${msg}`);
            
            // Fallback: Generate a beat so the user has something to play
            try {
                const style = deck === 'A' ? 'breakbeat' : 'house';
                const safeBuffer = await this.generateDemoBuffer(style);
                this.players[deck].buffer = safeBuffer;
                this.players[deck].loop = true;
            } catch (fatal) {
                console.error("Fatal audio engine error", fatal);
                const silent = this.createSilentBuffer();
                this.players[deck].buffer = silent;
            }
            return { success: false, error: msg }; // Indicating fallback was used with reason
        }
    })();

    return this.loadingPromises[deck]!.finally(() => {
        this.loadingPromises[deck] = null;
    });
  }

  public play(deck: DeckId) {
    if (this.players[deck].loaded) {
      this.players[deck].start();
    }
  }

  public pause(deck: DeckId) {
    this.players[deck].stop(); 
  }

  // Scratch Physics: we control playbackRate directly
  public scratch(deck: DeckId, velocity: number, isGrabbing: boolean) {
    const player = this.players[deck];
    if (!player.loaded) return;

    if (isGrabbing) {
        // velocity is negative when moving left, positive when right
        const rate = velocity * 2;
        
        // Tone.js PlaybackRate Param cannot be negative.
        // We simulate negative scratch by using reverse.
        if (rate < 0) {
            player.reverse = true;
            player.playbackRate = Math.abs(rate);
        } else {
            player.reverse = false;
            player.playbackRate = rate;
        }
    } else {
        // Release
        player.reverse = false;
        player.playbackRate = 1; 
    }
  }

  public setVolume(deck: DeckId, db: number) {
    this.channelMergers[deck].volume.rampTo(db, 0.1);
  }

  public setCrossfader(val: number) {
    const norm = (val + 1) / 2;
    this.crossfader.fade.rampTo(norm, 0.05);
  }

  public setEQ(deck: DeckId, band: 'low' | 'mid' | 'high', val: number) {
    this.eqs[deck][band].value = val;
  }

  public setFilter(deck: DeckId, cutoff: number, resonance: number) {
    this.filters[deck].frequency.rampTo(cutoff, 0.1);
    this.filters[deck].Q.value = resonance * 10;
  }

  public setPlaybackRate(deck: DeckId, rate: number) {
    if (this.players[deck].loaded) {
        const safeRate = Math.max(0, rate);
        this.players[deck].playbackRate = safeRate;
        this.players[deck].reverse = false; 
    }
  }
}

export default AudioEngine;