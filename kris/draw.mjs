import { randomInt, randomBytes, createHash, createCipheriv } from 'node:crypto';
export function draw(names, pairs=[]) {
 if(new Set(names).size!==names.length || names.length<2) throw Error('Provide distinct participants');
 const forbidden=new Set(pairs.flatMap(([a,b])=>{if(!names.includes(a)||!names.includes(b))throw Error('Unknown exclusion');return [JSON.stringify([a,b]),JSON.stringify([b,a])]}));
 const choices=[];
 function visit(rest,path){if(!rest.length){choices.push(path);return} for(const n of rest){const giver=names[path.length];if(n!==giver&&!forbidden.has(JSON.stringify([giver,n])))visit(rest.filter(x=>x!==n),[...path,n]);}}
 visit(names,[]);if(!choices.length)throw Error('No valid draw');return choices[randomInt(choices.length)];
}
export function seal(payload){const code=randomBytes(16).toString('hex');const key=createHash('sha256').update('kris-key:'+code).digest();const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update(JSON.stringify(payload)),cipher.final(),cipher.getAuthTag()]);return {code,id:createHash('sha256').update('kris-id:'+code).digest('hex'),payload:{iv:iv.toString('base64'),data:data.toString('base64')}};}
