export const DURATION=24;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function poseAt(t,i,winner){
 const beat=t*2, cycle=beat%1, wave=Math.sin(beat*Math.PI), side=i%2?1:-1;
 let x=10+i*16,y=49,scale=1,body=wave*5,head=-wave*8,spin=0,jump=Math.sin(cycle*Math.PI)*5;
 let arms=[-35-wave*25,35-wave*25],legs=[wave*20,-wave*20];
 if(t<4){x+=side*110*(1-smooth(t/3));jump=Math.abs(Math.sin(t*Math.PI*4))*12;body=side*(1-smooth(t/4))*15;arms=[-100,100];}
 else if(t<8){x+=Math.sin(beat*Math.PI/2)*3;arms=[-65-wave*45,65-wave*45];legs=[wave*35,-wave*35];}
 else if(t<12){const kick=Math.max(0,Math.sin(cycle*Math.PI));legs= Math.floor(beat)%2?[-kick*65,10]:[-10,kick*65];arms=[-115,115];jump=kick*9;head=side*10;}
 else if(t<16){const stagger=clamp((t-12-i*.18)/1.3);spin=360*smooth(stagger);x+=Math.sin((t-12)*Math.PI)*2;arms=[-120+wave*25,120+wave*25];legs=[Math.sin(beat*2*Math.PI+i*.4)*35,-Math.sin(beat*2*Math.PI+i*.4)*35];}
 else if(t<18){const p=smooth((t-16)/2);y-=Math.sin(i/5*Math.PI)*14*p;x+=side*3*p;jump=Math.sin(clamp((t-16.5)/.7)*Math.PI)*27;arms=[-145,145];}
 if(t>=18){const p=smooth((t-18)/2);const other=i<winner?i:i-1;const tx=i===winner?50:[12,28,50,72,88][other];x=x*(1-p)+tx*p;y=y*(1-p)+(i===winner?57:other===2?28:40)*p;scale=i===winner?1+p*.3:1-p*.18;
  if(i===winner){const solo=clamp((t-20)/2);spin=720*smooth(solo);jump=Math.sin(solo*Math.PI)*38;body=wave*12*(1-solo);arms=[-145,-( -145)];legs=[-20,20];head=-body;}else{arms=[-115+wave*15,115+wave*15];legs=[wave*8,-wave*8];jump=2;body=side*8;head=-side*8;}
 }
 if(t>=22){spin=0;jump=0;body=i===winner?-8:side*8;head=-body;arms=i===winner?[-150,150]:[-120,120];legs=i===winner?[-24,24]:[-8,8];}
 return {x,y,scale,body,head,spin,jump,arms,legs};
}
