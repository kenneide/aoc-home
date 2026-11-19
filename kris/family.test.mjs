import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDecipheriv,createHash} from 'node:crypto';
const load=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
function decrypt(payload,code){const data=Buffer.from(payload.data,'base64'),decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update('kris-key:'+code).digest(),Buffer.from(payload.iv,'base64'));decipher.setAuthTag(data.subarray(-16));return JSON.parse(Buffer.concat([decipher.update(data.subarray(0,-16)),decipher.final()]).toString())}
test('saved family draw obeys exclusions and portraits follow real roster order',async t=>{
 let entries;try{entries=await load('./private/family.json')}catch(error){if(error.code==='ENOENT'){t.skip('Family draw has not been generated');return}throw error}
 const published=await load('./dist/reveals.json');if(!published[entries[0].id]){t.skip('Demo build is active');return}
 const names=entries.map(e=>e.name),seen=new Set(),photos=(await load('./private/photos.json')).faces;
 for(const e of entries){const result=decrypt(published[e.id],e.code);assert.ok(names.includes(result.name),'Recipient belongs to family');assert.ok(result.name!==e.name,'No self matches');for(const pair of [['Emma','Jonny'],['David','Lindsay']])assert.ok(!(pair.includes(e.name)&&pair.includes(result.name)),'Spouse exclusion honoured');seen.add(result.name);const cast=decrypt(published[e.id].cast,e.code);assert.deepEqual(cast.names,names);cast.photos.forEach((p,i)=>assert.ok(p===photos[names[i].toLowerCase()],'Portrait matches participant'));assert.equal(published[e.id].data,e.payload.data,'Assignment ciphertext preserved')}
 assert.equal(seen.size,6,'Each participant receives once');
});
