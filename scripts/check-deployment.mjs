import {readFile} from 'node:fs/promises';
export function deploymentProblems(config){
 const issues=[],vars=config.vars||{};
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(vars.ACCESS_TEAM_DOMAIN||''))issues.push('Isi ACCESS_TEAM_DOMAIN daripada Cloudflare Zero Trust.');
 if(!/^[a-f0-9]{64}$/i.test(vars.ACCESS_AUD||''))issues.push('Isi ACCESS_AUD daripada aplikasi Access.');
 if(!String(vars.ADMIN_EMAILS||'').split(',').some(s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())))issues.push('Isi ADMIN_EMAILS yang sah.');
 if(!config.d1_databases?.some(db=>db.binding==='DB'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(db.database_id||'')))issues.push('Cipta D1 dan isi database_id sebenar pada binding DB.');
 if(!config.routes?.some(route=>route.pattern==='pubg.esukan.app'&&route.custom_domain===true))issues.push('Tetapkan custom domain pubg.esukan.app.');
 return issues;
}
if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href){
 const issues=deploymentProblems(JSON.parse(await readFile('wrangler.jsonc','utf8')));
 if(issues.length){console.error('Deployment belum sedia:\n'+issues.map(s=>'• '+s).join('\n'));process.exitCode=1;}
 else console.log('Konfigurasi lengkap. Pastikan DNS aktif, Access melindungi seluruh hostname dan migrations D1 telah dijalankan.');
}
