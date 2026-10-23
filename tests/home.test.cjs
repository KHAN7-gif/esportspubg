const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function home(){
 const nodes={};const get=id=>nodes[id]??={value:'',textContent:'',innerHTML:'',dataset:{},addEventListener(){},focus(){},classList:{add(){},remove(){}}};
 const classes=new Set(),session=new Map();
 const ctx=vm.createContext({console,crypto:{randomUUID:()=> 'new-profile'},
  document:{hidden:false,getElementById:get,querySelectorAll:()=>[],addEventListener(){},body:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}}},
  window:{addEventListener(){}},setTimeout(){},clearTimeout(){},setInterval(){},
  localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},
  fsGet(){return Promise.resolve();},fsListen(){},confirm:()=>true});
 vm.runInContext(fs.readFileSync('crew_profiles.js','utf8'),ctx);
 const script=[...fs.readFileSync('index.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].pop()[1];
 vm.runInContext(script,ctx);return {ctx,nodes,get,classes,session};
}
test('Home requires a profile and switching is isolated to its browser tab',()=>{
 const a=home(),b=home();assert.equal(a.classes.has('locked'),true);
 a.get('lgUser').value='c1';a.ctx.doLogin({preventDefault(){}});
 assert.equal(a.classes.has('locked'),false);assert.equal(a.get('profileName').textContent,'admin');
 assert.equal(b.session.size,0);assert.equal(b.classes.has('locked'),true);
 a.ctx.logout();assert.equal(a.session.size,0);assert.equal(a.classes.has('locked'),true);
});
test('Home renders profile names as escaped text and signs out removed profiles',()=>{
 const a=home();a.ctx.crew=[{id:'c1',name:'admin',role:'admin'},{id:'new',name:'<img onerror=x>',role:'crew'}];
 a.ctx.renderCrew();assert.match(a.get('crewList').innerHTML,/&lt;img onerror=x&gt;/);
 a.get('lgUser').value='new';a.ctx.doLogin();assert.equal(a.get('profileName').textContent,'<img onerror=x>');
 a.ctx.crew=[a.ctx.crew[0]];a.ctx.updateProfile();assert.equal(a.classes.has('locked'),true);
});
test('Home keeps zero alive and has no invented team count before data',()=>{
 const a=home();assert.match(a.get('livePill').textContent,/^0 TEAMS/);
 a.ctx.homeSP={teams:[{},{}]};a.ctx.homeLive={liveData:{a:{alive:[0,0,0,0]},b:{alive:[0,0,0,0]}}};
 a.ctx.updateLive();assert.equal(a.get('livePill').textContent,'2 TEAMS · 0 ALIVE');
});
