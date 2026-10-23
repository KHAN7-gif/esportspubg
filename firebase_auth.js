var FIREBASE_AUTH_API_KEY = "";
var FIREBASE_AUTH_EMAIL_DOMAIN = "maidaesports.com";

(function(global){
  'use strict';
  var idToken = null;

  function authError(code){
    var messages={
      'EMAIL_NOT_FOUND':'Username atau kata laluan tidak betul.',
      'INVALID_PASSWORD':'Username atau kata laluan tidak betul.',
      'INVALID_LOGIN_CREDENTIALS':'Username atau kata laluan tidak betul.',
      'INVALID_EMAIL':'Format username tidak sah.',
      'USER_DISABLED':'Akaun ini telah dinyahaktifkan.',
      'OPERATION_NOT_ALLOWED':'Log masuk e-mel/kata laluan belum diaktifkan dalam Firebase.',
      'TOO_MANY_ATTEMPTS_TRY_LATER':'Terlalu banyak cubaan. Sila cuba lagi kemudian.'
    };
    return messages[code]||'Log masuk gagal. Semak akaun Firebase dan cuba lagi.';
  }

  async function signIn(username,password){
    var user=String(username||'').trim();
    if(!FIREBASE_AUTH_API_KEY)throw Error('Firebase Authentication belum dikonfigurasi: isi FIREBASE_AUTH_API_KEY dalam firebase_auth.js.');
    if(!/^[a-zA-Z0-9._-]{1,48}$/.test(user))throw Error('Username hanya boleh mengandungi huruf, nombor, titik, sempang atau garis bawah.');
    if(!password)throw Error('Sila masukkan kata laluan.');
    var response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(FIREBASE_AUTH_API_KEY),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:user.toLowerCase()+'@'+FIREBASE_AUTH_EMAIL_DOMAIN,password:password,returnSecureToken:true})
    });
    var result=await response.json();
    if(!response.ok)throw Error(authError(result&&result.error&&result.error.message));
    if(!result||typeof result.idToken!=='string')throw Error('Firebase tidak memulangkan token pengesahan yang sah.');
    idToken=result.idToken;
    return {username:user,idToken:idToken};
  }

  global.CrewAuth={
    signIn:signIn,
    signOut:function(){idToken=null;},
    authorizationHeaders:function(){return idToken?{Authorization:'Bearer '+idToken}:{};}
  };
})(globalThis);
