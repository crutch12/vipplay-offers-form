const url = 'https://bo-staging.viasat.su/api';

const $vue = new Vue({
  el: "#app",
  data: {
    isSubmitPhone: false,
    code: null,
    phone: null,
    authData: null,
    disabled: false,
    agree: false,

    messageError: null,

    session: null,

    replyTime: 30,
  },

  computed: {
    isDisabledPhone() {
      return !this.phone || this.convertPhone().length < 11 || !this.agree || this.disabled;
    },
    isDisabledCode() {
      return !this.code || this.disabled;
    },

    $oauthProviders() {
      const protocol = 'http://';
      return {
        vk: {
          ...this.generateProvider.call(this, {
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
          ...this.generateProvider.call(this, {
            name: 'fb',
            protocol: protocol,
            baseDomain: 'www.facebook.com/dialog/oauth',
            clientId: '1800751203311629',
            redirectPath: '/index',
            scope: 'public_profile,email',
          }),
          popupOptions: { width: 580, height: 400 },
        },
      };
    },
    
  },
  
  methods: {
    async getCode(reply) {
      let vm = this;
      if (!this.phone) return;

      try {
        this.disabled = true;
        await axios.post(`${url}/v1/auth_codes`, {
          msisdn: this.convertPhone(),
        });
        this.isSubmitPhone = true;
      }
      catch(err) {
        console.error(err);
        this.messageError = _.get(err, 'response.data.message') || 'Неизвестная ошибка';
        if (!reply) {
          this.isSubmitPhone = false;
        }
      }
      var timer = setInterval(function() {
        if (vm.replyTime <= 0) {
          clearInterval(timer);
          vm.replyTime = 30;
        }
        else {
          vm.replyTime--;
        }
      }, 1000);
      this.disabled = false;
    },
    
    async auth(provider, popupCode, redirectUri) {
      var auth = {};
      if (popupCode) {
        auth = {
          provider: provider,
          code: popupCode,
          redirect_uri: redirectUri,
        }
      }
      else {
        auth =  {
          msisdn: this.convertPhone(),
          auth_code: this.code,
        }
      }

      try {
        this.disabled = true;
        let response = await axios.post(`${url}/v1/sessions`, {
          ...auth
        });
        this.authData = response.data;
        let auth_token = _.get(this.authData, 'auth.token');
        Cookies.set('auth_token', auth_token);
        this.session = jwt_decode(auth_token);
        axios.defaults.headers.common['Authorization'] = auth_token;
      }
      catch(err) {
        console.error(err);
      }
      this.disabled = false;
    },

    async logout() {
      try {
        await axios.delete(`${url}/v1/sessions/${this.session.session_id}`);
        this.authData = null;
        Cookies.remove('auth_token');
      }
      catch(err) {
        console.error(err);
      }
    },

    convertPhone() {
      if (!this.phone) return;
      return this.phone.match(/\d/g).join('');
    },

    async $oauth(provider) {
      const providerConfig = this.$oauthProviders[provider];
      const oauthPopup = new OAuthPopup(providerConfig.popupUrl, providerConfig.name, providerConfig.popupOptions);

      try {
        var response = await oauthPopup.open(providerConfig.redirectUri); // { code, state }
      }
      catch (err) {
        alert('Не удалось авторизоваться через указанный сервис.');
        throw err;
      }
      
      try {
        this.auth(providerConfig.name, response.code, providerConfig.redirectUri);
      }
      catch (err) {
        alert(err.response.data.message);
        throw err;
      }
    },

    generateUrl({ protocol = 'https://', baseUrl, clientId, redirectPath, display, scope, state }) {
      return baseUrl + '?' + Qs.stringify({
        client_id: clientId,
        redirect_uri: protocol + window.location.host + redirectPath, // куда нас вернёт вк после авторизации. важно, что потом нужно бэку отправить точно такой же redirect_uri (!)
        display: display || 'popup',
        scope: scope || 'email',
      });
    },

    generateProvider({ name, protocol = 'https://', baseDomain, clientId, redirectPath, display, scope, state }) {
      let baseUrl = protocol + baseDomain;
      return {
        name: name,
        popupUrl: this.generateUrl.call(this, { // для открытия попапа
          protocol: protocol,
          baseUrl: baseUrl,
          clientId: clientId,
          redirectPath: redirectPath,
          scope: scope,
          display: display,
          state: state,
        }),
        pageUrl: this.generateUrl.call(this, { // для открытия в новой вкладки
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
  },

  async mounted() {
    let auth_token = Cookies.get('auth_token');
    if (!auth_token) return;

    this.session = jwt_decode(auth_token);
    axios.defaults.headers.common['Authorization'] = auth_token;

    try {
      let response = await axios.get(`${url}/v1/sessions`);
      this.authData = _.find(response.data, { id: this.session.session_id});
    }
    catch(err) {
      console.error(err);
    }
  }
});