const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup(fetch) {
  const timers = new Map(); let id = 0;
  const ctx = vm.createContext({fetch, console: {log(){}, warn(){}},
    setTimeout(fn){ timers.set(++id, fn); return id; },
    clearTimeout(key){timers.delete(key);},
    localStorage: {getItem(){return '{"backup":true}';}, setItem(){}}});
  vm.runInContext(fs.readFileSync('firebase_sync.js', 'utf8'), ctx);
  return {ctx, timers};
}
const response = data => ({ok:true, json:async()=>data});
const flush = () => new Promise(resolve => setImmediate(resolve));
test('failed reads never deliver null data or leave a healthy status', async()=>{
  const {ctx} = setup(async()=>{throw Error('offline');});
  ctx._FB.ok = true; let called = false, error;
  await ctx.fsGet('maida/spData', ()=>called=true, e=>error=e);
  assert.equal(called,false); assert.equal(ctx._FB.ok,false); assert.ok(error);
});
test('genuine database null is delivered and does not restore stale backup', async()=>{
  const {ctx} = setup(async()=>response(null)); let value = 'pending';
  ctx.fbLoadAll(data=>value=data); await flush(); assert.equal(value,null);
});
test('offline full load restores backup', async()=>{
  const {ctx} = setup(async()=>{throw Error('offline');}); let value;
  ctx.fbLoadAll(data=>value=data); await flush(); assert.equal(value.backup,true);
});
test('status check makes a read request', async()=>{
  let request; const {ctx} = setup(async(...args)=>{request=args;return response({});});
  await ctx.fsCheckStatus(); assert.match(request[0], /shallow=true$/);
  assert.equal(request[1],undefined);
});
test('polls do not overlap and late stopped responses are ignored', async()=>{
  let resolve; let calls=0; const {ctx,timers} = setup(()=>{calls++;return new Promise(r=>resolve=r);});
  let delivered=0; ctx.fsListen('maida',()=>delivered++);
  assert.equal(calls,1); assert.equal(timers.size,0);
  ctx.fsUnlisten('maida'); resolve(response({x:1})); await flush();
  assert.equal(delivered,0); assert.equal(timers.size,0);
});
test('polls deduplicate data and recover after errors', async()=>{
  let calls=0; const {ctx,timers} = setup(async()=>{if(++calls===2)throw Error('offline');return response({x:1});});
  let delivered=0; ctx.fsListen('maida',()=>delivered++); await flush();
  assert.equal(delivered,1);
  async function tick(){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();await flush();}
  await tick(); assert.equal(ctx._FB.ok,false); assert.equal(delivered,1);
  await tick(); assert.equal(ctx._FB.ok,true); assert.equal(delivered,1);
  ctx.fsUnlisten('maida'); assert.equal(timers.size,0);
});
test('failed writes clear connection status and report failure', async()=>{
  const {ctx} = setup(async()=>({ok:false,status:403,text:async()=> 'denied'}));
  ctx._FB.ok=true; let error, saved=false;
  await ctx.fsSet('maida',{},()=>saved=true,e=>error=e);
  assert.equal(saved,false); assert.equal(ctx._FB.ok,false); assert.ok(error);
});
