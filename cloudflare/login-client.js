/* Loaded only in the Cloudflare build; identity comes from the verified Worker. */
async function initCloudflareLogin(){
  document.getElementById('homeApp').inert=true;
  document.body.classList.add('locked');
  document.getElementById('profileTitle').textContent='Log Masuk Cloudflare';
  document.querySelector('.lg-card .cs').textContent='Mengesahkan sesi anda…';
  document.querySelector('.lg-card').onsubmit=function(e){e.preventDefault();location.reload();};
  document.querySelector('.lg-inp').style.display='none';
  document.querySelector('.lg-lbl').hidden=true;
  document.querySelector('.lg-card .crew-status').textContent='Akses menggunakan e-mel yang diluluskan oleh pentadbir.';
  document.querySelector('.lg-hint').textContent='Dilindungi Cloudflare Access';
  document.querySelector('.lg-btn').textContent='Cuba Semula';
  try{
    const response=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store',redirect:'error'});
    if(!response.ok)throw Error('Sesi tamat atau akses belum diluluskan. Buka semula alamat aplikasi untuk log masuk.');
    const session=await response.json();
    if(session.provider!=='cloudflare'||!session.user||!session.user.email)throw Error('Respons sesi tidak sah.');
    updateProfile=function(){
      document.getElementById('profileName').textContent=session.user.email;
      document.getElementById('profileRole').textContent='Cloudflare Access';
    };
    updateProfile();
    document.querySelector('.profile-switch').hidden=true;
    document.querySelector('.crew-panel').hidden=true;
    logout=function(){location.assign('/cdn-cgi/access/logout');};
    document.getElementById('homeApp').inert=false;
    document.body.classList.remove('locked');
    // Recheck before expiry instead of leaving a stale identity on screen.
    const remaining=session.user.expiresAt*1000-Date.now();
    setTimeout(function(){location.reload();},Math.max(1000,Math.min(remaining,2147483647)));
  }catch(e){
    document.querySelector('.lg-card .cs').textContent='Log masuk diperlukan';
    document.getElementById('lgErr').textContent=e.message;
  }
}
