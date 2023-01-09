import { prisma } from '../database/prismaClient.js'
import { getDateTimeNow } from "../services/utils/dateTime.js";

export class LogsIntegration {
    async findLastSync(syncType) {
        const lastSync = await prisma.integracaoSankhya.findMany({
            where: {
                type_sync: syncType
            },
            orderBy: {
                last_sync: "desc"
            },
            take: 1
        });

        return lastSync[0].last_sync.toLocaleDateString();
    }

    async createSync(tableName, syncType) {
        const newSync = await prisma.integracaoSankhya.create({
            data: {
                last_sync: getDateTimeNow(),
                type_sync: syncType,
                page: 0,
                table_name: tableName,
            }
        })

        return newSync.id;
    }

    async updateSync(id, page) {
        const updateSync = await prisma.integracaoSankhya.update({
            where: {
                id
            },
            data: {
                last_sync: getDateTimeNow(),
                page
            }
        })

        console.log("update")
        return updateSync;
    }
}