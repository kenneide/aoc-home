import {families,topics,generate,signature} from './maths.mjs';

export const key='aoc-wiskunde-v1';
export const fresh=()=>({lang:'nl',topic:'mixed',recent:[],round:[],balance:0});
export function next(s, random=Math.random) {
  let family=s.topic;
  if(family==='mixed'){
    if(!s.round.length){
      s.round=[...families];
      for(let i=s.round.length-1;i>0;i--){
        const j=Math.floor(random()*(i+1));
        [s.round[i],s.round[j]]=[s.round[j],s.round[i]];
      }
    }
    family=s.round.pop();
  }
  let p,id;
  for(let i=0;i<512;i++){
    p=generate(family,random,s.balance);
    id=signature(p);
    if(!s.recent.includes(id)) break;
  }
  if(family==='balance') s.balance=(s.balance+1)%5;
  s.recent=[...s.recent,id].slice(-60);
  Object.assign(s,{p,revealed:false,points:[],view:null,series:0});
}
export function restore(raw) {
  try {
    const s=JSON.parse(raw);
    if(!s||!['nl','en'].includes(s.lang)||!Object.hasOwn(topics,s.topic)||
      !Array.isArray(s.recent)||s.recent.length>60||!s.recent.every(x=>typeof x==='string')||
      !Array.isArray(s.round)||!s.round.every(x=>families.includes(x))||
      !Number.isInteger(s.balance)||s.balance<0||s.balance>4||!families.includes(s.p?.family)||
      typeof s.revealed!=='boolean'||!Array.isArray(s.points)||!s.points.every(ps=>Array.isArray(ps)&&ps.length<=2&&ps.every(pt=>Array.isArray(pt)&&pt.length===2&&pt.every(Number.isSafeInteger)))||
      (s.view&&(![s.view.x,s.view.y,s.view.z].every(Number.isFinite)||s.view.z<=0))) return fresh();
    return s;
  } catch {return fresh();}
}
