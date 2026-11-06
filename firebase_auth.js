/* Firebase Web API key is public app configuration, never a service-account key. */
var FIREBASE_AUTH_API_KEY = "AIzaSyArk5Wg6tnPiSDhPWu5dg2S9E_IlNiBqWA";
var FIREBASE_AUTH_EMAIL_DOMAIN = "maidaesports.com";

(function(global){
  'use strict';
  var session=null,storageKey='maida_firebase_session_v1';
  function storage(){try{return global.sessionStorage;}catch(e){return null;}}
  function forget(){session=null;try{var s=storage();if(s){s.removeItem(storageKey);s.removeItem('maida_login_user');}}catch(e){}}
  function save(value){session=value;try{var s=storage();if(s)s.setItem(storageKey,JSON.stringify(value));}catch(e){/* In-memory login still works when storage is blocked. */}}
  function configured(){if(!FIREBASE_AUTH_API_KEY)throw Error('Login belum diaktifkan. Pentadbir perlu melengkapkan Firebase Web API Key dalam firebase_auth.js.');}
  function authError(code){
    var messages={
      EMAIL_NOT_FOUND:'Username atau kata laluan tidak betul.',
      INVALID_PASSWORD:'Username atau kata laluan tidak betul.',
      INVALID_LOGIN_CREDENTIALS:'Username atau kata laluan tidak betul.',
      INVALID_EMAIL:'Format e-mel tidak sah.',
      USER_DISABLED:'Akaun ini telah dinyahaktifkan.',
      USER_NOT_FOUND:'Akaun tidak ditemui. Sila log masuk semula.',
      OPERATION_NOT_ALLOWED:'Login Email/Password belum diaktifkan dalam Firebase Authentication.',
      TOO_MANY_ATTEMPTS_TRY_LATER:'Terlalu banyak cubaan. Sila cuba lagi kemudian.',
      API_KEY_INVALID:'Firebase Web API Key tidak sah. Hubungi pentadbir.',
      INVALID_ID_TOKEN:'Sesi tidak sah. Sila log masuk semula.',
      TOKEN_EXPIRED:'Sesi tamat. Sila log masuk semula.'
    };
    return messages[code]||'Log masuk gagal. Semak konfigurasi Firebase atau hubungi pentadbir.';
  }
  async function api(action,body){
    configured();
    var response;
    try{response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+action+'?key='+encodeURIComponent(FIREBASE_AUTH_API_KEY),{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
    });}catch(e){throw Error('Tidak dapat menghubungi Firebase. Semak sambungan internet dan cuba semula.');}
    var result;try{result=await response.json();}catch(e){throw Error('Respons Firebase tidak sah. Sila cuba semula.');}
    if(!response.ok)throw Error(authError(result&&result.error&&result.error.message));
    return result;
  }
  function emailFor(value){
    var user=String(value||'').trim();
    if(user.includes('@')){
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user))throw Error('Masukkan alamat e-mel yang sah.');
      return user.toLowerCase();
    }
    if(!/^[a-zA-Z0-9._-]{1,48}$/.test(user))throw Error('Username hanya boleh mengandungi huruf, nombor, titik, sempang atau garis bawah.');
    return user.toLowerCase()+'@'+FIREBASE_AUTH_EMAIL_DOMAIN;
  }
  async function signIn(username,password){
    forget();configured();
    var email=emailFor(username);
    if(!password)throw Error('Sila masukkan kata laluan.');
    var result=await api('signInWithPassword',{email:email,password:password,returnSecureToken:true});
    if(!result||typeof result.idToken!=='string'||!result.idToken)throw Error('Firebase tidak memulangkan token pengesahan yang sah.');
    var seconds=Number(result.expiresIn||3600);
    if(!Number.isFinite(seconds)||seconds<=0)throw Error('Tempoh sesi Firebase tidak sah.');
    var user={username:String(username).trim(),email:result.email||email,idToken:result.idToken,expiresAt:Date.now()+seconds*1000};
    save(user);return user;
  }
  async function restoreSession(){
    var saved=session;
    if(!saved){try{var s=storage();saved=s&&JSON.parse(s.getItem(storageKey)||'null');}catch(e){forget();return null;}}
    if(!saved||typeof saved.idToken!=='string'||!saved.idToken||!Number.isFinite(saved.expiresAt)||saved.expiresAt<=Date.now()){forget();return null;}
    try{
      var result=await api('lookup',{idToken:saved.idToken});
      var user=result&&result.users&&result.users[0];
      if(!user||!user.email||user.disabled)throw Error('Sesi tidak sah. Sila log masuk semula.');
      saved.email=user.email;saved.username=user.email;save(saved);return saved;
    }catch(e){forget();throw e;}
  }
  function currentUser(){
    if(!session)return null;
    if(session.expiresAt<=Date.now()){forget();return null;}
    return {username:session.username,email:session.email,expiresAt:session.expiresAt};
  }
  global.CrewAuth={signIn:signIn,restoreSession:restoreSession,currentUser:currentUser,signOut:forget,
    authorizationHeaders:function(){return currentUser()?{Authorization:'Bearer '+session.idToken}:{};}};
})(globalThis);
