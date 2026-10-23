import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {verifyIdentity,createWorker} from '../cloudflare/worker.mjs';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';

const {privateKey,publicKey}=await generateKeyPair('RS256');
const jwk=await exportJWK(publicKey);jwk.kid='test';
const keys=createLocalJWKSet({keys:[jwk]});
const env={ACCESS_TEAM_DOMAIN:'https://maida-test.cloudflareaccess.com',ACCESS_AUD:'aud-test'};
async function token(overrides={}){
 return new SignJWT({email:'crew@example.com',...overrides})
  .setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('user-1')
  .setIssuer(overrides.iss||env.ACCESS_TEAM_DOMAIN).setAudience(overrides.aud||env.ACCESS_AUD)
  .setIssuedAt().setExpirationTime(overrides.exp||'5m').sign(privateKey);
}
const request=t=>new Request('https://pubg.example.com/api/auth/session',{headers:t?{'Cf-Access-Jwt-Assertion':t}:{}});
test('Access validates a signed user and ignores spoofed email headers',async()=>{
 const req=request(await token());req.headers.set('Cf-Access-Authenticated-User-Email','attacker@example.com');
 const user=await verifyIdentity(req,env,keys);assert.equal(user.email,'crew@example.com');
});
test('missing, malformed, expired, wrong audience and wrong issuer tokens fail',async()=>{
 for(const t of [null,'invalid',await token({exp:1}),await token({aud:'other'}),await token({iss:'https://other.cloudflareaccess.com'})])
  await assert.rejects(verifyIdentity(request(t),env,keys));
});
test('missing configuration fails closed before serving assets',async()=>{
 let called=false;const res=await createWorker().fetch(request(),{ASSETS:{fetch(){called=true;}}});
 assert.equal(res.status,503);assert.equal(called,false);
});
test('invalid users cannot open direct admin pages, assets or session endpoint',async()=>{
 const worker=createWorker(()=>{throw Error('bad token');});let called=false;
 for(const path of ['/Standing_Point_v2.html','/leaderboard_FINAL.html','/firebase_sync.js','/api/auth/session']){
  const res=await worker.fetch(new Request('https://pubg.example.com'+path),{...env,ASSETS:{fetch(){called=true;}}});
  assert.equal(res.status,401);assert.equal(res.headers.get('Cache-Control'),'no-store');
 }
 assert.equal(called,false);
});
test('session contains only verified identity and assets are private',async()=>{
 const worker=createWorker(req=>verifyIdentity(req,env,keys));const t=await token();
 const res=await worker.fetch(request(t),env);const data=await res.json();
 assert.equal(data.provider,'cloudflare');assert.equal(data.user.email,'crew@example.com');assert.equal(data.token,undefined);
 const asset=await worker.fetch(new Request('https://pubg.example.com/index.html',{headers:{'Cf-Access-Jwt-Assertion':t}}),{
  ...env,ASSETS:{fetch:async()=>new Response('<html>ok</html>')}
 });
 assert.equal(asset.headers.get('Cache-Control'),'private, no-store');
});
test('Cloudflare build uses verified login and excludes deployment source files',()=>{
 execFileSync(process.execPath,['scripts/build-cloudflare.mjs']);
 const html=readFileSync('dist-cloudflare/index.html','utf8');
 assert.match(html,/updateLive\(\);initCloudflareLogin\(\);/);
 assert.ok(!html.includes('updateLive();updateProfile();refreshCrew();'));
 assert.ok(!html.includes("setInterval(function(){if(!document.hidden)refreshCrew();},5000)"));
 for(const name of readdirSync('dist-cloudflare'))assert.match(name,/\.(html|js|png)$/);
 assert.ok(!readdirSync('dist-cloudflare').includes('worker.mjs'));
 const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
 assert.equal(config.assets.run_worker_first,true);assert.equal(config.workers_dev,false);assert.equal(config.preview_urls,false);
});
