import { OPSqliteOpenFactory } from "@powersync/op-sqlite";
import { PowerSyncDatabase } from "@powersync/react-native";
import { AppSchema } from "./AppSchema";

export const db = new PowerSyncDatabase({
    schema: AppSchema,
    database: new OPSqliteOpenFactory({
        dbFilename: "myhealth.sqlite",
    }),
});
