import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {runInNewContext} from 'node:vm';
const source = await readFile(new URL('./app.js', import.meta.url),'utf8');
const published = JSON.parse(await readFile(new URL('./dist/reveals.json', import.meta.url),'utf8'));
let demos = JSON.parse(await readFile(new URL('./private/demo.json', import.meta.url),'utf8'));
if(!published[demos[0].id]) demos = JSON.parse(await readFile(new URL('./private/family.json', import.meta.url),'utf8'));
function setup({protocol='http:', crypto=webcrypto, fetch: fetcher=async()=>({ok:true,json:async()=>published})}={}) {
 const elements = new Map();
 const document={createElement(){return {setAttribute(){}}},querySelector(s){if(!elements.has(s))elements.set(s,{value:'',hidden:true,textContent:'',focus(){},append(){},classList:{add(){},remove(){}}});return elements.get(s)}};
 runInNewContext(source.replace(/^import .*;\n/, ''),{createShow:(_host, _recipient, finish)=>({start:finish,stop(){},skip:finish,mute(){return true}}),document,crypto,location:{protocol},fetch:fetcher,TextEncoder,TextDecoder,Uint8Array,atob});
 const el=s=>document.querySelector(s);
 return {el,async submit(code){el('#code').value=code;await el('form').onsubmit({preventDefault(){}})}};
}
test('all six published codes unlock and reveal; lock clears recipient',async()=>{
 for(const entry of demos){const ui=setup();await ui.submit(entry.code);assert.equal(ui.el('#error').textContent,'');assert.equal(ui.el('#gift').hidden,false);ui.el('#unwrap').onclick();assert.ok(demos.some(e=>ui.el('#name').textContent === 'YOUR KRIS KINDLE IS… ' + e.name + '!'));assert.notEqual(ui.el('#name').textContent,'YOUR KRIS KINDLE IS… ' + entry.name + '!');ui.el('#lock').onclick();assert.equal(ui.el('#name').textContent,'');assert.equal(ui.el('#login').hidden,false)}
});
test('whole labelled lines, uppercase and spaced codes work',async()=>{const ui=setup();await ui.submit(`${demos[0].name}: ${demos[0].code.toUpperCase().match(/.{4}/g).join('-')}`);assert.equal(ui.el('#gift').hidden,false)});
test('invalid code, file URL, insecure context and fetch failure give useful errors',async()=>{
 for(const [options,code,message] of [[{},'wrong',/32-character/],[{},'0'.repeat(32),/does not open/],[{protocol:'file:'},demos[0].code,/Opening the HTML/],[{crypto:{}},demos[0].code,/HTTPS or localhost/],[{fetch:async()=>{throw Error()}},demos[0].code,/could not be loaded/]]){const ui=setup(options);await ui.submit(code);assert.match(ui.el('#error').textContent,message)}
});
test('tampered ciphertext cannot unlock',async()=>{const data=structuredClone(published);data[demos[0].id].data='AAAA';const ui=setup({fetch:async()=>({ok:true,json:async()=>data})});await ui.submit(demos[0].code);assert.match(ui.el('#error').textContent,/does not open/)});
