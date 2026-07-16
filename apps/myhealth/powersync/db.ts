import { PowerSyncDatabase } from "@powersync/web";
import { AppSchema } from "./AppSchema";

export const db = new PowerSyncDatabase({
    schema: AppSchema,
    // WebSQLOpenFactory is default or we can explicitly configure WASM if needed.
    // For now, using default configuration which often uses IndexedDB/WebSQL via a worker.
    database: {
        dbFilename: "myhealth.sqlite",
    },
});
