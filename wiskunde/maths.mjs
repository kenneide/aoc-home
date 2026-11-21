export const topics = {
  mixed: ['Gemengd', 'Mixed'],
  plot: ['Lijnen tekenen', 'Plot lines'],
  points: ['Punten en coördinaten', 'Points and coordinates'],
  compare: ['Lijnen vergelijken', 'Compare lines'],
  read: ['Formules aflezen', 'Read equations'],
  parallel: ['Evenwijdige lijn', 'Parallel line'],
  context: ['Grafiek in een situatie', 'Graphs in context'],
  balance: ['Balansmethode', 'Balance method'],
  intersection: ['Snijpunt', 'Intersection'],
  word: ['Verhaalsommen', 'Word problems'],
};
export const families = Object.keys(topics).slice(1);
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
export function q(n, d = 1) {
  if (!d) throw new RangeError('Zero denominator');
  const factor = gcd(n, d) * Math.sign(d);
  return [n / factor || 0, d / factor];
}
export const add = ([a,b], [c,d]) => q(a*d+c*b,b*d);
export const neg = ([a,b]) => q(-a,b);
export const sub = (a,b) => add(a,neg(b));
export const mul = ([a,b], [c,d]) => q(a*c,b*d);
export const div = ([a,b], [c,d]) => q(a*d,b*c);
export const fraction = (top,bottom) => `⟦${top}¦${bottom}⟧`;
export const fmt = ([a,b]) => b === 1 ? String(a).replace('-', '−') :
  (a<0?'−':'')+fraction(Math.abs(a),b);
export const value = ([a,b]) => a/b;
export const at = ({m,b}, x) => add(mul(m,x),b);
export const line = (m,b) => ({m,b:q(b)});
export function term(a, variable = 'x') {
  return a[0] === 0 ? '0' : a[1] === 1 && Math.abs(a[0]) === 1 ? (a[0]<0?'−':'')+variable : fmt(a)+variable;
}
export const tail = b => b[0] ? ` ${b[0]<0?'−':'+'} ${fmt(q(Math.abs(b[0]),b[1]))}` : '';
export const expr = (m,b) => m[0] ? term(m)+tail(b) : fmt(b);
export const formula = (l, label) => `${label ? label+': ' : ''}y = ${expr(l.m,l.b)}`;
export const coord = (x,y) => `(${fmt(x)}; ${fmt(y)})`;

export const balanceStages = 4;

export function generate(family, random = Math.random, level = 0) {
  const int = (a,b) => a+Math.floor(random()*(b-a+1));
  const pick = xs => xs[int(0,xs.length-1)];
  const slopes = [q(-3),q(-2),q(-1),q(-1,2),q(-2,3),q(1,3),q(1,2),q(1),q(2),q(3)];
  const slope = () => pick(slopes);
  const base = {family};
  switch(family) {
    case 'plot':
      return {...base, lines:[line(q(int(1,3)),int(-5,5)),line(q(int(-3,-1)),int(-5,5)),
        ...(int(0,1) ? [line(pick(slopes.filter(m=>m[1]>1)),int(-5,5))] : [])]};
    case 'points': {
      const l=line(slope(),int(-7,7));
      const xs=[int(-7,-2),int(-1,2),int(3,7)].map(x=>x*l.m[1]);
      const wrong=int(0,2);
      return {...base,l, points:xs.map((x,i)=>[x, value(at(l,q(x)))+(i===wrong?pick([-3,-2,2,3]):0)]), x:int(8,14)*l.m[1]};
    }
    case 'compare': {
      const m=slope(), b=int(-8,8);
      const lines=[line(m,b),line(m,b+pick([-4,-3,2,4])),line(pick(slopes.filter(s=>value(s)!==value(m))),b),line(q(0),int(-8,8))];
      for(let i=lines.length-1;i>0;i--){const j=int(0,i);[lines[i],lines[j]]=[lines[j],lines[i]];}
      return {...base,lines};
    }
    case 'read': {
      const dx=pick([1,2,4]), dy=pick([1,5,10]);
      const a=pick([-2,-1,1,2]), b=int(-3,3);
      const lines=[line(q(a*dy,dx),b*dy)];
      if(int(0,1)) lines.push(line(q(-a*dy,dx),(b===0?2:-b)*dy));
      return {...base,dx,dy,lines};
    }
    case 'parallel': {
      const l=line(slope(),int(-8,8)), x=int(-8,8)*l.m[1];
      return {...base,l,x,y:value(at(l,q(x)))+pick([-5,-3,2,4,7])};
    }
    case 'intersection': {
      const m=slope(), other=pick(slopes.filter(s=>value(s)!==value(m)));
      return {...base,lines:[line(m,int(-8,8)),line(other,int(-8,8))]};
    }
    case 'balance': {
      const stage=level%balanceStages, x=int(-9,12), a=pick([-5,-3,-2,2,3,4,5]), b=int(-9,9);
      const c=pick([-4,-2,-1,0,1,2,4].filter(k=>k!==a)), d=int(2,5);
      return {...base,stage,x,a,b,c,d,reverse:int(0,1)===1};
    }
    case 'context': {
      const b=5*int(2,12), rate=5*int(1,6), changeRate=int(0,1)===1;
      return {...base,setting:int(0,2),b,rate,changeRate,changed:(changeRate?rate:b)+5*int(1,5)};
    }
    case 'word': {
      if(int(0,1)) {
        const shift=pick([-7,-5,-3,2,4,6,8]), young=int(10,19), gap=int(3,12);
        return {...base,kind:'age',shift,gap,total:2*(young+shift)+gap,askOlder:int(0,1)===1};
      }
      const b=int(4,45),rate=int(2,18), duration=int(2,16);
      return {...base,kind:'duration',setting:int(0,2),b,rate,total:b+rate*duration};
    }
    default: throw new RangeError('Unknown family');
  }
}
export function balance(p) {
  const {stage,x,a,b,c,d,reverse}=p;
  let m=q(a), n=q(c), k=q(b), r;
  let expanded, start;
  if(stage===0) n=q(0);
  if(stage===2) k=q(a*b);
  if(stage===3) {m=q(a,d);k=q(b,d);n=q(c,d);}
  r=add(mul(sub(m,n),q(x)),k);
  const equation=(L,R)=>reverse?`${R} = ${L}`:`${L} = ${R}`;
  expanded=equation(expr(m,k),expr(n,r));
  if(stage===2) start=equation(`${a<0?'−'+Math.abs(a):a}(x${tail(q(b))})`,expr(n,r));
  if(stage===3) {
    start=equation(fraction(expr(q(a),q(b)),d),fraction(expr(q(c),mul(r,q(d))),d));
    expanded=equation(expr(q(a),q(b)),expr(q(c),mul(r,q(d))));
    m=q(a);n=q(c);k=q(b);r=mul(r,q(d));
  }
  return {m,n,k,r,start:start??expanded,expanded};
}
export function signature(p) {
  if(p.family==='balance') {
    const {start}=balance({...p,reverse:false});
    return JSON.stringify([p.family,p.stage,start]);
  }
  if(p.family==='word') {
    return JSON.stringify(p.kind==='age'?[p.kind,p.shift,p.gap,p.total,p.askOlder]:[p.kind,p.b,p.rate,p.total]);
  }
  const {setting,lines,...rest}=p;
  return JSON.stringify([rest,lines?.map(l=>JSON.stringify(l)).sort()]);
}
