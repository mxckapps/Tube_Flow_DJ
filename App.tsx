import React, { useState, useEffect } from 'react';
import Deck from './components/Deck';
import Mixer from './components/Mixer';
import AudioEngine from './services/audioEngine';
import { useMidi, MidiMessage } from './services/midiService';
import { DeckId, DeckState, MixerState, StemState, StemType } from './types';
import { COLORS, DEMO_TRACKS, PROXY_URL, DEFAULTS } from './constants';
import { Search, Volume2, AlertCircle, Terminal, X, HelpCircle, Server, CheckCircle2, Music, Menu } from 'lucide-react';

const INITIAL_DECK: DeckState = {
  id: 'A',
  title: '',
  artist: '',
  bpm: 0,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  playbackRate: 1,
  volume: -6,
  isLoaded: false,
  coverArt: '',
  errorMessage: null
};

const INITIAL_MIXER: MixerState = {
  crossfader: DEFAULTS.crossfader,
  volumeA: -6,
  volumeB: -6,
  eqA: { ...DEFAULTS.eq },
  eqB: { ...DEFAULTS.eq },
};

export default function App() {
  const [deckA, setDeckA] = useState<DeckState>({ ...INITIAL_DECK, id: 'A' });
  const [deckB, setDeckB] = useState<DeckState>({ ...INITIAL_DECK, id: 'B' });
  const [mixer, setMixer] = useState<MixerState>(INITIAL_MIXER);
  const [loading, setLoading] = useState<Record<DeckId, boolean>>({ A: false, B: false });
  const [showHelp, setShowHelp] = useState(false);
  
  const [stemsA, setStemsA] = useState<StemState>({ vocals: true, drums: true, bass: true, other: true });
  const [stemsB, setStemsB] = useState<StemState>({ vocals: true, drums: true, bass: true, other: true });

  const [urlInput, setUrlInput] = useState('');
  const [searchDeck, setSearchDeck] = useState<DeckId>('A');
  
  // Combine errors for display
  const [activeError, setActiveError] = useState<{deck: DeckId, msg: string} | null>(null);

  const engine = AudioEngine.getInstance();

  useEffect(() => {
    // Initialize Audio Engine
    const init = async () => {
      await engine.initialize();
      // Auto load demos for immediate fun
      loadTrack('A', DEMO_TRACKS[0]);
      loadTrack('B', DEMO_TRACKS[1]);
    };
    // Wait for user interaction realistically, but for this demo we assume interaction
    const handleStart = () => {
        init();
        window.removeEventListener('click', handleStart);
    };
    window.addEventListener('click', handleStart);
    return () => window.removeEventListener('click', handleStart);
  }, []);

  const loadTrack = async (deckId: DeckId, track: any) => {
    // Show Loading State
    setLoading(prev => ({ ...prev, [deckId]: true }));
    setActiveError(null);
    
    // In a real app, track.url would be passed to the proxy: `${PROXY_URL}${encodeURIComponent(track.url)}`
    // For this demo, we use the direct URL if it's a demo track
    const audioUrl = track.url; 
    
    // Check if the load was successful (True) or if we fell back to simulation (False)
    const result = await engine.loadTrack(deckId, audioUrl);
    const success = result.success;
    
    if (!success && result.error) {
        setActiveError({ deck: deckId, msg: result.error });
    }
    
    const update = (s: DeckState) => ({
        ...s,
        title: success ? track.title : `Simulation Mode`,
        artist: success ? track.artist : "Procedural Engine Fallback",
        bpm: success ? track.bpm : 128,
        coverArt: success ? track.coverArt : "https://placehold.co/400x400/222/FFF?text=OFFLINE",
        isLoaded: true,
        duration: 180, // Mock duration
        errorMessage: success ? null : result.error // Store error for UI
    });

    if (deckId === 'A') setDeckA(update);
    else setDeckB(update);

    setLoading(prev => ({ ...prev, [deckId]: false }));
  };

  const handleUrlLoad = async (e: React.FormEvent) => {
      e.preventDefault();
      // Basic validation
      if (!urlInput) return;
      
      const trackMock = {
          title: "YouTube Stream",
          artist: "External Source",
          url: `${PROXY_URL}${encodeURIComponent(urlInput)}`,
          bpm: 128, // In a real app, we'd analyze this
          coverArt: "https://placehold.co/400x400/000/FFF?text=YT"
      };
      
      await loadTrack(searchDeck, trackMock);
      setUrlInput('');
  };

  const loadDemo = (deckId: DeckId) => {
      const demo = deckId === 'A' ? DEMO_TRACKS[0] : DEMO_TRACKS[1];
      loadTrack(deckId, demo);
  };

  const handleMidi = (msg: MidiMessage) => {
      // Very basic MIDI mapping example
      // CC 1 = Crossfader
      if (msg.cc === 1) {
          const val = (msg.value / 127) * 2 - 1; // Map 0..127 to -1..1
          setMixer(m => ({ ...m, crossfader: val }));
          engine.setCrossfader(val);
      }
  };

  useMidi(handleMidi);

  // Sync mixer state to engine
  const updateMixer = (key: keyof MixerState, val: any) => {
      setMixer(prev => {
          const next = { ...prev, [key]: val };
          
          if (key === 'crossfader') engine.setCrossfader(val);
          if (key === 'eqA') {
              engine.setEQ('A', 'low', val.low);
              engine.setEQ('A', 'mid', val.mid);
              engine.setEQ('A', 'high', val.high);
          }
          if (key === 'eqB') {
              engine.setEQ('B', 'low', val.low);
              engine.setEQ('B', 'mid', val.mid);
              engine.setEQ('B', 'high', val.high);
          }
          
          return next;
      });
  };

  const handleStemToggle = (deck: DeckId, stem: StemType) => {
      const setter = deck === 'A' ? setStemsA : setStemsB;
      setter(prev => {
          const next = { ...prev, [stem]: !prev[stem] };
          // In real implementation, this would route channels in Tone.js
          return next;
      });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/5 bg-[#1a1a1a] flex items-center px-6 justify-between shadow-lg z-20">
          <div className="flex items-center gap-4">
              <div className="text-2xl font-black tracking-tighter italic bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
                  TUBE FLOW DJ
              </div>
              <div className="text-xs font-mono text-gray-500 hidden md:block">PRO AUDIO ENGINE v1.0</div>
          </div>

          {/* Search/Load */}
          <form onSubmit={handleUrlLoad} className="flex-1 max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                  <input 
                    type="text" 
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="Paste YouTube URL or Stream Link..." 
                    className="w-full bg-black/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
              </div>
              <select 
                className="bg-black/50 border border-white/10 rounded-full px-4 text-sm font-mono focus:outline-none"
                value={searchDeck}
                onChange={(e) => setSearchDeck(e.target.value as DeckId)}
              >
                  <option value="A">DECK A</option>
                  <option value="B">DECK B</option>
              </select>
              <button 
                type="submit" 
                disabled={loading[searchDeck]}
                className="bg-white/10 hover:bg-white/20 px-6 rounded-full text-xs font-bold transition-colors disabled:opacity-50"
              >
                  {loading[searchDeck] ? "LOADING..." : "LOAD"}
              </button>
              
              <div className="w-px bg-white/10 mx-2"></div>
              
              <button
                type="button"
                onClick={() => loadDemo(searchDeck)}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-4 rounded-full text-xs font-bold transition-colors flex items-center gap-2 border border-cyan-500/20"
                title="Use offline demo track (No Server Needed)"
              >
                  <Music size={12} />
                  DEMO
              </button>
          </form>

          <div className="flex items-center gap-4">
               <button 
                  onClick={() => setShowHelp(true)}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-cyan-400 transition-colors"
                  title="Server Setup Help"
               >
                   <HelpCircle size={20} />
               </button>
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20" />
          </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-8 overflow-hidden flex flex-col md:flex-row gap-8 items-start justify-center relative">
          
          {/* Setup Guide Modal */}
          {showHelp && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative">
                    <button 
                        onClick={() => setShowHelp(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-cyan-500/20 rounded-full">
                            <Server className="text-cyan-400" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Setup Backend Server</h2>
                            <p className="text-gray-400 text-sm">Required for YouTube streaming to work</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-2xl font-mono text-gray-600 font-bold">01</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white mb-1">Open a New Terminal</h3>
                                <p className="text-sm text-gray-400 mb-2">
                                    Go to your <b>Code Editor</b> tab (where you see the files).<br/>
                                    Click the <b>Menu Icon <Menu size={12} className="inline"/></b> (top-left) <br/>
                                    Go to <b>Terminal</b> &rarr; <b>New Terminal</b>.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-2xl font-mono text-gray-600 font-bold">02</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white mb-1">Run the Server</h3>
                                <p className="text-sm text-gray-400 mb-3">
                                    Paste this command into the black terminal box at the bottom and press <b>Enter</b>:
                                </p>
                                <div className="bg-black border border-white/20 rounded-lg p-3 font-mono text-xs text-green-400 flex justify-between items-center group">
                                    <code>node server/index.js</code>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText('node server/index.js')}
                                        className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={() => setShowHelp(false)}
                            className="bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-cyan-400 transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* Detailed Error Banner */}
          {activeError && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 w-full max-w-lg">
                  <div className="bg-[#1a1111] border border-red-500/50 rounded-lg p-4 shadow-2xl backdrop-blur-md flex gap-4 items-start">
                      <div className="bg-red-500/20 p-2 rounded-full shrink-0">
                          <AlertCircle className="text-red-500" size={24} />
                      </div>
                      <div className="flex-1">
                          <h4 className="font-bold text-red-200 text-sm mb-1">
                              Connection Failed (Deck {activeError.deck})
                          </h4>
                          <p className="text-red-200/70 text-xs font-mono mb-2">
                              {activeError.msg}
                          </p>
                          
                          {activeError.msg.includes('node server') && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                  <button 
                                    onClick={() => setShowHelp(true)}
                                    className="bg-red-500/20 hover:bg-red-500/40 text-red-200 text-[10px] font-bold px-3 py-1 rounded-full border border-red-500/30 transition-colors flex items-center gap-2"
                                  >
                                      <Terminal size={12} />
                                      SETUP SERVER
                                  </button>
                                  <button 
                                    onClick={() => loadDemo(activeError.deck)}
                                    className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 transition-colors flex items-center gap-2"
                                  >
                                      <Music size={12} />
                                      PLAY DEMO INSTEAD
                                  </button>
                              </div>
                          )}
                      </div>
                      <button 
                          onClick={() => setActiveError(null)}
                          className="text-gray-500 hover:text-white transition-colors"
                      >
                          <X size={16} />
                      </button>
                  </div>
              </div>
          )}

          {/* Background Ambient Light */}
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[128px] pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-[128px] pointer-events-none" />

          {/* Deck A */}
          <div className="flex-1 w-full max-w-2xl z-10 relative">
              {loading.A && (
                  <div className="absolute inset-0 z-50 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
                  </div>
              )}
              <Deck 
                id="A" 
                state={deckA} 
                color={COLORS.deckA} 
                onStateChange={s => setDeckA(prev => ({...prev, ...s}))} 
              />
          </div>

          {/* Mixer */}
          <div className="shrink-0 z-20 mt-12 md:mt-0">
             <Mixer 
                state={mixer} 
                onChange={updateMixer}
                stemsA={stemsA}
                stemsB={stemsB}
                onStemToggle={handleStemToggle}
             />
          </div>

          {/* Deck B */}
          <div className="flex-1 w-full max-w-2xl z-10 relative">
              {loading.B && (
                  <div className="absolute inset-0 z-50 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <div className="animate-spin w-8 h-8 border-pink-500 border-t-transparent rounded-full"></div>
                  </div>
              )}
              <Deck 
                id="B" 
                state={deckB} 
                color={COLORS.deckB} 
                onStateChange={s => setDeckB(prev => ({...prev, ...s}))} 
              />
          </div>

      </main>
      
      <footer className="h-8 bg-black flex items-center justify-between px-6 text-[10px] text-gray-600 font-mono">
          <div>MIDI: {navigator.requestMIDIAccess ? "ACTIVE" : "UNAVAILABLE"}</div>
          <div>BUFFER: 1024 SPL</div>
      </footer>
    </div>
  );
}