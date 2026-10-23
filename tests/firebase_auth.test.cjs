const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(fetch,key='test-api-key'){
 const ctx=vm.createContext({fetch});
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
 await assert.rejects(auth.signIn('crew','secret'),/belum dikonfigurasi/);
 const configured=setup(async()=>{calls++;},'key');
 await assert.rejects(configured.signIn('crew name','secret'),/Username hanya/);
 assert.equal(calls,0);
});

test('Firebase credential errors are shown without exposing password',async()=>{
 const auth=setup(async()=>({ok:false,json:async()=>({error:{message:'INVALID_LOGIN_CREDENTIALS'}})}));
 await assert.rejects(auth.signIn('crew','wrong-password'),/Username atau kata laluan tidak betul/);
});
