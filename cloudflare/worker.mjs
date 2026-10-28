import {createRemoteJWKSet, jwtVerify} from 'jose';

const keysets = new Map();
function configuration(env) {
  const issuer = String(env.ACCESS_TEAM_DOMAIN || '').replace(/\/$/, '');
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !env.ACCESS_AUD)
    throw new Error('Cloudflare Access belum dikonfigurasi.');
  return issuer;
}
export async function verifyIdentity(request, env, keyset) {
  const issuer = configuration(env);
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new Error('Sesi Cloudflare Access diperlukan.');
  if (!keyset) {
    if (!keysets.has(issuer)) keysets.set(issuer, createRemoteJWKSet(new URL(issuer + '/cdn-cgi/access/certs')));
    keyset = keysets.get(issuer);
  }
  const {payload} = await jwtVerify(token, keyset, {
    issuer, audience:env.ACCESS_AUD, algorithms:['RS256'], requiredClaims:['exp','iat','sub','email']
  });
  if (typeof payload.email !== 'string' || !payload.email.includes('@')) throw new Error('Identiti e-mel tidak sah.');
  return {email:payload.email, name:payload.email, expiresAt:payload.exp};
}
function json(data, status=200) {
  return Response.json(data, {status, headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export function createWorker(verify=verifyIdentity) {
  return {
    async fetch(request, env) {
      try { configuration(env); }
      catch { return json({error:'Cloudflare Access belum dikonfigurasi.'},503); }
      let user;
      try { user=await verify(request,env); }
      catch { return json({error:'Sesi tidak sah atau tamat. Buka semula domain aplikasi untuk log masuk.'},401); }
      const url=new URL(request.url);
      if (url.pathname==='/api/auth/session') {
        if (request.method!=='GET') return json({error:'Method not allowed'},405);
        return json({provider:'cloudflare',user});
      }
      // All HTML, JS, images and overlay URLs pass through verification first.
      const asset=await env.ASSETS.fetch(request);
      const response=new Response(asset.body,asset);
      response.headers.set('Cache-Control','private, no-store');
      response.headers.set('X-Content-Type-Options','nosniff');
      return response;
    }
  };
}
export default createWorker();
