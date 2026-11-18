import assert from 'node:assert/strict';
import {mergeChanges,cloneData} from './sync.js';
const base = {children:[{id:'c',name:'Teste',routines:{seg:[{id:'a',title:'A',time:'08:00'},{id:'b',title:'B',time:'09:00'}],ter:[]}}],checks:{}};
let count=0;
function test(name,fn){fn();count++;console.log('PASS',name)}
test('independent checks coexist even when nested maps are new',()=>{
 const a=cloneData(base),b=cloneData(base);a.checks.c={'2026-11-17':{a:true}};b.checks.c={'2026-11-17':{b:true}};
 assert.deepEqual(mergeChanges(base,b,mergeChanges(base,a,base)).checks.c['2026-11-17'],{a:true,b:true});
});
test('separate edits to same item coexist',()=>{const a=cloneData(base),b=cloneData(base);a.children[0].routines.seg[0].title='Novo';b.children[0].routines.seg[0].time='10:00';const r=mergeChanges(base,b,a);assert.equal(r.children[0].routines.seg[0].title,'Novo');assert.equal(r.children[0].routines.seg[0].time,'10:00')});
test('remote student addition survives local edit',()=>{const a=cloneData(base),b=cloneData(base);a.children.push({id:'new',name:'Novo',routines:{}});b.children[0].name='Editado';const r=mergeChanges(base,b,a);assert.equal(r.children.length,2);assert.equal(r.children[0].name,'Editado')});
test('remote deletion is not resurrected by a stale edit',()=>{const a=cloneData(base),b=cloneData(base);a.children=[];b.children[0].name='Editado';assert.deepEqual(mergeChanges(base,b,a).children,[])});
test('local deletion preserves unrelated remote changes',()=>{const a=cloneData(base),b=cloneData(base);a.children[0].routines.seg[1].title='B novo';b.children[0].routines.seg.shift();assert.deepEqual(mergeChanges(base,b,a).children[0].routines.seg,[{id:'b',title:'B novo',time:'09:00'}])});
test('reorder keeps independently added activity',()=>{const a=cloneData(base),b=cloneData(base);a.children[0].routines.seg.push({id:'z',title:'Z'});b.children[0].routines.seg.reverse();assert.deepEqual(mergeChanges(base,b,a).children[0].routines.seg.map(x=>x.id),['b','a','z'])});
test('replaying an acknowledged change is idempotent',()=>{const b=cloneData(base);b.children[0].routines.seg.push({id:'z',title:'Z'});const r=mergeChanges(base,b,base);assert.deepEqual(mergeChanges(base,b,r),r)});
test('unchanged data and unknown fields are preserved',()=>{const b=cloneData(base),r=cloneData(base);r.future={keep:true};b.children[0].name='Nome';assert.deepEqual(mergeChanges(base,b,r).future,{keep:true});assert.deepEqual(base.children[0].name,'Teste')});
console.log(`${count} merge regression tests passed.`);
