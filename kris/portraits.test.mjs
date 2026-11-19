import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,randomBytes,createHash} from 'node:crypto';
import {portraitSlots,encryptPortraits} from './portraits.mjs';
test('photos retain their slot and decrypt only with the matching code',async()=>{
 const png='data:image/png;base64,aGVsbG8=';const photos=portraitSlots({version:1,faces:{alan:png}});assert.equal(photos[3],png);assert.equal(photos[0],null);
 const code=randomBytes(16).toString('hex');const record=encryptPortraits(photos,code);
 const key=await webcrypto.subtle.importKey('raw',createHash('sha256').update('kris-key:'+code).digest(),'AES-GCM',false,['decrypt']);
 const plaintext=await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(record.iv,'base64')},key,Buffer.from(record.data,'base64'));
 assert.deepEqual(JSON.parse(new TextDecoder().decode(plaintext)),photos);assert.ok(!JSON.stringify(record).includes(png));
 const wrong=await webcrypto.subtle.importKey('raw',randomBytes(32),'AES-GCM',false,['decrypt']);await assert.rejects(webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(record.iv,'base64')},wrong,Buffer.from(record.data,'base64')));
});
test('reject unknown people and non-image content',()=>{assert.throws(()=>portraitSlots({version:1,faces:{unknown:'data:image/png;base64,AA=='}}));assert.throws(()=>portraitSlots({version:1,faces:{emma:'javascript:alert(1)'}}))});
