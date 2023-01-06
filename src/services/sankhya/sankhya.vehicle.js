import { apiMge, apiProd } from "./api.js";
import { SankhyaServiceAuthenticate } from "./sankhya.authenticate.js";

export async function SankhyaServiceConfirmationNote() {
  const sankhya = new SankhyaServiceAuthenticate()
  const { jessionid } = await sankhya.authUserSankhya(process.env.USER, process.env.PASSWORD);

  let config = {
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      // AppKey: 'b4f1d94f-33f4-4f04-afdd-61442eaebd74',
      "Cookie": `JSESSIONID=${jessionid['$']}`,
    },
  };

  console.log(jessionid['$'], "jsession")

  const requestBody = {
    serviceName: "OperacaoProducaoSP.confirmarApontamento",
    requestBody: {
      "dataSet": {
        "rootEntity": "Veiculo",
        "includePresentationFields": "S",
        "offsetPage": "5225",
        "offset": "50",

        "entity": {
          "fieldset": {
            "list": "CODMARCAMOD"
          }
        }
      }
    },
  };
  return await apiMge
    .get(
      `service.sbr?serviceName=CRUDServiceProvider.loadRecords&outputType=json`,
      requestBody,
      config,
    )
    .then((response) => {
      console.log(response)
      const data = response?.data || "";
      return data;
    })
    .catch((error) => console.log("error sankya apontamento", error));
};

