export const DURATION=24;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function poseAt(t,i,winner){
 const beat=t*2, cycle=beat%1, wave=Math.sin(beat*Math.PI), side=i%2?1:-1;
 let x=10+i*16,y=49,scale=1,body=wave*5,head=-wave*8,spin=0,jump=Math.sin(cycle*Math.PI)*5;
 let arms=[-35-wave*25,35-wave*25],legs=[wave*20,-wave*20];
 if(t<4){x+=side*110*(1-smooth(t/3));jump=Math.abs(Math.sin(t*Math.PI*4))*12;body=side*(1-smooth(t/4))*15;arms=[-100,100];}
 else if(t<8){
  // Exuberant travelling windmills: hands sweep above hats and behind hips.
  x+=Math.sin(beat*Math.PI/2)*2.5;
  arms=[-45-(beat-8)*360,45+(beat-8)*360];
  legs=[wave*42,-wave*42];jump=Math.sin(cycle*Math.PI)*11;
  body=wave*14;head=-body*.7;
 }
 else if(t<12){
  // Christmas can-can: dip, alternating hat-height kick, recover on each beat.
  // Everyone uses the same beat, so this reads as one absurd kickline.
  const kick=Math.sin(cycle*Math.PI)**2;
  const left=Math.floor(beat)%2===0;
  legs=left?[-112*kick,12*kick]:[-12*kick,112*kick];
  arms=[-95-65*kick,95+65*kick];
  jump=kick*15;body=(left?1:-1)*kick*17;head=-body*.8;
  x+=Math.sin(beat*Math.PI/2)*1.5;
 }
 else if(t<16){
  // Double-time encore, then a wave of pirouettes through the line.
  const quick=(beat*2)%1,kick=Math.sin(quick*Math.PI)**2;
  const left=Math.floor(beat*2)%2===0;
  legs=left?[-100*kick,8]:[-8,100*kick];
  const stagger=clamp((t-14-i*.12)/1.1);
  spin=360*smooth(stagger);
  arms=[-110-Math.sin(beat*Math.PI*2)*70,110+Math.sin(beat*Math.PI*2)*70];
  body=(left?1:-1)*kick*12;head=-body*.7;jump=kick*9;
 }
 else if(t<18){
  const p=smooth((t-16)/2);y-=Math.sin(i/5*Math.PI)*14*p;
  // A deep comic crouch, then a synchronised star jump on the drumroll.
  const crouch=Math.sin(clamp((t-16)/.5)*Math.PI);
  const leap=Math.sin(clamp((t-16.5)/.8)*Math.PI);
  x+=side*2*p;jump=leap*38-crouch*9;
  arms=[-50-105*leap,50+105*leap];
  legs=[-12-48*leap,12+48*leap];body=side*crouch*12;head=-body;
 }
 if(t>=18){const p=smooth((t-18)/2);const other=i<winner?i:i-1;const tx=i===winner?50:[12,28,50,72,88][other];x=x*(1-p)+tx*p;y=y*(1-p)+(i===winner?57:other===2?28:40)*p;scale=i===winner?1+p*.3:1-p*.18;
  if(i===winner){const solo=clamp((t-20)/2);spin=720*smooth(solo);jump=Math.sin(solo*Math.PI)*38;body=wave*12*(1-solo);arms=[-145-wave*65*(1-solo),145+wave*65*(1-solo)];legs=[-20-Math.sin(solo*Math.PI)*45,20+Math.sin(solo*Math.PI)*45];head=-body;}else{arms=[-115+wave*15,115+wave*15];legs=[wave*8,-wave*8];jump=2;body=side*8;head=-side*8;}
 }
 if(t>=22){spin=0;jump=0;body=i===winner?-8:side*8;head=-body;arms=i===winner?[-150,150]:[-120,120];legs=i===winner?[-24,24]:[-8,8];}
 return {x,y,scale,body,head,spin,jump,arms,legs};
}
