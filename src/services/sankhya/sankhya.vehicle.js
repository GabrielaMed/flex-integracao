import { apiMge } from "./api.js";
import { SankhyaServiceAuthenticate } from "./sankhya.authenticate.js";
import "dotenv/config";
import { syncTypes } from "../../shared/syncTypes.js";
import { LogsIntegration } from "../../modules/logs_integration.js";

export async function SankhyaServiceVehicle(syncType) {

  const sankhyaService = await SankhyaServiceAuthenticate.getInstance();
  const token = await sankhyaService.authUserSankhya(
    process.env.SANKHYA_USER,
    process.env.SANKHYA_PASSWORD
  );
  const logsIntegration = new LogsIntegration();

  // const lastSync = undefined;
  const lastSync = await logsIntegration.findLastSync(); // pegar a data e hora da ultima sincronização do banco de dados

  const logId = await logsIntegration.createSync('veiculos', syncType)

  const requestBody = (page) => {
    const criteria = lastSync
      ? {
        expression: {
          $:
            syncType == syncTypes.created
              ? `this.AD_DHINC > ${lastSync}`
              : `this.AD_DHALT > ${lastSync}`,
        },
      }
      : {};

    return {
      requestBody: {
        dataSet: {
          rootEntity: "Veiculo",
          includePresentationFields: "S",
          offsetPage: page,
          criteria,
          entity: {
            fieldset: {
              list: "PLACA,RENAVAM,ATIVO,AD_DHALT,AD_DHINC,CODVEICULO",
            },
          },
        },
      },
    };
  };

  apiMge.defaults.headers.Cookie = `JSESSIONID=${token}`;

  const getData = async (page) => {
    // console.log("requestBody", requestBody(page));

    const response = await apiMge.get(
      `service.sbr?serviceName=CRUDServiceProvider.loadRecords&outputType=json`,
      { data: { ...requestBody(page) } }
    );

    console.log(response.data)
    const totalRecords = response.data.responseBody.entities.total;
    const data = response.data.responseBody.entities.entity;

    const dataParsed = data.map((item) => ({
      placa: item.f0.$,
      renavam: item.f1.$,
      ativo: item.f2.$,
      dt_criacao: item.f4.$,
      dt_atualizacao: item.f3.$,
      id_vehicle_customer: item.f5.$, // criar o campo id_vehicle_customer na tabela veiculos
    }));

    // gravar dados de sincronizacao no banco de dados (data e hora e tipo, se foi created ou updated), pagina, nome do sincronismo

    await logsIntegration.updateSync(logId, page)
    console.log(dataParsed); // fazer rotina para incluir/alterar esses dados no postgres

    if (process.env.SANKHYA_PAGINATION == totalRecords) {
      await getData(page + 1);
    }
  };

  await getData(0);
}
