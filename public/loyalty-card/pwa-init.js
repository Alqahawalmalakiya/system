// Runs synchronously in <head> so iOS/Android install the CUSTOMER's card.
(function(){
  'use strict';
  const COOKIE='royal-coffee-card-token';
  const TOKEN=/^[a-f0-9]{64}$/;
  function readCookie(){
    const pair=document.cookie.split('; ').find(part=>part.startsWith(COOKIE+'='));
    return pair?pair.slice(COOKIE.length+1):'';
  }
  function manifestPath(token){
    return TOKEN.test(token||'')?'/loyalty-card/install-manifest?card='+token:'/loyalty-card/manifest.webmanifest?v=12';
  }
  const link=document.createElement('link');
  link.rel='manifest';
  link.id='royal-install-manifest';
  document.head.appendChild(link);
  function apply(token){
    // This cookie is a best-effort recovery path for installed browsers which
    // copy first-party cookies at install time; manifest start_url is primary.
    if(TOKEN.test(token||'')){
      document.cookie=COOKIE+'='+token+'; Path=/loyalty-card/; Max-Age=31536000; SameSite=Strict; Secure';
    }
    link.href=manifestPath(token);
  }
  function forget(){
    document.cookie=COOKIE+'=; Path=/loyalty-card/; Max-Age=0; SameSite=Strict; Secure';
    link.href=manifestPath('');
  }
  window.royalCardInstall={apply,forget,manifestPath};
  const fromHash=new URLSearchParams(location.hash.slice(1)).get('card');
  const fromCookie=readCookie();
  // Only the dedicated card page should have a card-specific manifest.
  if(location.pathname.startsWith('/loyalty-card/'))apply(TOKEN.test(fromHash||'')?fromHash:fromCookie);
  else apply('');
})();
