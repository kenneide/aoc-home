import {createHash,createCipheriv,randomBytes} from 'node:crypto';
export const photoIds=['emma','jonny','gerarda','alan','david','lindsay'];
export function portraitSlots(data){
 if(data.version!==1||!data.faces||typeof data.faces!=='object')throw Error('Invalid photos.json');
 for(const [id,photo]of Object.entries(data.faces))if(!photoIds.includes(id)||typeof photo!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(photo)||photo.length>1500000)throw Error('Invalid or oversized portrait: '+id);
 return photoIds.map(id=>data.faces[id]??null);
}
export function encryptPortraits(photos,code){
 const key=createHash('sha256').update('kris-key:'+code).digest(),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
 const data=Buffer.concat([cipher.update(JSON.stringify(photos)),cipher.final(),cipher.getAuthTag()]);return {iv:iv.toString('base64'),data:data.toString('base64')};
}
