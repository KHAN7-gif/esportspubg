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
  fsGet(){return Promise.resolve();},fsListen(){},confirm:()=>true,
  CrewAuth:{signIn:async(username,password)=>{if(username!=='crew'||password!=='secret')throw Error('Username atau kata laluan tidak betul.');return {idToken:'test-token'};},signOut(){}}});
 vm.runInContext(fs.readFileSync('crew_profiles.js','utf8'),ctx);
 const script=[...fs.readFileSync('index.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].pop()[1];
 vm.runInContext(script,ctx);return {ctx,nodes,get,classes,session};
}
test('Home requires authenticated username and password per browser tab',async()=>{
 const a=home(),b=home();assert.equal(a.classes.has('locked'),true);
 a.get('lgUser').value='crew';a.get('lgPassword').value='secret';await a.ctx.doLogin({preventDefault(){}});
 assert.equal(a.classes.has('locked'),false);assert.equal(a.get('profileName').textContent,'crew');
 assert.equal(b.session.size,0);assert.equal(b.classes.has('locked'),true);
 a.ctx.logout();assert.equal(a.session.size,0);assert.equal(a.classes.has('locked'),true);
});
test('Home rejects invalid credentials and clears password after successful login',async()=>{
 const a=home();a.get('lgUser').value='wrong';a.get('lgPassword').value='bad';
 await a.ctx.doLogin({preventDefault(){}});
 assert.equal(a.classes.has('locked'),true);assert.equal(a.get('lgErr').textContent,'Username atau kata laluan tidak betul.');
 a.get('lgUser').value='crew';a.get('lgPassword').value='secret';await a.ctx.doLogin({preventDefault(){}});
 assert.equal(a.get('lgPassword').value,'');
});
test('Home renders profile names as escaped text',()=>{
 const a=home();a.ctx.crew=[{id:'c1',name:'admin',role:'admin'},{id:'new',name:'<img onerror=x>',role:'crew'}];
 a.ctx.renderCrew();assert.match(a.get('crewList').innerHTML,/&lt;img onerror=x&gt;/);
});
test('Home keeps zero alive and has no invented team count before data',()=>{
 const a=home();assert.match(a.get('livePill').textContent,/^0 TEAMS/);
 a.ctx.homeSP={teams:[{},{}]};a.ctx.homeLive={liveData:{a:{alive:[0,0,0,0]},b:{alive:[0,0,0,0]}}};
 a.ctx.updateLive();assert.equal(a.get('livePill').textContent,'2 TEAMS · 0 ALIVE');
});
