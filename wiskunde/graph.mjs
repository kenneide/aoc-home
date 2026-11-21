import {value} from './maths.mjs';

export function defaultView(graph) {
  if(graph.positive) {
    const highest=Math.max(...[...graph.source,...graph.answer].map(l=>value(l.b)+4*value(l.m)));
    const span=Math.max(12,Math.ceil(highest/graph.dy)+1);
    return {x:5,y:span/2,z:12/span};
  }
  const extent=Math.max(6,...graph.marks.flatMap(p=>[Math.abs(value(p.x)/graph.dx)+1,Math.abs(value(p.y)/graph.dy)+1]));
  return {x:0,y:0,z:Math.min(1,6/extent)};
}

export function draw(svg, graph, view, revealed, plotted, cursor) {
  const size=360, pad=39, inner=size-2*pad, mid=size/2;
  const step=inner*view.z/12;
  const screen=(x,y)=>[mid+(x/graph.dx-view.x)*step,mid-(y/graph.dy-view.y)*step];
  const world=(x,y)=>[(view.x+(x-mid)/step)*graph.dx,(view.y-(y-mid)/step)*graph.dy];
  const [xmin,ymin]=world(pad,size-pad), [xmax,ymax]=world(size-pad,pad);
  const [ox,oy]=screen(0,0);
  const text=(x,y,s,cls='',anchor='middle')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
  const line=(x,y,a,b,cls)=>`<line x1="${x}" y1="${y}" x2="${a}" y2="${b}" class="${cls}"/>`;
  const grid=(lo,hi,unit,vertical)=>{
    const stride=Math.max(1,Math.ceil(16/step));
    const first=Math.ceil(lo/unit/stride)*stride;
    let result='';
    for(let i=first;i<=hi/unit;i+=stride){
      const [x,y]=screen(i*unit,i*unit);
      if(vertical) result+=line(x,pad,x,size-pad,'grid-line')+text(x,size-pad+16,i*unit);
      else result+=line(pad,y,size-pad,y,'grid-line')+text(pad-5,y+4,i*unit,'','end');
      if(!vertical&&graph.positive&&stride===1) {
        for(let j=1;j<=3;j++){
          const [,minor]=screen(0,i*unit+j*unit/4);
          if(minor>=pad&&minor<=size-pad) result+=line(pad,minor,size-pad,minor,'grid-line minor');
        }
      }
    }
    return result;
  };
  function plot(l,i) {
    const x=graph.positive?Math.max(0,xmin):xmin;
    if(x>xmax) return '';
    return line(...screen(x,value(l.m)*x+value(l.b)),...screen(xmax,value(l.m)*xmax+value(l.b)),`series s${i}`);
  }
  const dot=(sx,sy,i,name,offLine=false)=>`<circle class="point s${i}${offLine?" off-line":""}" cx="${sx}" cy="${sy}" r="4"/>`+
    text(sx+7,sy-7,name,'point-label',sx>size-pad-45?'end':'start');
  let geometry=graph.source.map(plot).join('');
  if(revealed){
    geometry+=graph.answer.map((l,i)=>plot(l,i+graph.source.length)).join('');
    graph.marks.forEach((p,i)=>{
      const [sx,sy]=screen(value(p.x),value(p.y));
      if(p.rise){
        const a=graph.marks[i-1], [ax,ay]=screen(value(a.x),value(a.y));
        geometry+=line(ax,ay,sx,ay,'rise')+line(sx,ay,sx,sy,'rise');
      }
      geometry+=dot(sx,sy,p.series??0,p.name,p.offLine);
    });
  }
  plotted.forEach((ps,i)=>ps.forEach(([x,y])=>{geometry+=dot(...screen(x,y),i,String.fromCharCode(65+i));}));
  if(cursor){
    const [x,y]=screen(...cursor);
    geometry+=`<circle cx="${x}" cy="${y}" r="7" class="cursor"/>`;
  }
  svg.innerHTML=`<defs><clipPath id="plot-clip"><rect x="${pad}" y="${pad}" width="${inner}" height="${inner}"/></clipPath></defs>`+
    `<rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" class="graph-paper"/>`+
    grid(xmin,xmax,graph.dx,true)+grid(ymin,ymax,graph.dy,false)+
    (ox>=pad&&ox<=size-pad?line(ox,pad,ox,size-pad,'axis'):'')+
    (oy>=pad&&oy<=size-pad?line(pad,oy,size-pad,oy,'axis'):'')+
    text(pad,24,graph.axes[1],'axis-label','start')+text(size-pad,size-4,graph.axes[0],'axis-label','end')+
    `<g clip-path="url(#plot-clip)">${geometry}</g>`;
  return {
    point(event) {
      const {left,top,width,height}=svg.getBoundingClientRect();
      const x=(event.clientX-left)*size/width, y=(event.clientY-top)*size/height;
      if(x<pad||x>size-pad||y<pad||y>size-pad) return null;
      return world(x,y).map(Math.round);
    },
    drag(dx,dy) {
      return [dx*size/svg.clientWidth/step,dy*size/svg.clientHeight/step];
    },
  };
}
