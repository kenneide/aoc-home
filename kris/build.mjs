import {mkdir,readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {draw,seal} from './draw.mjs';
await mkdir('dist',{recursive:true});await mkdir('private',{recursive:true});
try{await access('private/demo.json')}catch{const names=['Holly','Robin','Noel','Ivy','Jingle','Star'];const recipients=draw(names,[[names[0],names[1]],[names[4],names[5]]]);const entries=names.map((name,i)=>({name,...seal({name:recipients[i],face:'🎅'})}));await writeFile('private/demo.json',JSON.stringify(entries),{mode:0o600});}
const entries=JSON.parse(await readFile('private/demo.json','utf8'));
await writeFile('dist/reveals.json',JSON.stringify(Object.fromEntries(entries.map(e=>[e.id,e.payload]))));
await writeFile('private/demo-codes.txt',entries.map(e=>`${e.name}: ${e.code}`).join('\n'),{mode:0o600});
for(const file of ['index.html','app.js','style.css','show.js','music.js','choreography.js'])await copyFile(file,'dist/'+file);
await copyFile('../design/tokens.css','dist/tokens.css');await copyFile('../theme.js','dist/theme.js');
console.log('Built demo. Codes: private/demo-codes.txt. No family draw generated.');
