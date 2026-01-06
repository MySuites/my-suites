// Basic in-memory SQLite mock
const mockTx = {
    executeSql: jest.fn((sql, args, success, error) => {
        if (success) {
            success(mockTx, {
                rows: { _array: [], length: 0, item: (i: number) => null },
            });
        }
    }),
};

const mockDb = {
    transaction: jest.fn((cb) => cb(mockTx)),
    execAsync: jest.fn(async () => {}),
    runAsync: jest.fn(async (sql, ...args) => ({
        changes: 1,
        lastInsertRowId: 1,
    })),
    getAllAsync: jest.fn(async (sql, ...args) => []),
    getFirstAsync: jest.fn(async (sql, ...args) => null),
    prepareAsync: jest.fn(async () => ({
        executeAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
        finalizeAsync: jest.fn(async () => {}),
    })),
    withTransactionAsync: jest.fn(async (cb) => cb()),
};

export const openDatabaseAsync = jest.fn(async () => mockDb);
// Mock default export if needed
export default {
    openDatabaseAsync,
};
