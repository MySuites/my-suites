import { DataRepository } from "../providers/DataRepository";
import { getDb } from "../utils/db/database";

jest.mock("../utils/db/database", () => ({
    getDb: jest.fn(),
}));

describe("DataRepository.getHistory", () => {
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
});
