import { apiMge } from "./api.js";
import { SankhyaServiceAuthenticate } from "./sankhya.authenticate.js";
import "dotenv/config";
import { syncTypes } from "../../shared/syncTypes.js";
import { LogsIntegration } from "../../modules/logs_integration.js";
import { prisma } from "../../database/prismaClient.js";

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
      ativo: item.f2.$ == 'S',
      dt_criacao: item.f4.$ ? new Date(item.f4.$) : new Date(),
      dt_atualizacao: item.f3.$ ? new Date(item.f3.$) : new Date(),
      id_vehicle_customer: Number(item.f5.$), // criar o campo id_vehicle_customer na tabela veiculos - criado
    }));

    // fazer rotina para incluir/alterar esses dados no postgres
    if (syncType == "created") {
      await prisma.veiculo.createMany({
        data: dataParsed,
        skipDuplicates: true
      })

    }
    else {
      dataParsed.forEach(async (vehicle) => {
        const vehicleToUpdate = await prisma.veiculo.findUnique({
          where: {
            id_vehicle_customer: vehicle.id_vehicle_customer
          },
        })
        if (vehicleToUpdate) {
          await prisma.veiculo.update({
            where: {
              id_vehicle_customer: vehicle.id_vehicle_customer
            },
            update: vehicle,
            create: vehicle
          })
        }

      });
    }

    await logsIntegration.updateSync(logId, page)// gravar dados de sincronizacao no banco de dados (data e hora e tipo, se foi created ou updated), pagina, nome do sincronismo
    console.log(dataParsed);

    if (process.env.SANKHYA_PAGINATION == totalRecords) {
      await getData(page + 1);
    }
  };

  await getData(0);
}
