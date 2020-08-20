import React from 'react';
import './App.css'
import qs from 'qs';
const { createHash } = require("crypto"); //this is a node module not npm


// Helper methods - any of this can be changed to fit the app
const generateRandomString = (length) =>{
  let text = "";
  const whitelist = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  for (var i = 0; i < length; i++) {
      text += whitelist.charAt(Math.floor(Math.random() * whitelist.length));
  }
  return text;
}

const generateChallenge = (code_verifier) => {
  const hash = createHash("sha256")
    .update(code_verifier)
    .digest("base64");
  return base64UrlEncode(hash);
}

const base64UrlEncode = (base64) => {
  return base64
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}


//WARNING: won't work in legacy browsers
const getUrlParam = (param) =>{
  return new URLSearchParams(window.location.search).get(param);
}

const exchangeCode = (code )=>{
  const headers = {
    'Accept' : 'application/json', 
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  const reqBody = {
    grant_type: 'authorization_code',
    client_id,
    redirect_uri,
    code,
    code_verifier
  }

  const requestOptions = {
    method: 'POST',
    headers: {...headers},
    body: qs.stringify(reqBody),
    redirect: 'follow'
  };

  return fetch(`${oktaDomain}/oauth2/default/v1/token`, requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
}


//Okta configuration 
const oktaDomain = 'https://dev-accounts.dfds.com' // your okta issuer, most likely accounts.dfds.com and changed accordingly per environment
const client_id = '0oah1b1mpv3cww8pe0x6' // okta client id
const redirect_uri = 'https://localhost:3000' // whitelisted redirect uri

//pkce code challange - Change this to fit your needs
const code_verifier = localStorage.getItem('codeVerifier') ? localStorage.getItem('codeVerifier') : generateRandomString(43)
const nonce = localStorage.getItem('nonce') ? localStorage.getItem('nonce') : generateRandomString(48)

localStorage.setItem("codeVerifier", code_verifier)
localStorage.setItem("nonce", nonce)

const challange = generateChallenge(code_verifier)
function App() {
  if(getUrlParam('code')){
    exchangeCode(getUrlParam('code'))
      .then( res =>{
        localStorage.removeItem('codeVerifier') // remove code verifier since it's already been used. new one should be created
        localStorage.removeItem('nonce') // remove nonce since it's already been used. new one should be created
        window.history.replaceState(null, null, window.location.pathname); // clean up the url
      })
      .catch( err => {
        console.log(err)
      })
  }
const url = `${oktaDomain}/oauth2/default/v1/authorize?
&response_type=code
&scope=openid
&nonce=${nonce}
&redirect_uri=${redirect_uri}
&state=state-${challange}
&code_challenge_method=S256
&client_id=${client_id}
&code_challenge=${challange}`
  return (
    <div className="App">
      <a className="link" href={url}>go to ad for login</a>
    </div>
  );
}

export default App;
