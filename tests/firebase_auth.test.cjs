const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(fetch,key='test-api-key',saved=new Map()){
 const ctx=vm.createContext({fetch,sessionStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}});
 vm.runInContext(fs.readFileSync('firebase_auth.js','utf8')+
  '\nFIREBASE_AUTH_API_KEY='+JSON.stringify(key)+';FIREBASE_AUTH_EMAIL_DOMAIN="maidaesports.com";',ctx);
 return ctx.CrewAuth;
}

test('username sign-in maps to Firebase email and keeps the ID token in memory',async()=>{
 let request;
 const auth=setup(async(url,options)=>{
  request={url,options};
  return {ok:true,json:async()=>({idToken:'sample'})};
 });
 await auth.signIn('Crew_1','secret');
 assert.match(request.url,/accounts:signInWithPassword/);
 assert.match(request.url,/key=test-api-key/);
 assert.equal(JSON.parse(request.options.body).email,'crew_1@maidaesports.com');
 assert.equal(JSON.parse(request.options.body).password,'secret');
 assert.equal(auth.authorizationHeaders().Authorization,'Bearer sample');
 auth.signOut();
 assert.deepEqual({...auth.authorizationHeaders()},{});
});

test('missing configuration and invalid usernames fail before network access',async()=>{
 let calls=0;const auth=setup(async()=>{calls++;},'');
 await assert.rejects(auth.signIn('crew','secret'),/belum diaktifkan/);
 const configured=setup(async()=>{calls++;},'key');
 await assert.rejects(configured.signIn('crew name','secret'),/Username hanya/);
 assert.equal(calls,0);
});

test('Firebase credential errors are shown without exposing password',async()=>{
 const auth=setup(async()=>({ok:false,json:async()=>({error:{message:'INVALID_LOGIN_CREDENTIALS'}})}));
 await assert.rejects(auth.signIn('crew','wrong-password'),/Username atau kata laluan tidak betul/);
});


test('full admin email is sent unchanged rather than appending the legacy domain',async()=>{
 let body;const auth=setup(async(url,options)=>{body=JSON.parse(options.body);return {ok:true,json:async()=>({idToken:'email-token',email:'apengtakahashi@gmail.com',expiresIn:'3600'})};});
 const user=await auth.signIn('  apengtakahashi@gmail.com  ','password');
 assert.equal(body.email,'apengtakahashi@gmail.com');assert.equal(user.email,body.email);assert.equal(auth.currentUser().email,body.email);
});
test('reload validates the saved token with Firebase and signout removes the session',async()=>{
 const saved=new Map();let lookups=0;
 const fetch=async(url)=>{if(url.includes('accounts:lookup')){lookups++;return {ok:true,json:async()=>({users:[{email:'admin@example.com'}]})};}return {ok:true,json:async()=>({idToken:'valid',expiresIn:'3600'})};};
 await setup(fetch,'key',saved).signIn('admin@example.com','password');
 const next=setup(fetch,'key',saved);assert.equal(next.currentUser(),null);
 assert.equal((await next.restoreSession()).email,'admin@example.com');assert.equal(lookups,1);
 next.signOut();assert.equal(saved.size,0);
});
test('an arbitrary saved username never grants a session and revoked tokens are cleared',async()=>{
 const saved=new Map([['maida_login_user','admin']]);let calls=0;
 const denied=async()=>{calls++;return {ok:false,json:async()=>({error:{message:'INVALID_ID_TOKEN'}})};};
 const auth=setup(denied,'key',saved);assert.equal(await auth.restoreSession(),null);assert.equal(calls,0);
 saved.set('maida_firebase_session_v1',JSON.stringify({idToken:'revoked',expiresAt:Date.now()+60000}));
 await assert.rejects(auth.restoreSession(),/Sesi tidak sah/);assert.equal(saved.size,0);assert.deepEqual({...auth.authorizationHeaders()},{});
});
test('expired sessions never authenticate and network failures do not leave a logged-in user',async()=>{
 const saved=new Map([['maida_firebase_session_v1',JSON.stringify({idToken:'expired',expiresAt:Date.now()-1})]]);
 const auth=setup(async()=>{throw Error('network');},'key',saved);
 assert.equal(await auth.restoreSession(),null);assert.equal(saved.size,0);
 await assert.rejects(auth.signIn('admin@example.com','secret'),/sambungan internet/);assert.equal(auth.currentUser(),null);
});
