import {settings,story} from './stories.mjs';
import {q,add,sub,mul,div,at,value,fmt,fraction,tail,expr,formula,coord,balance} from './maths.mjs';

export const label = i => String.fromCharCode(65+i);
export function lesson(p, lang) {
  const t=(nl,en)=>lang==='nl'?nl:en;
  const part=(...steps)=>steps;
  const lines=p.lines??[];
  const names=lines.map((_,i)=>label(i));
  const formulas=lines.map((l,i)=>formula(l,names[i]));
  const graph=(source=[],answer=[],marks=[],dx=1,dy=1,axes=['x','y'],positive=false)=>({source,answer,marks,dx,dy,axes,positive});
  const named=(ls,ns)=>ls.map((l,i)=>({...l,name:ns[i]}));
  const mark=(x,y,name)=>({x,y,name});
  const points=(l,dx)=>[mark(q(0),l.b),mark(dx,at(l,dx))];
  const slopeSteps=(l,dx)=> {
    const [a,b]=points(l,dx), rise=sub(b.y,a.y);
    return [
      t('Lees twee punten af.','Read two points from the graph.'), `${coord(a.x,a.y)}  ${t('en','and')}  ${coord(b.x,b.y)}`,
      t('Bereken de verandering in y en x in eenheden op de assen.','Calculate the changes in y and x in axis units.'),
      `Δy = (${fmt(b.y)}) − (${fmt(a.y)}) = ${fmt(rise)}`,
      `Δx = ${fmt(b.x)} − 0 = ${fmt(dx)}`,
      `a = ${fraction("Δy","Δx")} = ${fraction(fmt(rise),fmt(dx))} = ${fmt(l.m)}`
    ];
  };
  switch(p.family) {
    case 'plot':
      return {intro:formulas, prompts:[t('Teken de lijnen in één assenstelsel. Je kunt per lijn twee punten op het rooster zetten.','Draw the lines on one grid. You can place two points per line on the graph.')],
        graph:graph([],named(lines,names),lines.flatMap((l,i)=>points(l,q(l.m[1])).map(pt=>({...pt,name:names[i],series:i})))),
        parts:lines.map((l,i)=>{
          const dx=q(l.m[1]), [a,b]=points(l,dx);
          return part(names[i],t('Begin op de y-as. Vul x = 0 in.','Start on the y-axis. Substitute x = 0.'),`y = ${fmt(l.b)}`,
            t('Gebruik de teller voor de verandering in y en de noemer voor de verandering in x.','Use the numerator for the change in y and the denominator for the change in x.'),
            `Δx = ${fmt(dx)}`, `Δy = ${l.m[0]}`,`y = ${fmt(a.y)}${tail(q(l.m[0]))} = ${fmt(b.y)}`,
            t('Trek de lijn door deze twee punten.','Draw the line through these two points.'),`${coord(a.x,a.y)}   ${coord(b.x,b.y)}`);
        })};
    case 'points': {
      const {l,x}=p, show=(x)=>`y = (${fmt(l.m)}) × (${x})${tail(l.b)} = ${fmt(at(l,q(x)))}`;
      const candidates=p.points.map(([px,py],i)=>({
        ...mark(q(px),q(py),label(i)), offLine:value(at(l,q(px)))!==py,
      }));
      return {graph:{...graph([],named([l],[t('Gegeven lijn','Given line')]),[
          ...candidates, mark(q(x),at(l,q(x)),label(candidates.length)),
        ]),revealOnly:true},
        intro:[formula(l), p.points.map(([a,b],i)=>label(i)+coord(q(a),q(b))).join('   ')],
        prompts:[t('Welke punten liggen op de lijn?','Which points lie on the line?'),t(`Bereken y als x = ${x}.`,`Find y when x = ${x}.`)],
        parts:[part(t('Vul de x-coördinaat van elk punt in en vergelijk de y-waarden.','Substitute each x-coordinate and compare the y-values.'),
          ...p.points.flatMap(([a,b],i)=>[label(i)+coord(q(a),q(b)),show(a),value(at(l,q(a)))===b?t('De waarden zijn gelijk.','The values match.'):t('De waarden verschillen.','The values differ.')]),t('Op de lijn','On the line')+'  '+p.points.flatMap(([a,b],i)=>value(at(l,q(a)))===b?[label(i)]:[]).join(', ')),
          part(t('Vul x in.','Substitute x.'),show(x),label(candidates.length)+coord(q(x),at(l,q(x))))]};
    }
    case 'compare': {
      const pairs=(key)=>lines.flatMap((l,i)=>lines.slice(i+1).flatMap((r,j)=>value(l[key])===value(r[key])?[`${names[i]}–${names[i+j+1]}`]:[])).join(', ');
      const intercepts=lines.map((l,i)=>({...mark(q(0),l.b,names[i]),series:i}));
      const distinctIntercepts=intercepts.filter((point,i)=>intercepts.findIndex(other=>value(other.y)===value(point.y))===i)
        .map(point=>({...point,name:intercepts.filter(other=>value(other.y)===value(point.y)).map(other=>other.name).join(', ')}));
      return {graph:{...graph([],named(lines,names),distinctIntercepts),revealOnly:true},
        intro:formulas,prompts:[t('Welke lijnen zijn evenwijdig?','Which lines are parallel?'),t('Welke lijnen snijden de y-as in hetzelfde punt?','Which lines share a y-intercept?'),t('Welke lijnen zijn stijgend?','Which lines are increasing?')],
        parts:[part(t('Evenwijdige lijnen hebben dezelfde helling. Vergelijk de coëfficiënten van x.','Parallel lines have the same slope. Compare the coefficients of x.'),...lines.map((l,i)=>`a(${names[i]}) = ${fmt(l.m)}`),pairs('m')),
          part(t('Bij x = 0 blijft het startgetal over. Vergelijk die getallen.','At x = 0 only the constant remains. Compare those constants.'),...lines.map((l,i)=>`b(${names[i]}) = ${fmt(l.b)}`),pairs('b')),
          part(t('Een lijn is stijgend als de helling positief is.','A line is increasing when its slope is positive.'),lines.flatMap((l,i)=>l.m[0]>0?[names[i]]:[]).join(', '))]};
    }
    case 'read':
      return {intro:[],prompts:[t('Stel de formule van elke lijn op. Kijk goed naar de stappen op de assen.','Find the equation of each line. Check the tick steps on both axes.')],
        graph:graph(named(lines,names),[],lines.flatMap((l,i)=>points(l,q(p.dx)).map((pt,j)=>({...pt,series:i,name:names[i]+(j+1),rise:j===1}))),p.dx,p.dy),
        parts:lines.map((l,i)=>part(names[i],...slopeSteps(l,q(p.dx)),t('Lees het snijpunt met de y-as af en vul a en b in.','Read the y-intercept and substitute a and b.'),`b = ${fmt(l.b)}`,formula(l)))};
    case 'parallel': {
      const {l,x,y}=p, mx=mul(l.m,q(x)), b=sub(q(y),mx);
      const parallel={m:l.m,b};
      return {graph:{...graph(named([l],[t('Gegeven lijn','Given line')]),
          named([parallel],[t('Lijn door P','Line through P')]),
          [mark(q(0),l.b,''),{...mark(q(x),q(y),'P'),series:1},{...mark(q(0),b,''),series:1}]),revealOnly:true},
        intro:[formula(l),`P${coord(q(x),q(y))}`],prompts:[t('Stel de formule op van de lijn door P die evenwijdig is aan de gegeven lijn.','Find the equation of the line through P that is parallel to the given line.')],
        parts:[part(t('Neem dezelfde helling en gebruik b voor het nieuwe startgetal.','Keep the same slope and use b for the new intercept.'),`y = ax + b`,`a = ${fmt(l.m)}`,`y = ${expr(l.m,q(0))} + b`,
          t('Vul de coördinaten in.','Substitute the coordinates.'),`${fmt(q(y))} = (${fmt(l.m)}) × (${fmt(q(x))}) + b`,`${fmt(q(y))} = ${fmt(mx)} + b`,
          t('Trek het berekende product van beide kanten af.','Subtract the calculated product from both sides.'),`b = ${fmt(q(y))} − (${fmt(mx)}) = ${fmt(b)}`,formula(parallel))]};
    }
    case 'balance': {
      const eq=balance(p);
      const steps=[eq.start];
      if(p.stage===2) steps.push(t('Werk de haakjes uit.','Expand the brackets.'),eq.expanded);
      if(p.stage===3) steps.push(t(`Vermenigvuldig beide kanten met ${p.d}.`,`Multiply both sides by ${p.d}.`),eq.expanded);
      steps.push(...solve(eq.m,eq.k,eq.n,eq.r,t,p.reverse));
      return {intro:[eq.start],prompts:[t('Los op met de balansmethode.','Solve using the balance method.')],parts:[steps]};
    }
    case 'intersection': {
      const [a,b]=lines, x=div(sub(b.b,a.b),sub(a.m,b.m)), y=at(a,x);
      const name=t('S','I');
      return {intro:formulas,prompts:[t('Bereken de exacte coördinaten van het snijpunt.','Calculate the exact coordinates of the intersection.')],
        graph:{...graph([],named(lines,names),[{...mark(x,y,name),showCoord:true}]),revealOnly:true},
        parts:[part(t('In het snijpunt hebben beide lijnen dezelfde y.','At the intersection, both lines have the same y-value.'),`${expr(a.m,a.b)} = ${expr(b.m,b.b)}`,...solve(a.m,a.b,b.m,b.b,t),
          t('Vul x in beide formules in en vergelijk de uitkomsten.','Substitute x into both formulas and compare the results.'),
          ...lines.map((l,i)=>`${names[i]}: y = (${fmt(l.m)}) × (${fmt(x)})${tail(l.b)} = ${fmt(at(l,x))}`),`${name}${coord(x,y)}`)]};
    }
    case 'context': {
      const [,time,axis,unit]=settings[p.setting][lang];
      const l={m:q(p.rate),b:q(p.b)}, updated={m:q(p.changeRate?p.changed:p.rate),b:q(p.changeRate?p.b:p.changed)};
      const dx=q(2);
      return {intro:[],prompts:story(p,lang),graph:graph(named([l],[t('Oorspronkelijk','Original')]),named([updated],[t('Nieuw','Updated')]),
        points(l,dx).map((pt,i)=>({...pt,name:label(i),rise:i===1})),2,20,[time,`${axis} (${unit})`],true),
        parts:[part(t(`Bij 0 ${time} snijdt de lijn de verticale as bij €${p.b}. Dat is het ${p.setting===2?'bedrag dat al in de spaarpot zit':'bedrag dat je vooraf betaalt'}.`,
          `At 0 ${time} the line crosses the vertical axis at €${p.b}. That is the amount ${p.setting===2?'already in the jar':'you pay upfront'}.`)),
          part(...slopeSteps(l,dx),t(`Per ${['dag','uur','week'][p.setting]} komt er €${p.rate} bij.`,`The amount increases by €${p.rate} per ${['day','hour','week'][p.setting]}.`)),
          part(t('Neem x als tijd en y als bedrag in euro.','Let x be elapsed time and y be the amount in euros.'),formula(l),t(p.changeRate?'Vervang de helling.':'Vervang het startbedrag.',p.changeRate?'Replace the slope.':'Replace the starting amount.'),formula(updated),
          t('Trek de nieuwe lijn door deze punten.','Draw the updated line through these points.'),points(updated,dx).map(pt=>coord(pt.x,pt.y)).join('   '))]};
    }
    case 'word': {
      if(p.kind==='age') {
        const [who,other]=p.askOlder?['Sam','Noor']:['Noor','Sam'];
        const offset=p.askOlder?-p.gap:p.gap, age=(p.total-2*p.shift-offset)/2;
        return {intro:[],prompts:[story(p,lang)],parts:[part(
          t(`Noem de huidige leeftijd van ${who} x. ${other} is nu x${tail(q(offset))} jaar. Verschuif beide leeftijden met ${fmt(q(p.shift))} jaar.`,
            `Let x be ${who}’s current age. ${other} is now x${tail(q(offset))} years old. Shift both ages by ${fmt(q(p.shift))} years.`),
          `(x${tail(q(p.shift))}) + (x${tail(q(offset))}${tail(q(p.shift))}) = ${p.total}`,
          t('Neem de gelijksoortige termen samen.','Collect like terms.'),
          `${expr(q(2),q(2*p.shift+offset))} = ${p.total}`,...solve(q(2),q(2*p.shift+offset),q(0),q(p.total),t),
          t(`${who} is nu ${age} jaar. Controleer de som op het genoemde moment.`,`${who} is ${age} years old now. Check the sum at the specified time.`),
          `${age+p.shift} + ${age+offset+p.shift} = ${p.total}`)]};
      }
      const time=settings[p.setting][lang][1], duration=(p.total-p.b)/p.rate;
      return {intro:[],prompts:[story(p,lang)],parts:[part(t(`Noem het aantal ${time} x. Het totaal is het startbedrag plus ${p.rate} keer x.`,`Let x be the number of ${time}. The total is the starting amount plus ${p.rate} times x.`),
        `${expr(q(p.rate),q(p.b))} = ${p.total}`,...solve(q(p.rate),q(p.b),q(0),q(p.total),t),
        t(`Het antwoord is ${duration} ${time}. Controleer het totaal.`,`The answer is ${duration} ${time}. Check the total.`),
        `€${p.b} + €${p.rate} × ${duration} = €${p.total}`)]};
    }
  }
}
function solve(m,b,n,c,t,reverse=false) {
  const rows=[];
  const equation=(L,R)=>reverse?`${R} = ${L}`:`${L} = ${R}`;
  const a=sub(m,n), k=sub(c,b);
  if(n[0]) rows.push(t(`Trek (${expr(n,q(0))}) van beide kanten af.`,`Subtract (${expr(n,q(0))}) from both sides.`),equation(expr(a,b),fmt(c)));
  if(b[0]) rows.push(t(`Trek (${fmt(b)}) van beide kanten af.`,`Subtract (${fmt(b)}) from both sides.`),equation(expr(a,q(0)),fmt(k)));
  if(value(a)!==1) rows.push(t(`Deel beide kanten door ${fmt(a)}.`,`Divide both sides by ${fmt(a)}.`),equation('x',fmt(div(k,a))));
  if(reverse) rows.push(`x = ${fmt(div(k,a))}`);
  return rows;
}
