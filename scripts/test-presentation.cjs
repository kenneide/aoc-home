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
const slides=Array.from({length:16},(_,i)=>Object.assign(new Element(),{id:`slide-${String(i+1).padStart(2,'0')}`}));
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
key('End');assert.equal(elements['#next'].disabled,true);
key('ArrowRight');assert.equal(elements.output.textContent,'16 / 16');
key('Home');assert.equal(elements['#prev'].disabled,true);
key('Escape');assert(slides.every(s=>!s.hidden));
assert.equal(body.children[0].children.filter(b=>b.attrs['aria-current']).length,1);
console.log('Presentation checks passed: navigation, endpoints, chapter state, cancellation and reduced motion.');
