import { DataRepository } from "../providers/DataRepository";
import { getDb } from "../utils/db/database";

jest.mock("../utils/db/database", () => ({
    getDb: jest.fn(),
}));

describe("DataRepository", () => {
    describe("getHistory", () => {
        it("should populate exercise properties", async () => {
            const mockDb = {
                getAllAsync: jest.fn(),
            };
            (getDb as jest.Mock).mockResolvedValue(mockDb);

            // Mock DB returns
            mockDb.getAllAsync
                .mockResolvedValueOnce([ // workout_logs
                    {
                        id: "log1",
                        workout_date: "2023-01-01",
                        workout_name: "Test Workout",
                        exercises: "[]",
                    },
                ])
                .mockResolvedValueOnce([ // set_logs
                    {
                        id: "set1",
                        workout_log_id: "log1",
                        exercise_id: "ex1",
                        exercise_name: "Pushup",
                        reps: 10,
                    },
                ])
                .mockResolvedValueOnce([ // exercises
                    { id: "ex1", name: "Pushup", properties: "Reps,Bodyweight" },
                ]);

            const history = await DataRepository.getHistory();

            expect(history).toHaveLength(1);
            expect(history[0].exercises).toHaveLength(1);
            expect(history[0].exercises[0].properties).toEqual([
                "Reps",
                "Bodyweight",
            ]);
        });

        it("should trim whitespace from properties", async () => {
            const mockDb = {
                getAllAsync: jest.fn(),
            };
            (getDb as jest.Mock).mockResolvedValue(mockDb);

            // Mock DB returns
            mockDb.getAllAsync
                .mockResolvedValueOnce([ // workout_logs
                    {
                        id: "log1",
                        workout_date: "2023-01-01",
                        workout_name: "Test Workout",
                        exercises: "[]",
                    },
                ])
                .mockResolvedValueOnce([ // set_logs
                    {
                        id: "set1",
                        workout_log_id: "log1",
                        exercise_id: "ex1",
                        exercise_name: "Pushup",
                        reps: 10,
                    },
                ])
                // Test Case: "Weighted, Reps" (with space)
                .mockResolvedValueOnce([ // exercises
                    { id: "ex1", name: "Leg Press", properties: "Weighted, Reps" },
                ]);

            const history = await DataRepository.getHistory();

            expect(history).toHaveLength(1);
            expect(history[0].exercises).toHaveLength(1);
            expect(history[0].exercises[0].properties).toEqual([
                "Weighted",
                "Reps",
            ]);
        });

        it("should map equipment and attachment from set_logs, exercises, or inference", async () => {
            const mockDb = {
                getAllAsync: jest.fn(),
            };
            (getDb as jest.Mock).mockResolvedValue(mockDb);

            // Mock DB returns
            mockDb.getAllAsync
                .mockResolvedValueOnce([ // workout_logs
                    {
                        id: "log1",
                        workout_date: "2023-01-01",
                        workout_name: "Test Workout",
                        exercises: "[]",
                    },
                ])
                .mockResolvedValueOnce([ // set_logs
                    {
                        id: "set1",
                        workout_log_id: "log1",
                        exercise_id: "ex1",
                        exercise_name: "Bench Press",
                        reps: 10,
                        equipment: "barbell",
                        attachment: "None",
                    },
                    {
                        id: "set2",
                        workout_log_id: "log1",
                        exercise_id: "ex2",
                        exercise_name: "Cable Row",
                        reps: 10,
                        // no equipment/attachment (legacy log)
                    },
                    {
                        id: "set3",
                        workout_log_id: "log1",
                        exercise_id: "ex3",
                        exercise_name: "Dumbbell Curl",
                        reps: 10,
                        // no equipment/attachment, and exercise not in DB (falls back to inference)
                    }
                ])
                .mockResolvedValueOnce([ // exercises
                    { id: "ex1", name: "Bench Press", properties: "Reps" },
                    { id: "ex2", name: "Cable Row", properties: "Reps", equipment: "cable", attachment: "V-Bar" },
                ]);

            const history = await DataRepository.getHistory();

            expect(history).toHaveLength(1);
            const exercises = history[0].exercises;
            expect(exercises).toHaveLength(3);

            // ex1: uses custom equipment and attachment from set_logs
            const ex1 = exercises.find(e => e.id === "ex1")!;
            expect(ex1.equipment).toBe("barbell");
            expect(ex1.attachment).toBe("None");

            // ex2: falls back to exercise meta from exercises table
            const ex2 = exercises.find(e => e.id === "ex2")!;
            expect(ex2.equipment).toBe("cable");
            expect(ex2.attachment).toBe("V-Bar");

            // ex3: falls back to name-based inference (Dumbbell Curl name -> dumbbell equipment, empty attachment)
            const ex3 = exercises.find(e => e.id === "ex3")!;
            expect(ex3.equipment).toBe("dumbbell");
            expect(ex3.attachment).toBe("");
        });
    });

    describe("saveHistory", () => {
        it("should save exercises with their specific equipment and attachment", async () => {
            const mockDb = {
                runAsync: jest.fn(),
                withTransactionAsync: jest.fn((cb) => cb()),
            };
            (getDb as jest.Mock).mockResolvedValue(mockDb);

            const logs = [
                {
                    id: "log1",
                    userId: "user1",
                    date: "2023-01-01",
                    name: "Test Workout",
                    exercises: [
                        {
                            id: "ex1",
                            name: "Bench Press",
                            equipment: "barbell",
                            attachment: "None",
                            logs: [
                                {
                                    id: "set1",
                                    weight: 100,
                                    reps: 5,
                                },
                            ],
                        },
                    ],
                },
            ];

            await DataRepository.saveHistory(logs as any);

            expect(mockDb.withTransactionAsync).toHaveBeenCalled();
            // The first insert is workout_logs, the second is set_logs
            expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
            
            // Check workout_logs insert arguments
            expect(mockDb.runAsync.mock.calls[0][0]).toContain("INSERT OR REPLACE INTO workout_logs");
            
            // Check set_logs insert arguments
            const setLogsCall = mockDb.runAsync.mock.calls[1];
            expect(setLogsCall[0]).toContain("INSERT OR REPLACE INTO set_logs");
            expect(setLogsCall[0]).toContain("equipment, attachment");
            
            const params = setLogsCall[1];
            expect(params[12]).toBe("barbell");
            expect(params[13]).toBe("None");
        });
    });

    describe("saveLog", () => {
        it("should save log with customized equipment and attachment", async () => {
            const mockDb = {
                runAsync: jest.fn(),
                withTransactionAsync: jest.fn((cb) => cb()),
            };
            (getDb as jest.Mock).mockResolvedValue(mockDb);

            const log = {
                userId: "user1",
                date: "2023-01-01",
                name: "Test Workout",
                exercises: [
                    {
                        id: "ex1",
                        name: "Dumbbell Press",
                        equipment: "dumbbell",
                        attachment: "None",
                        logs: [
                            {
                                id: "set1",
                                weight: 50,
                                reps: 10,
                            },
                        ],
                    },
                ],
            };

            await DataRepository.saveLog(log as any);

            expect(mockDb.withTransactionAsync).toHaveBeenCalled();
            expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
            
            // Check set_logs insert arguments for equipment and attachment
            const setLogsCall = mockDb.runAsync.mock.calls[1];
            expect(setLogsCall[0]).toContain("INSERT INTO set_logs");
            expect(setLogsCall[0]).toContain("equipment, attachment");
            
            const params = setLogsCall[1];
            expect(params[12]).toBe("dumbbell");
            expect(params[13]).toBe("None");
        });
    });
});
