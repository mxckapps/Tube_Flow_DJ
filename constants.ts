export const COLORS = {
  bg: '#121212',
  surface: '#1E1E1E',
  surfaceHighlight: '#2A2A2A',
  deckA: '#00F0FF', // Neon Cyan
  deckB: '#FF0055', // Neon Magenta
  text: '#E0E0E0',
  textDim: '#888888',
  accent: '#FFFFFF',
};

export const DEFAULTS = {
  crossfader: 0,
  volume: -6, // dB
  eq: { high: 0, mid: 0, low: 0 },
};

// Fallback tracks if proxy isn't running
// Using internal:// protocol to trigger client-side generation
export const DEMO_TRACKS = [
  {
    title: "Cyber Breaker",
    artist: "Procedural Engine",
    url: "internal://breakbeat", 
    coverArt: "https://picsum.photos/400/400?random=1",
    bpm: 130
  },
  {
    title: "Deep Logic",
    artist: "Procedural Engine",
    url: "internal://house", 
    coverArt: "https://picsum.photos/400/400?random=2",
    bpm: 124
  }
];

// In production, this should be set via VITE_PROXY_URL or REACT_APP_PROXY_URL
// If running locally, it defaults to localhost:8080 (Cloud Run / Express default)
// IMPORTANT: You must deploy the server/index.js separately to a Node.js host.
const ENV_URL = (import.meta as any).env?.VITE_PROXY_URL;
export const PROXY_URL = ENV_URL || 'http://localhost:8080/stream?url=';