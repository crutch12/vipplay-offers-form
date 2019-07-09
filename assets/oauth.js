(function() {
  function generateProvider({ name, protocol = 'https://', baseDomain, clientId, redirectPath, display, scope, state }) {
    let baseUrl = protocol + baseDomain;
    return {
      name: name,
      popupUrl: generateUrl({ // для открытия попапа
        protocol: protocol,
        baseUrl: baseUrl,
        clientId: clientId,
        redirectPath: redirectPath,
        scope: scope,
        display: display,
        state: state,
      }),
      pageUrl: generateUrl({ // для открытия в новой вкладки
        protocol: protocol,
        baseUrl: baseUrl,
        clientId: clientId,
        redirectPath: redirectPath,
        scope: scope,
  
        display: display,
        state: state + '&newPage=true',
      }),
      redirectUri: protocol + window.location.host + redirectPath,
      popupOptions: { width: 580, height: 400 },
    };
  }

  function generateUrl({ protocol = 'https://', baseUrl, clientId, redirectPath, display, scope, state }) {
    return baseUrl + '?' + Qs.stringify({
      client_id: clientId,
      redirect_uri: protocol + window.location.host + redirectPath, // куда нас вернёт вк после авторизации. важно, что потом нужно бэку отправить точно такой же redirect_uri (!)
      display: display || 'popup',
      scope: scope || 'email',
    });
  }

  const protocol = 'https://';
  var oauthProviders = {
    vk: {
      ...generateProvider({
        name: 'vk',
        protocol: protocol,
        baseDomain: 'oauth.vk.com/authorize',
        clientId: '6778060',
        redirectPath: '/index',
        scope: 'email,offline',
      }),
      popupOptions: { width: 580, height: 400 }, // размеры попапа
    },
    fb: {
      ...generateProvider({
        name: 'fb',
        protocol: protocol,
        baseDomain: 'www.facebook.com/dialog/oauth',
        clientId: '1800751203311629',
        redirectPath: '/index',
        scope: 'public_profile,email',
      }),
      popupOptions: { width: 580, height: 400 },
    },
  }
  
  window.oauth = async function(provider) {
    const providerConfig = oauthProviders[provider];
    const oauthPopup = new OAuthPopup(providerConfig.popupUrl, providerConfig.name, providerConfig.popupOptions);

    return oauthPopup.open(providerConfig.redirectUri)
      .then(response => {
        return {response, providerConfig};
      })
      .catch(err => {
        alert('Не удалось авторизоваться через указанный сервис.');
        return Promise.reject();
      })
  
    // try {
    //   var response = await oauthPopup.open(providerConfig.redirectUri); // { code, state }
    // }
    // catch (err) {
    //   alert('Не удалось авторизоваться через указанный сервис.');
    //   throw err;
    // }
    
    // try {
    //   this.auth(providerConfig.name, response.code, providerConfig.redirectUri);
    // }
    // catch (err) {
    //   alert(err.response.data.message);
    //   throw err;
    // }
  }
  
  
})();

