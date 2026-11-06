/* Display preference only; authentication and database authorization are separate. */
(function(){
  'use strict';
  var key='maida_display_mode_v1',mode='desktop';
  function read(){var value=null;try{value=localStorage.getItem(key);}catch(e){}if(value==='desktop'||value==='iphone')return value;try{return sessionStorage.getItem(key);}catch(e){return null;}}
  var saved=read(),query=new URL(location.href).searchParams.get('view');
  if(saved==='iphone'||saved==='desktop')mode=saved;
  if(query==='iphone'||query==='desktop')mode=query;
  document.documentElement.dataset.displayMode=mode;
  var page=location.pathname.split('/').pop()||'index.html';
  var results=page==='public_results.html',home=page==='index.html';
  function destination(file,value){var target=new URL(file,location.href);target.searchParams.set('view',value);return target.href;}
  if(mode==='iphone'&&!results){location.replace(destination('public_results.html','iphone'));return;}
  function save(value){mode=value;document.documentElement.dataset.displayMode=value;try{localStorage.setItem(key,value);}catch(e){try{sessionStorage.setItem(key,value);}catch(e2){}}}
  function init(){
    if(!home&&!results)return;
    var button=document.createElement('button');button.type='button';button.className='display-settings-button';button.textContent='Tetapan Paparan';button.setAttribute('aria-haspopup','dialog');
    if(home){var header=document.querySelector('.dashboard-header');if(header)header.appendChild(button);}
    else{var bar=document.createElement('div');bar.className='results-display-toolbar';var label=document.createElement('span');label.textContent=mode==='iphone'?'Mod iPhone · Keputusan sahaja':'Paparan Keputusan';bar.append(label,button);document.querySelector('.wrap').prepend(bar);}
    var dialog=document.createElement('dialog');dialog.className='display-settings-dialog';dialog.setAttribute('aria-labelledby','displaySettingsTitle');
    dialog.innerHTML='<form method="dialog"><h2 id="displaySettingsTitle">Tetapan Paparan</h2><p>Pilih ruang kerja untuk peranti ini.</p><fieldset><legend>Mod paparan</legend><label class="display-choice"><input type="radio" name="displayMode" value="desktop"><span><b>Desktop</b><small>Semua modul pengurusan tournament.</small></span></label><label class="display-choice"><input type="radio" name="displayMode" value="iphone"><span><b>iPhone</b><small>Keputusan sahaja. Tiada kawalan tambah, sunting atau padam.</small></span></label></fieldset><p class="display-settings-note">Pilihan disimpan dalam pelayar peranti ini. Data tournament tidak berubah.</p><div class="display-dialog-actions"><button type="button" data-cancel>Batal</button><button type="submit" class="display-apply">Gunakan Paparan</button></div></form>';
    document.body.appendChild(dialog);
    button.onclick=function(){dialog.querySelector('input[value="'+mode+'"]').checked=true;dialog.showModal();};
    dialog.querySelector('[data-cancel]').onclick=function(){dialog.close();button.focus();};
    dialog.addEventListener('close',function(){button.focus();});
    dialog.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var selected=dialog.querySelector('input:checked');if(!selected)return;var value=selected.value;save(value);dialog.close();location.assign(destination(value==='iphone'?'public_results.html':'index.html',value));});
    if(results){var hint=document.createElement('p');hint.className='results-scroll-hint';hint.textContent='Leret jadual ke kiri untuk melihat semua mata.';document.querySelector('.tabs').after(hint);document.querySelectorAll('.card table').forEach(function(table){var scroll=document.createElement('div');scroll.className='results-table-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Jadual keputusan. Skrol mendatar untuk semua lajur.');table.before(scroll);scroll.appendChild(table);});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
