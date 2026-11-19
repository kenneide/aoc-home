import {test} from 'node:test';
import assert from 'node:assert/strict';
import {poseAt,DURATION} from './choreography.js';
import {melody,BEAT} from './music.js';
test('chorus is 32 beats and leaves room for the build and sting',()=>{assert.equal(melody.reduce((n,[,d])=>n+d,0),32);assert.equal(BEAT,.5)});
test('every recipient reaches exact centre with a stable triumphant pose',()=>{for(let winner=0;winner<6;winner++){const p=poseAt(DURATION,winner,winner);assert.equal(p.x,50);assert.equal(p.y,57);assert.equal(p.spin,0);assert.equal(p.jump,0);assert.ok(p.scale>1);const support=Array.from({length:6},(_,i)=>i).filter(i=>i!==winner).map(i=>poseAt(DURATION,i,winner).x);assert.deepEqual(support,[12,28,50,72,88])}});
test('all acts have finite articulated poses and replay is deterministic',()=>{for(let w=0;w<6;w++)for(let t=0;t<=24;t+=.125)for(let i=0;i<6;i++){const p=poseAt(t,i,w);assert.ok(Object.values(p).flat().every(Number.isFinite));assert.deepEqual(poseAt(t,i,w),p)}});
test('can-can kicks alternate above waist height with the entire line in sync',()=>{
 for(let i=0;i<6;i++){
  const left=poseAt(8.25,i,0),right=poseAt(8.75,i,0);
  assert.ok(left.legs[0]<-100);assert.ok(right.legs[1]>100);
  assert.ok(left.arms[0]<-150);assert.ok(right.arms[1]>150);
  assert.ok(left.jump>10);assert.ok(right.jump>10);
 }
});
test('windmills travel through complete turns and the group star jump spreads both legs',()=>{
 const a=poseAt(4,0,0),b=poseAt(4.5,0,0);
 assert.equal(b.arms[0]-a.arms[0],-360);
 const jump=poseAt(16.9,0,0);assert.ok(jump.jump>35);assert.ok(jump.legs[0]<-50);assert.ok(jump.legs[1]>50);
});
