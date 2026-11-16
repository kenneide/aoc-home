// Original toy-orchestra arrangement of the public-domain Jingle Bells melody.
// No sampled recordings or external audio requests. 120 BPM, 24 seconds.
export const BEAT = .5;
export const melody = [
 [76,1],[76,1],[76,2],[76,1],[76,1],[76,2],
 [76,1],[79,1],[72,1.5],[74,.5],[76,4],
 [77,1],[77,1],[77,1.5],[77,.5],[77,1],[76,1],[76,1],[76,.5],[76,.5],
 [76,1],[74,1],[74,1],[76,1],[74,2],[79,2]
];
export function createMusic() {
 let ctx, bus, origin=0, muted=false, sources=[];
 function tone(note,time,duration,volume=.1,type='triangle') {
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=440*2**((note-69)/12);
  g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+duration);
  o.connect(g).connect(bus);o.start(time);o.stop(time+duration+.02);sources.push(o);
 }
 function bell(time,volume=.025){[91,103,110].forEach((n,i)=>tone(n,time,.09,volume/(i+1),'sine'))}
 function stop(){for(const s of sources){try{s.stop()}catch{}}sources=[]}
 return {
  async start(){stop();try{ctx??=new AudioContext();bus??=ctx.createGain();bus.disconnect();bus.connect(ctx.destination);bus.gain.value=muted?.0:.65;await ctx.resume();origin=ctx.currentTime+.06;
   let beat=0;for(const [note,length] of melody){tone(note,origin+beat*BEAT,length*BEAT*.85,.11);tone(note+12,origin+beat*BEAT,.18,.035,'sine');beat+=length}
   // Entrance pickup and a complete recognisable chorus, followed by a comic build.
   for(let b=0;b<44;b++){const at=origin+b*BEAT;if(b<36){bell(at);bell(at+.25,.013);const root=[48,48,53,55][Math.floor(b/8)%4];tone(b%2?root+7:root,at,.22,.09);if(b%2===0)[root+12,root+16,root+19].forEach(n=>tone(n,at+.25,.12,.025));}else {for(let j=0;j<4;j++){tone(45+(b-36)*2,at+j*.125,.06,.04,'triangle');bell(at+j*.125,.01)}}}
   [48,60,64,67,72,79,84].forEach(n=>tone(n,origin+22,1.6,.065));[22,22.25,22.5,23].forEach(t=>bell(origin+t,.04));
   return true;
  }catch{return false}},
  time(){return ctx?Math.max(0,ctx.currentTime-origin):null},
  stop, mute(value){muted=value;if(bus)bus.gain.value=muted?0:.65},
  dispose(){stop();ctx?.close()}
 };
}
