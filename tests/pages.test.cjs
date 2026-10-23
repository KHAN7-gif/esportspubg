const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
test('all inline scripts parse',()=>{
  for(const file of fs.readdirSync('.').filter(x=>x.endsWith('.html'))){
    for(const m of fs.readFileSync(file,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
      if(!/\bsrc=/.test(m[1]))new vm.Script(m[2],{filename:file});
    }
  }
});
test('dashboard uses master map schema, locked scores, tiebreaks and zero alive',()=>{
  const html=fs.readFileSync('HOME_DASHBOARD.html','utf8');
  assert.match(html,/const DATA_KEY\s*= SP_KEY/);
  const fn=html.slice(html.indexOf('function updateQuickStats(){'),html.indexOf('/* ── CREW STATUS'));
  const elements={};const data={title:'Test',teams:[{name:'A'},{name:'B'}],maps:{
    one:{locked:true,order:['B','A'],kill:{B:0,A:4}},
    draft:{locked:false,order:['A','B'],kill:{A:99}}},
    _liveMatch:{teams:[{alive:[0,0,0,0]},{alive:[0,0,0,0]}]}};
  const ctx=vm.createContext({DATA_KEY:'hswp_2026_pro',config:{title:''},
    localStorage:{getItem:()=>JSON.stringify(data)},
    document:{getElementById(id){return elements[id]??={style:{}};}}});
  vm.runInContext(fn+';updateQuickStats();',ctx);
  assert.equal(elements.qsTeams.textContent,2);
  assert.equal(elements.qsMaps.textContent,'1/2');
  assert.equal(elements.qsKills.textContent,4);
  assert.equal(elements.qsLeader.textContent,'B');
  assert.equal(elements.qsAlive.textContent,0);
  assert.equal(elements.sbData.textContent,'SYNCED ✓');
});
test('public results escape names and logo attributes',()=>{
  const html=fs.readFileSync('public_results.html','utf8');
  const fn=html.slice(html.indexOf('function resultEsc('),html.indexOf('/* ═══ RENDER OVERALL'));
  const ctx=vm.createContext({});vm.runInContext(fn,ctx);
  const output=ctx.teamLogoHtml({logo:'x" onerror="alert(1)',name:'<'});
  assert.ok(!output.includes('src="x" onerror='));
  assert.match(output,/&quot;/);
  assert.equal(ctx.resultEsc('<img>'), '&lt;img&gt;');
});
