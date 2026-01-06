import { DataRepository } from '../providers/DataRepository';
import { openDatabaseAsync } from 'expo-sqlite';
import * as uuid from 'react-native-uuid';
import { useSyncService } from '../hooks/useSyncService';

// Mock dependencies
jest.mock('expo-sqlite');
jest.mock('react-native-uuid');

// Mock specific database behavior for this test
const mockDb = {
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    withTransactionAsync: jest.fn(cb => cb()),
};
(openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);

describe('Local-First Architecture Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mocks
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
        mockDb.getAllAsync.mockResolvedValue([]);
        mockDb.getFirstAsync.mockResolvedValue(null);
    });

    describe('Scenario A: Database Initialization', () => {
        it('should initialize schema and run migrations', async () => {
            const { initDatabase } = require('../utils/db/database');
            await initDatabase();
            
            // Should create tables
            expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS workout_logs'));
            // Should run migration for deleted_at
            expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE workout_logs ADD COLUMN deleted_at INTEGER'));
        });
    });

    describe('Scenario B: Offline Writes (DataRepository)', () => {
        it('saveWorkout should insert active records', async () => {
            const workout = { id: 'new-id', name: 'Leg Day', exercises: [], createdAt: '2025-01-01', userId: 'user-1' };
             // Use string replacement for UUID since mocking the property is tricky if lib export differs
             // Or just ignore the ID generation for this test if saveWorkout handles it
             // Let's assume repo uses uuid.v4()
            
            await DataRepository.saveWorkout(workout);

            expect(mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT OR REPLACE INTO workouts'), // Insert command
                [
                    expect.anything(), // id
                    expect.anything(), // userId
                    expect.stringContaining('Leg Day'), // Name
                    expect.anything(), // Exercises JSON
                    expect.anything(), // Created At
                    expect.anything(), // Updated At
                    null, // deleted_at
                    'pending', // Sync Status
                ]
            );
        });

        it('deleteWorkout should perform soft delete', async () => {
            await DataRepository.deleteWorkout('123');

            // Matches actual implementation: "sync_status = 'pending'" hardcoded in query
            expect(mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE workouts"),
                [
                  expect.any(Number), // deleted_at param 1
                  expect.any(Number), // updated_at param 2
                  '123'               // id param 3
                ]
            );
        });

        it('getHistory should filter out soft-deleted items', async () => {
            await DataRepository.getHistory();
            expect(mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('deleted_at IS NULL')
            );
        });
        
        it('deleteHistory should perform soft delete on workout_logs', async () => {
            await DataRepository.deleteHistory('log-123');
             expect(mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE workout_logs"),
                [
                    expect.any(Number), // deleted_at
                    expect.any(Number), // updated_at
                    'log-123'
                ]
            );
        });
    });

    describe('Scenario C: Sync Service Deletions', () => {
        it('should query for pending deleted items', async () => {
            await DataRepository.getPendingHistoryLogs();
            // Should NOT filter deleted_at IS NULL, should look for sync_status = pending
            expect(mockDb.getAllAsync).toHaveBeenCalledWith(
                 expect.stringContaining('WHERE sync_status = "pending"')
            );
        });
    });
});
