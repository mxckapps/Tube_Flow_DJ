import { useEffect, useState } from 'react';

export interface MidiMessage {
  channel: number;
  cc: number;
  value: number; // 0-127
}

export const useMidi = (onMessage: (msg: MidiMessage) => void) => {
  const [access, setAccess] = useState<any>(null);

  useEffect(() => {
    const nav = navigator as any;
    if (nav.requestMIDIAccess) {
      nav.requestMIDIAccess()
        .then((midiAccess: any) => {
          setAccess(midiAccess);
          
          const inputs = midiAccess.inputs.values();
          for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            input.value.onmidimessage = (event: any) => {
               const data = event.data;
               if (!data) return;
               
               // Basic MIDI parsing
               // Status byte: 0xB0 to 0xBF is Control Change for Ch 1-16
               const status = data[0] & 0xF0;
               if (status === 0xB0) {
                 const channel = data[0] & 0x0F;
                 const cc = data[1];
                 const val = data[2];
                 onMessage({ channel, cc, value: val });
               }
            };
          }
        })
        .catch((err: any) => console.error("MIDI access denied/failed", err));
    }
  }, [onMessage]);

  return access;
};