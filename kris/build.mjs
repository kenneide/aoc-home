import {portraitSlots,encryptPortraits} from './portraits.mjs';
import {mkdir,readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {draw,seal} from './draw.mjs';
await mkdir('dist',{recursive:true});await mkdir('private',{recursive:true});
const exists=async path=>{try{await access(path);return true}catch(error){if(error.code==='ENOENT')return false;throw error}};
const family=process.argv.includes('--family')||(!process.argv.includes('--demo')&&await exists('private/family.json'));
const mode=family?'family':'demo';
const names=family?['Emma','Jonny','Gerarda','Alan','David','Lindsay']:['Holly','Robin','Noel','Ivy','Jingle','Star'];
const path=`private/${mode}.json`;
let photos=null;
try{photos=portraitSlots(JSON.parse(await readFile('private/photos.json','utf8')))}catch(error){if(error.code!=='ENOENT')throw error}
if(family&&(!photos||photos.some(p=>!p)))throw Error('All six family portraits are required before generating the family draw');
if(!await exists(path)){
 const recipients=draw(names,[[names[0],names[1]],[names[4],names[5]]]);
 const entries=names.map((name,i)=>({name,...seal({name:recipients[i]})}));
 await writeFile(path,JSON.stringify(entries),{mode:0o600,flag:'wx'});
}
const entries=JSON.parse(await readFile(path,'utf8'));
if(JSON.stringify(entries.map(e=>e.name))!==JSON.stringify(names))throw Error('Saved draw roster differs from configured roster');
const cast={names,photos:photos??[]};
await writeFile('dist/reveals.json',JSON.stringify(Object.fromEntries(entries.map(e=>[e.id,{...e.payload,cast:encryptPortraits(cast,e.code)}]))));
await writeFile(`private/${mode}-codes.txt`,entries.map(e=>`${e.name}: ${e.code}`).join('\n')+'\n',{mode:0o600});
for(const file of ['app.js','style.css','show.js','music.js','choreography.js'])await copyFile(file,'dist/'+file);
const html=(await readFile('index.html','utf8')).replace('LOCAL DEMO · Fictional elves only',family?'FAMILY KRIS KINDLE · €50 GIFT BUDGET':'LOCAL DEMO · Fictional elves only');
await writeFile('dist/index.html',html);
await copyFile('../design/tokens.css','dist/tokens.css');await copyFile('../theme.js','dist/theme.js');
await writeFile('dist/robots.txt','User-agent: *\nDisallow: /\n');
await writeFile('dist/_headers','/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Cache-Control: no-cache\n');
console.log(`Built ${mode} locally. Codes: private/${mode}-codes.txt. Saved draw and codes preserved on subsequent builds.`);
