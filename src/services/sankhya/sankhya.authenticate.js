import { apiMge } from "./api.js";
import AxiosRequestConfig from 'axios'

var token;
var idUsuario;
var logged = false;

export class SankhyaServiceAuthenticate {
  static instance;
  user = "";
  password = "";


  constructor() {
    this.token = "";
    this.idUsuario = "";
  }

  authUserSankhya = async (user, password) => {
    if (user && password) {
      this.user = user;
      this.password = password;
    } else {
      this.logged = true;
    }

    let config = {
      headers: {
        // AppKey: 'b4f1d94f-33f4-4f04-afdd-61442eaebd74',
        "Content-Type": "application/json;charset=UTF-8",
        // "Cookie": ""
        // Connection: 'keep-alive',
      },
    };
    if (this.token !== "") {
      config = {
        ...config,
        headers: { ...config.headers, Cookie: `JSESSIONID=${this.token}` },
      };
    }

    const requestBody = {
      serviceName: "MobileLoginSP.Login",
      requestBody: {
        NOMUSU: {
          $: this.user.toUpperCase(),
        },
        INTERNO: {
          $: this.password,
        },
        KEEPCONNECTED: {
          $: "S",
        },
      },
    };

    return await apiMge
      .post(
        `service.sbr?serviceName=MobileLoginSP.login&outputType=json`,
        requestBody,
        config
      )
      .then((response) => {
        console.log(this.user, this.password, response.data);
        const message = response?.data?.statusMessage || "";
        const result = {
          jessionid: response.data.responseBody?.jsessionid
        };
        return result;
      });
  };
}
