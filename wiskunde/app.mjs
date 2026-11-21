import {topics,coord,q} from './maths.mjs';
import {lesson,label} from './lesson.mjs';
import {draw,defaultView} from './graph.mjs';
import {key,restore,next,fresh} from './session.mjs';

const $=id=>document.getElementById(id);
const svg=$('practice-graph');
let state;
try { state=restore(localStorage.getItem(key)); } catch { state=fresh(); }
const t=(nl,en)=>state.lang==='nl'?nl:en;
let model, projection, cursor=null, drag=null;
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
function renderGraph(){
  if(!model.graph||$('graph-panel').hidden) return;
  projection=draw(svg,model.graph,state.view??defaultView(model.graph),state.revealed,state.points,cursor);
  if(state.p.family==='plot'){
    $('point-summary').textContent=state.points.map((ps,i)=>ps.length?`${label(i)}: ${ps.map(p=>coord(...p.map(x=>q(x)))).join(', ')}`:'').filter(Boolean).join(' · ');
  }
}
function writeMath(target, text) {
  for(const chunk of text.split(/(⟦[^⟦⟧]+⟧)/g)){
    if(!chunk.startsWith('⟦')) { target.append(chunk); continue; }
    const ns='http://www.w3.org/1998/Math/MathML';
    const math=document.createElementNS(ns,'math');
    const stack=document.createElementNS(ns,'mfrac');
    for(const value of chunk.slice(1,-1).split('¦')){
      const token=document.createElementNS(ns,'mtext');
      token.textContent=value;
      stack.append(token);
    }
    math.append(stack);
    target.append(math);
  }
}
function list(target,items){
  target.replaceChildren(...items.map(value=>{
    const li=document.createElement('li');
    writeMath(li,value);
    return li;
  }));
}
function render(){
  model=lesson(state.p,state.lang);
  document.documentElement.lang=state.lang;
  document.title=t('Wiskunde oefenen','Maths practice')+' — Alan O Cinneide Software BV';
  document.querySelector('.skip').textContent=t('Naar de opgave','Skip to the question');
  document.querySelector('header nav').setAttribute('aria-label',t('Hoofdnavigatie','Main navigation'));
  document.querySelector('.theme-toggle').textContent=t('Donkere modus','Dark mode');
  $('practice-title').textContent=t('Wiskunde oefenen','Maths practice');
  $('topic-label').textContent=t('Onderwerp','Topic');
  $('languages').setAttribute('aria-label',t('Taal','Language'));
  for(const lang of ['nl','en']) $(lang).setAttribute('aria-pressed',String(state.lang===lang));
  $('topic').replaceChildren(...Object.entries(topics).map(([value,labels])=>new Option(t(...labels),value)));
  $('topic').value=state.topic;
  $('family').textContent=t(...topics[state.p.family]);
  $('new-question').textContent=t('Nieuwe opgave','New question');
  $('reveal').textContent=state.revealed?t('Verberg uitwerking','Hide solution'):t('Toon uitwerking','Show solution');
  $('reveal').setAttribute('aria-expanded',String(state.revealed));
  $('solution').hidden=!state.revealed;
  $('solution-title').textContent=t('Uitwerking','Worked solution');
  list($('given'),model.intro);
  $('given').hidden=!model.intro.length;
  list($('prompts'),model.prompts);
  $('prompts').classList.toggle('single',model.prompts.length===1);
  $('solution-parts').replaceChildren(...(state.revealed?model.parts.map((steps,i)=>{
    const section=document.createElement('section');
    if(model.parts.length>1) section.append(Object.assign(document.createElement('h3'),{
      textContent:model.prompts.length>1?`${String.fromCharCode(97+i)}.`:steps[0],
    }));
    for(const step of (model.parts.length>1&&model.prompts.length===1?steps.slice(1):steps)){
      const row=document.createElement('p');
      writeMath(row,step);
      if(step.includes(' = ')||step.startsWith('(')) row.className='math';
      section.append(row);
    }
    return section;
  }):[]));
  $('graph-panel').hidden=!model.graph||Boolean(model.graph.revealOnly&&!state.revealed);
  const plotting=state.p.family==='plot';
  $('plot-controls').hidden=!plotting;
  $('graph-title').textContent=t('Grafiek','Graph');
  $('graph-help').textContent=plotting
    ?t('Tik om een punt te zetten, of gebruik de pijltjes en Enter. Sleep of gebruik Shift + pijltjes om te verschuiven.','Tap to place a point, or use arrow keys and Enter. Drag or use Shift + arrow keys to pan.')
    :t('Sleep of gebruik de pijltjes om te verschuiven.','Drag or use the arrow keys to pan.');
  $('line-label').textContent=t('Lijn','Line');
  $('clear-points').textContent=t('Wis punten','Clear points');
  $('reset-view').textContent=t('Herstel weergave','Reset view');
  $('zoom-in').setAttribute('aria-label',t('Inzoomen','Zoom in'));
  $('zoom-out').setAttribute('aria-label',t('Uitzoomen','Zoom out'));
  if(model.graph){
    const series=plotting?state.p.lines.map((_,i)=>label(i)):
      [...model.graph.source,...(state.revealed?model.graph.answer:[])].map(l=>l.name);
    if(plotting){
      $('line-picker').replaceChildren(...series.map((name,i)=>new Option(name,i)));
      $('line-picker').value=state.series;
    }
    $('legend').replaceChildren(...series.map((name,i)=>Object.assign(document.createElement('span'),{
      className:`legend-item s${i}`,textContent:name,
    })));
    const intersection=model.graph.marks.find(mark=>mark.showCoord);
    $('intersection-coordinate').replaceChildren();
    if(intersection&&state.revealed)
      writeMath($('intersection-coordinate'),intersection.name+coord(intersection.x,intersection.y));
    svg.setAttribute('aria-label',`${t('Grafiek','Graph')}. ${model.graph.axes.join(', ')}. ${series.join(', ')}.`);
  }
  renderGraph();
  save();
}
function newQuestion(){next(state);cursor=null;render();$('family').focus();}
function changeView(update){
  const v=state.view??defaultView(model.graph);
  state.view=update(v);
  renderGraph();save();
}
function place(point){
  if(!point||state.p.family!=='plot') return;
  const i=state.series, ps=state.points[i]??[];
  if(ps.some(p=>p[0]===point[0]&&p[1]===point[1])) return;
  while(state.points.length<=i) state.points.push([]);
  state.points[i]=[...ps,point].slice(-2);
  renderGraph();save();
}
$('new-question').onclick=newQuestion;
$('topic').onchange=e=>{state.topic=e.target.value;newQuestion();};
$('reveal').onclick=()=>{state.revealed=!state.revealed;render();};
for(const lang of ['nl','en']) $(lang).onclick=()=>{state.lang=lang;render();};
$('line-picker').onchange=e=>{state.series=Number(e.target.value);save();};
$('clear-points').onclick=()=>{if(state.points[state.series]) state.points[state.series]=[];renderGraph();save();};
$('reset-view').onclick=()=>{cursor=null;changeView(()=>defaultView(model.graph));};
const zoom=factor=>changeView(v=>({...v,z:Math.min(4,Math.max(0.035,v.z*factor))}));
$('zoom-in').onclick=()=>zoom(1.25);
$('zoom-out').onclick=()=>zoom(0.8);
svg.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||e.button!==0) return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener('pointermove',e=>{
  if(drag?.id!==e.pointerId) return;
  const x=e.clientX-drag.x,y=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(x,y)<6) return;
  const [dx,dy]=projection.drag(x,y);
  Object.assign(drag,{x:e.clientX,y:e.clientY,moved:true});
  changeView(v=>({...v,x:v.x-dx,y:v.y+dy}));
});
svg.addEventListener('pointerup',e=>{
  if(drag?.id!==e.pointerId) return;
  if(!drag.moved) place(projection.point(e));
  drag=null;
});
svg.addEventListener('pointercancel',()=>{drag=null;});
svg.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&state.p.family==='plot'){e.preventDefault();place(cursor??[0,0]);return;}
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];
  if(!delta) return;
  e.preventDefault();
  const [dx,dy]=delta;
  if(state.p.family==='plot'&&!e.shiftKey){
    const v=state.view??defaultView(model.graph);
    cursor??=[Math.round(v.x),Math.round(v.y)];
    cursor=[cursor[0]+dx,cursor[1]+dy];
    $('cursor-status').textContent=coord(...cursor.map(x=>q(x)));
    if(Math.abs(cursor[0]-v.x)>5/v.z||Math.abs(cursor[1]-v.y)>5/v.z)
      changeView(view=>({...view,x:cursor[0],y:cursor[1]}));
    else renderGraph();
  } else changeView(v=>({...v,x:v.x+dx/v.z,y:v.y+dy/v.z}));
});
try {
  if(!state.p) next(state);
  render();
} catch (error) {
  state=fresh();next(state);render();
}
$('practice-ui').hidden=false;
