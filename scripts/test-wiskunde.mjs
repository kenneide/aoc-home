import assert from 'node:assert/strict';
import {families,generate,balance,signature} from '../wiskunde/maths.mjs';
import {lesson} from '../wiskunde/lesson.mjs';
import {defaultView} from '../wiskunde/graph.mjs';
import {fresh,next,previous,restore} from '../wiskunde/session.mjs';

let seed=19072;
const rng=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/2**32);
const num=([a,b])=>a/b;
const y=(l,x)=>num(l.m)*x+num(l.b);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);
const canonical=(pair)=>{
  const [n,d]=pair;
  assert(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d>0);
  for(let k=2;k<=d;k++) assert(n%k!==0||d%k!==0);
};
const count=1500;
for(const family of families){
  const seen=new Set();
  for(let i=0;i<count;i++){
    const p=generate(family,rng,i);
    seen.add(signature(p));
    const nl=lesson(p,'nl'), en=lesson(p,'en');
    assert.deepEqual(nl.intro,en.intro);
    assert(nl.prompts.length&&nl.parts.every(part=>part.length));
    assert.notDeepEqual(nl.prompts,en.prompts);
    assert(!/undefined|NaN/.test(JSON.stringify([nl,en])));
    for(const l of p.lines??(p.l?[p.l]:[])){canonical(l.m);canonical(l.b);}
    if(nl.graph){
      const g=nl.graph;
      const v=defaultView(g);
      assert(g.dx>0&&g.dy>0&&v.z>0);
      for(const mark of g.marks){
        canonical(mark.x);canonical(mark.y);
        assert(Math.abs(num(mark.x)/g.dx-v.x)<6/v.z);
        assert(Math.abs(num(mark.y)/g.dy-v.y)<6/v.z);
        if(family==='intersection'){
          assert.notEqual(num(p.lines[0].m),num(p.lines[1].m));
          for(const l of p.lines) close(y(l,num(mark.x)),num(mark.y));
        } else {
          const l=[...g.source,...g.answer][mark.series??0];
          if(mark.offLine) assert.notEqual(y(l,num(mark.x)),num(mark.y));
          else close(y(l,num(mark.x)),num(mark.y));
          if(family==='read'){
            assert.equal(num(mark.x)%g.dx,0);
            assert(num(mark.y)%g.dy===0);
          }
        }
      }
    }
    if(family==='points') assert.equal(p.points.filter(([x,z])=>y(p.l,x)===z).length,2);
    if(family==='parallel') assert.notEqual(y(p.l,p.x),p.y);
    if(family==='compare') {
      assert.equal(new Set(p.lines.map(l=>JSON.stringify(l))).size,4);
      assert.equal(new Set(p.lines.map(l=>num(l.m))).size,3);
      assert(new Set(p.lines.map(l=>num(l.b))).size<4);
    }
    if(family==='balance'){
      assert(p.stage>=0&&p.stage<4);
      assert(!JSON.stringify([nl,en]).includes('x²'));
      const eq=balance(p), {m,n,k,r}=eq;
      assert.notEqual(num(m),num(n));
      close((num(r)-num(k))/(num(m)-num(n)),p.x);
      const sides=x=>{
        if(p.stage===2) return [p.a*(x+p.b),p.c*x+num(r)];
        if(p.stage===3) return [(p.a*x+p.b)/p.d,(p.c*x+num(r))/p.d];
        return [num(m)*x+num(k),num(n)*x+num(r)];
      };
      for(const x of [p.x-2,p.x,p.x+2]){
        const [a,b]=sides(x);
        close((a-b)*(p.stage===3?p.d:1),(num(m)-num(n))*x+num(k)-num(r));
      }
    }
    if(family==='context'){
      const [newLine]=nl.graph.answer;
      assert.equal(num(newLine.m),p.changeRate?p.changed:p.rate);
      assert.equal(num(newLine.b),p.changeRate?p.b:p.changed);
    }
    if(p.kind==='age'){
      const younger=(p.total-p.gap)/2-p.shift;
      assert(Number.isInteger(younger)&&younger>=10&&younger+p.shift>0);
      assert.equal((younger+p.shift)+(younger+p.gap+p.shift),p.total);
    }
    if(p.kind==='duration') assert(Number.isInteger((p.total-p.b)/p.rate)&&p.total>p.b&&p.rate>0);
  }
  assert(seen.size>60,family);
}
const s=fresh();
for(let i=0;i<35;i++){
  const cycle=new Set();
  for(let j=0;j<9;j++){
    const previous=[...s.recent];
    next(s,rng);
    cycle.add(s.p.family);
    assert(!previous.includes(signature(s.p)));
  }
  assert.equal(cycle.size,9);
}
assert.equal(s.recent.length,60);
assert.deepEqual(restore(JSON.stringify(s)),s);
assert.deepEqual(restore('{bad json'),fresh());
console.log(`Checked ${count*families.length} generated problems and 35 mixed rounds.`);

const fractionalLines={
  family:'intersection',
  lines:[{m:[1,2],b:[0,1]},{m:[-1,1],b:[1,1]}],
};
const intersection=lesson(fractionalLines,'nl');
assert.deepEqual(intersection.intro,['A: y = ⟦1¦2⟧x','B: y = −x + 1']);
assert.equal(intersection.parts[0].at(-1),'S(⟦2¦3⟧; ⟦1¦3⟧)');
const scaledGraph={family:'read',dx:2,dy:5,lines:[{m:[5,2],b:[0,1]}]};
assert(lesson(scaledGraph,'nl').parts[0].includes('a = ⟦Δy¦Δx⟧ = ⟦5¦2⟧ = ⟦5¦2⟧'));
assert(lesson(scaledGraph,'en').parts[0].includes('a = ⟦Δy¦Δx⟧ = ⟦5¦2⟧ = ⟦5¦2⟧'));

const replay=fresh();
next(replay,rng,'plot');
Object.assign(replay,{revealed:true,points:[[[0,1],[2,5]]],view:{x:1,y:2,z:1.5},series:1});
const original=structuredClone(replay);
next(replay,rng,'balance');
replay.lang='en';
const resumed=restore(JSON.stringify(replay));
assert(previous(resumed));
for(const field of ['p','topic','revealed','points','view','series']) assert.deepEqual(resumed[field],original[field]);
assert.equal(resumed.lang,'en');
assert.equal(resumed.balance,replay.balance);
assert(!previous(resumed));
assert.equal(s.history.length,20);
const {history,...legacy}=s;
assert.deepEqual(restore(JSON.stringify(legacy)).history,[]);

const retiredBalance={...replay,p:{...replay.p,family:'balance',stage:4}};
const migrated=restore(JSON.stringify({...retiredBalance,balance:4,history:[retiredBalance]}));
assert.equal(migrated.p,undefined);
assert.equal(migrated.balance,0);
assert.deepEqual(migrated.history,[]);
next(migrated,rng,'balance');
assert.equal(migrated.p.stage,0);
