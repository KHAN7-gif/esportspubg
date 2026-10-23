/* Shared collaboration profiles. These are not authenticated accounts. */
(function(global){
  'use strict';
  var path = '/maida/crewProfiles.json';
  var defaultProfile = {id:'c1',name:'admin',role:'admin'};
  function profiles(data){
    if(data == null) return [Object.assign({},defaultProfile)];
    if(typeof data !== 'object' || Array.isArray(data)) throw Error('Format profil cloud tidak sah.');
    return Object.keys(data).map(function(id){
      var item=data[id];
      if(!/^[a-zA-Z0-9_-]+$/.test(id) || !item || typeof item.name!=='string' || !item.name.trim() || item.name.length>48 || !/^(admin|crew)$/.test(item.role))
        throw Error('Format profil cloud tidak sah.');
      return {id:id,name:item.name,role:item.role};
    }).sort(function(a,b){return a.id==='c1'?-1:b.id==='c1'?1:a.name.localeCompare(b.name);});
  }
  async function change(action){
    for(var attempt=0;attempt<4;attempt++){
      var response=await fetch(DB_URL+path,{headers:{'X-Firebase-ETag':'true'},cache:'no-store'});
      if(!response.ok) throw Error('Tidak dapat membaca profil cloud ('+response.status+').');
      var tag=response.headers.get('ETag');
      if(!tag) throw Error('Cloud tidak menyediakan versi profil. Sila cuba lagi.');
      var list=profiles(await response.json());
      var data={}; list.forEach(function(p){data[p.id]={name:p.name,role:p.role};});
      if(action.type==='add'){
        var name=String(action.name||'').trim();
        if(!name || name.length>48)throw Error('Nama perlu mengandungi 1–48 aksara.');
        if(list.some(function(p){return p.name.toLocaleLowerCase()===name.toLocaleLowerCase();}))throw Error('Nama profil sudah digunakan.');
        if(!/^[a-zA-Z0-9_-]+$/.test(action.id) || data[action.id])throw Error('ID profil tidak sah atau sudah digunakan.');
        data[action.id]={name:name,role:action.role==='admin'?'admin':'crew'};
      }else if(action.type==='delete'){
        if(action.id==='c1')throw Error('Profil admin utama tidak boleh dibuang.');
        delete data[action.id];
      }else if(action.type==='reset'){
        data={c1:{name:defaultProfile.name,role:defaultProfile.role}};
      }else throw Error('Tindakan profil tidak sah.');
      var saved=await fetch(DB_URL+path,{method:'PUT',headers:{'Content-Type':'application/json','if-match':tag},body:JSON.stringify(data)});
      if(saved.status===412)continue;
      if(!saved.ok)throw Error('Profil tidak disimpan ('+saved.status+'). Semak sambungan atau akses Firebase.');
      return profiles(data);
    }
    throw Error('Profil sedang dikemas kini oleh pengguna lain. Sila cuba lagi.');
  }
  global.CrewProfiles={profiles:profiles,change:change};
})(globalThis);
