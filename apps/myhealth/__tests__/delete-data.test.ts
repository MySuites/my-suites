import { DataRepository } from "../providers/DataRepository";
import { getDb } from "../utils/db/database";
import ExerciseDefaultData from "../assets/data/default-exercises";

jest.mock("../utils/db/database", () => ({
    getDb: jest.fn(),
}));

describe("DataRepository.clearAllLocalData", () => {
    it("should delete custom exercises but keep default ones", async () => {
        const mockDb = {
            withTransactionAsync: jest.fn((cb) => cb()),
            runAsync: jest.fn(),
        };
        (getDb as jest.Mock).mockResolvedValue(mockDb);

        await DataRepository.clearAllLocalData();

        // Check if other tables are cleared
        expect(mockDb.runAsync).toHaveBeenCalledWith("DELETE FROM workouts");
        expect(mockDb.runAsync).toHaveBeenCalledWith(
            "DELETE FROM workout_logs",
        );

        // Check for exercise deletion query
        // Expected: DELETE FROM exercises WHERE id NOT IN ('id1', 'id2', ...)
        const calls = mockDb.runAsync.mock.calls;
        const exerciseDeleteCall = calls.find((call) =>
            call[0].includes("DELETE FROM exercises")
        );

        expect(exerciseDeleteCall).toBeDefined();

        const query = exerciseDeleteCall[0];
        const args = exerciseDeleteCall[1];

        expect(query).toContain("DELETE FROM exercises WHERE id NOT IN");

        // Verify args contain the default IDs
        expect(args).toBeDefined();
        // Check first and last ID from default data
        expect(args).toContain(ExerciseDefaultData[0].id);
        expect(args).toContain(
            ExerciseDefaultData[ExerciseDefaultData.length - 1].id,
        );
        // Check argument count matches default data size
        expect(args.length).toBe(ExerciseDefaultData.length);
    });
});
