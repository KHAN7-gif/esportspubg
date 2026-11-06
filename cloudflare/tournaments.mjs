const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function tournaments(request,env,admin){
 const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean);
 const id=parts[2];
 if(!env.DB)return json({error:'Database D1 belum dikonfigurasi.'},503);
 if(!['GET','POST','PUT'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.method==='GET'){
  if(id){
   const row=await env.DB.prepare('SELECT id,name,status,published,updated_at FROM tournaments WHERE id=?'+(admin?'':' AND published=1')).bind(id).first();
   if(!row)return json({error:'Tournament tidak ditemui.'},404);
   const {results}=await env.DB.prepare('SELECT id,name,kills,placement_points,(kills+placement_points) AS total FROM teams WHERE tournament_id=? ORDER BY total DESC,kills DESC,name ASC').bind(id).all();
   return json({...row,teams:results});
  }
  const {results}=await env.DB.prepare('SELECT id,name,status,published,updated_at FROM tournaments'+(admin?'':' WHERE published=1')+' ORDER BY updated_at DESC').all();
  return json({tournaments:results});
 }
 if(!admin)return json({error:'Login admin diperlukan.'},401);
 if(request.headers.get('Origin')!==url.origin)return json({error:'Origin tidak sah.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON diperlukan.'},415);
 const raw=await request.text();if(raw.length>100000)return json({error:'Data terlalu besar.'},413);
 let data;try{data=JSON.parse(raw);}catch{return json({error:'JSON tidak sah.'},400);}
 const name=typeof data.name==='string'?data.name.trim():'';
 if(!name||name.length>120||!['upcoming','live','completed'].includes(data.status)||typeof data.published!=='boolean')return json({error:'Nama, status atau penerbitan tidak sah.'},400);
 if(request.method==='POST'&&!id){
  const newId=crypto.randomUUID();
  await env.DB.prepare('INSERT INTO tournaments(id,name,status,published) VALUES(?,?,?,?)').bind(newId,name,data.status,Number(data.published)).run();
  return json({id:newId},201);
 }
 if(request.method!=='PUT'||!id)return json({error:'Method not allowed'},405);
 if(!Array.isArray(data.teams)||data.teams.length>100)return json({error:'Maksimum 100 pasukan.'},400);
 if(data.teams.some(t=>!t||typeof t.name!=='string'||!t.name.trim()||t.name.length>100||![t.kills,t.placement_points].every(v=>Number.isSafeInteger(v)&&v>=0&&v<=100000)))return json({error:'Nama atau mata pasukan tidak sah.'},400);
 const existing=await env.DB.prepare('SELECT id FROM tournaments WHERE id=?').bind(id).first();
 if(!existing)return json({error:'Tournament tidak ditemui.'},404);
 await env.DB.batch([
  env.DB.prepare("UPDATE tournaments SET name=?,status=?,published=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(name,data.status,Number(data.published),id),
  env.DB.prepare('DELETE FROM teams WHERE tournament_id=?').bind(id),
  ...data.teams.map(t=>env.DB.prepare('INSERT INTO teams(id,tournament_id,name,kills,placement_points) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,t.name.trim(),t.kills,t.placement_points))
 ]);
 return json({id});
}
