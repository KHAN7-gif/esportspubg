const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(fetch){const ctx=vm.createContext({fetch,DB_URL:'https://test.invalid'});vm.runInContext(fs.readFileSync('crew_profiles.js','utf8'),ctx);return ctx.CrewProfiles;}
function read(data,tag='v1'){return {ok:true,headers:{get:()=>tag},json:async()=>data};}
test('fresh cloud has a default profile and malformed profiles are rejected',()=>{
 const api=setup();assert.equal(api.profiles(null)[0].id,'c1');
 assert.throws(()=>api.profiles({'x\'onclick':{name:'x',role:'crew'}}));
 assert.throws(()=>api.profiles({x:{name:'x',role:'owner'}}));
});
test('a concurrent change is re-read before retry, preserving both users',async()=>{
 let calls=0,body;
 const api=setup(async(url,options)=>{
  assert.match(url,/crewProfiles.json$/);
  calls++;
  if(calls===1)return read(null);
  if(calls===2)return {ok:false,status:412};
  if(calls===3)return read({c1:{name:'admin',role:'admin'},other:{name:'Other',role:'crew'}},'v2');
  assert.equal(options.headers['if-match'],'v2');body=JSON.parse(options.body);return {ok:true,status:200};
 });
 const list=await api.change({type:'add',id:'new',name:'New',role:'crew'});
 assert.equal(list.length,3);assert.equal(body.other.name,'Other');
});
test('duplicates and protected admin deletion never write',async()=>{
 let writes=0;const api=setup(async(url,options)=>{if(options.method)writes++;return read(null);});
 await assert.rejects(api.change({type:'add',id:'new',name:' ADMIN ',role:'crew'}),/sudah digunakan/);
 await assert.rejects(api.change({type:'delete',id:'c1'}),/tidak boleh/);assert.equal(writes,0);
});
test('denied writes and missing ETags report failure',async()=>{
 const api=setup(async(url,options)=>options.method?{ok:false,status:403}:read(null));
 await assert.rejects(api.change({type:'add',id:'new',name:'New'}),/tidak disimpan/);
 const noTag=setup(async()=>read(null,null));
 await assert.rejects(noTag.change({type:'reset'}),/versi profil/);
});
test('bounded retries do not overwrite a constantly changing directory',async()=>{
 let writes=0;const api=setup(async(url,options)=>{if(options.method){writes++;return {ok:false,status:412};}return read(null);});
 await assert.rejects(api.change({type:'add',id:'new',name:'New'}),/pengguna lain/);assert.equal(writes,4);
});
