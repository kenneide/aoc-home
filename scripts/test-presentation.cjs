// Exercise navigation and motion lifecycle without a browser or external dependency.
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
class Element {
  constructor() { this.children=[];this.attrs={};this.style={setProperty(){}};this.hidden=false; }
  append(child){this.children.push(child);}
  setAttribute(k,v){this.attrs[k]=v;}
  removeAttribute(k){delete this.attrs[k];}
  querySelector(){return null;}
  querySelectorAll(){return [];}
  scrollIntoView(){}
  focus(){}
}
const artwork = new Element();
let started=0,cancelled=0;
artwork.animate=()=>{started++;return {cancel(){cancelled++;}};};
const records = JSON.parse(readFileSync('projects/ai-for-fun-and-profit/slides.json', 'utf8'));
const slides = records.map(({id, chapter, steps}) =>
  Object.assign(new Element(), {id, dataset: {chapter, steps}}));
slides[0].querySelector=()=>artwork;
slides[1].querySelector=()=>artwork;
const controls=new Element();
const elements=Object.fromEntries(['#prev','#next','#present','#full','output'].map(k=>[k,new Element()]));
elements['.controls']=controls;
const classes=new Set();
const body=new Element();
body.classList={contains:k=>classes.has(k),toggle(k){classes.has(k)?classes.delete(k):classes.add(k);}};
const motion={matches:false,addEventListener(_,fn){this.change=fn;}};
const listeners={};
const context={document:{body,documentElement:new Element(),querySelector:k=>elements[k],querySelectorAll:()=>slides,createElement:()=>new Element()},location:{hash:''},history:{replaceState(){}},matchMedia:()=>motion,getComputedStyle:()=>({getPropertyValue:k=>k.includes('ease')?'ease-out':k.includes('accent')?'#b2c906':'400ms'}),addEventListener:(k,fn)=>listeners[k]=fn};
vm.runInNewContext(readFileSync('projects/ai-for-fun-and-profit/deck.js','utf8'),context);
assert(slides.every(s=>!s.hidden));
elements['#present'].onclick();
assert.equal(started,1);
assert.equal(slides.filter(s=>!s.hidden).length,1);
elements['#next'].onclick();
assert.equal(cancelled,1);assert.equal(started,2);
motion.matches=true;motion.change();
assert.equal(cancelled,2);
assert.equal(controls.children[0].hidden,true);
elements['#next'].onclick();assert.equal(started,2);
const key=key=>listeners.keydown({key,target:{closest:()=>null},preventDefault(){}});
const verifyState = (index, stage) => {
  assert.equal(slides.findIndex(slide => !slide.hidden), index);
  assert.equal(slides[index].dataset.stage, stage);
};
key('ArrowRight');
verifyState(3, 0);
elements['#next'].onclick();
verifyState(3, 1);
for (const [index, stage] of [[4, 0], [4, 1], [5, 0], [5, 1], [6, 0]]) {
  key('ArrowRight');
  verifyState(index, stage);
}
for (const [index, stage] of [[5, 1], [5, 0], [4, 1], [4, 0], [3, 1], [3, 0], [2, 0]]) {
  elements['#prev'].onclick();
  verifyState(index, stage);
}
key('End');verifyState(slides.length - 1, 0);
assert.equal(elements['#next'].disabled,false);
elements['#next'].onclick();verifyState(slides.length - 1, 1);
assert.equal(elements['#next'].disabled,true);
key('ArrowRight');verifyState(slides.length - 1, 1);
key('ArrowLeft');verifyState(slides.length - 1, 0);
key('Home');assert.equal(elements['#prev'].disabled,true);
key('Escape');assert(slides.every(s=>!s.hidden));
assert.equal(body.children[0].children.filter(b=>b.attrs['aria-current']).length,1);
console.log('Presentation checks passed: navigation, endpoints, chapter state, cancellation and reduced motion.');
