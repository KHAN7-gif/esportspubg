import {mkdir,rm,readdir,copyFile,readFile,writeFile} from 'node:fs/promises';
await rm('dist-cloudflare',{recursive:true,force:true});
await mkdir('dist-cloudflare');
for(const name of await readdir('.')){
  if(/\.(html|png)$/.test(name)||['firebase_sync.js','crew_profiles.js'].includes(name))
    await copyFile(name,'dist-cloudflare/'+name);
}
await copyFile('cloudflare/login-client.js','dist-cloudflare/cloudflare-login.js');
let html=await readFile('index.html','utf8');
const startup='renderMods();renderCrew();updateLive();updateProfile();refreshCrew();';
if(!html.includes(startup))throw Error('Home startup changed; review Cloudflare integration before deploying.');
html=html.replace('<script src="crew_profiles.js"></script>','<script src="crew_profiles.js"></script>\n<script src="cloudflare-login.js"></script>');
html=html.replace(startup,'renderMods();renderCrew();updateLive();initCloudflareLogin();');
html=html.replace("setInterval(function(){if(!document.hidden)refreshCrew();},5000);",'');
html=html.replace("window.addEventListener('online',refreshCrew);",'');
html=html.replace("document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshCrew();});",'');
await writeFile('dist-cloudflare/index.html',html);
console.log('Cloudflare assets prepared. Access configuration is required before deployment.');
