/** A quiet low rumble on the game's existing, user-enabled AudioContext.
 * One looping noise source and oscillator; no autoplay, new contexts or timers. */
export function createSandWormAudio(audio){
  if(!audio||audio.state!=='running'||!Number.isFinite(audio.currentTime))return null;
  if(!Number.isFinite(audio.sampleRate)||audio.sampleRate<=0)throw new TypeError('Sand worm rumble needs a valid audio sample rate.');
  const nodes=[],sources=[];let finished=false,resolveEnded;
  const ended=new Promise(resolve=>{resolveEnded=resolve;});
  const keep=(node,source=false)=>{nodes.push(node);if(source)sources.push(node);return node;};
  function stop(){
    if(finished)return;finished=true;audio.removeEventListener?.('statechange',onStateChange);
    for(const source of sources){source.onended=null;try{source.stop(audio.currentTime);}catch{}if('buffer'in source)source.buffer=null;}
    for(const node of nodes){try{node.disconnect();}catch{}}resolveEnded();
  }
  function onStateChange(){if(audio.state!=='running')stop();}
  try{
    const gain=keep(audio.createGain()),filter=keep(audio.createBiquadFilter());
    const noise=keep(audio.createBufferSource(),true),bass=keep(audio.createOscillator(),true),bassGain=keep(audio.createGain());
    gain.gain.setValueAtTime(0,audio.currentTime);filter.type='lowpass';filter.frequency.setValueAtTime(115,audio.currentTime);filter.Q.setValueAtTime(.55,audio.currentTime);
    const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate),audio.sampleRate),samples=buffer.getChannelData(0);let random=0x5a7d;
    for(let i=0;i<samples.length;i++){random=(Math.imul(random,1664525)+1013904223)>>>0;samples[i]=(random/2147483648-1)*.7;}
    noise.buffer=buffer;noise.loop=true;noise.connect(filter);filter.connect(gain);
    bass.type='sine';bass.frequency.setValueAtTime(37,audio.currentTime);bassGain.gain.setValueAtTime(.18,audio.currentTime);
    bass.connect(bassGain);bassGain.connect(gain);gain.connect(audio.destination);
    for(const source of sources)source.start(audio.currentTime);
    audio.addEventListener?.('statechange',onStateChange);
    return {ended,stop,update(intensity){
      if(finished)return;if(audio.state!=='running'){stop();return;}
      const level=Math.max(0,Math.min(1,Number.isFinite(intensity)?intensity:0));
      gain.gain.setTargetAtTime(level*.12,audio.currentTime,.12);bass.frequency.setTargetAtTime(32+level*23,audio.currentTime,.18);
    }};
  }catch(error){stop();throw error;}
}
