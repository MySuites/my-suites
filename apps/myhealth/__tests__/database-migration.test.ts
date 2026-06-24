import { openDatabaseAsync } from "expo-sqlite";
import { initDatabase } from "../utils/db/database";

jest.mock("expo-sqlite");

const mockDb = {
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    withTransactionAsync: jest.fn(cb => cb()),
};
(openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);

describe("Database Consolidation Migration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
        mockDb.getAllAsync.mockResolvedValue([]);
        mockDb.getFirstAsync.mockResolvedValue(null);
    });

    it("should execute updates on set_logs and exercises, and update workouts JSON templates", async () => {
        // Pass a dummy db name to satisfy TS signature of openDatabaseAsync
        await openDatabaseAsync("test.db");

        // Setup custom mock implementations on the existing mockDb instance
        (mockDb.getAllAsync as jest.Mock).mockImplementation(async (query: string) => {
            if (query.includes("PRAGMA table_info")) {
                return [{ name: "rpe" }, { name: "reps_left" }, { name: "reps_right" }, { name: "equipment" }, { name: "attachment" }];
            }
            if (query.includes("SELECT id, exercises FROM workouts")) {
                return [
                    {
                        id: "workout1",
                        exercises: JSON.stringify([
                            { id: "flat_dumbbell_bench_press", name: "Flat Dumbbell Bench Press" },
                            { id: "push_up", name: "Push-up" },
                        ]),
                    },
                    {
                        id: "workout2",
                        exercises: JSON.stringify([
                            { id: "wide_grip_lat_pulldown", name: "Wide Grip Lat Pulldown" },
                        ]),
                    },
                    {
                        id: "workout3",
                        exercises: JSON.stringify([
                            { id: "barbell_curl", name: "Barbell Curl" },
                        ]),
                    },
                    {
                        id: "workout4",
                        exercises: JSON.stringify([
                            { id: "machine_preacher_curl", name: "Machine Preacher Curl" },
                        ]),
                    },
                    {
                        id: "workout5",
                        exercises: JSON.stringify([
                            { id: "hammer_dumbbell_curl", name: "Hammer Dumbbell Curl" },
                        ]),
                    },
                    {
                        id: "workout6",
                        exercises: JSON.stringify([
                            { id: "incline_dumbbell_curl", name: "Incline Dumbbell Curl" },
                        ]),
                    },
                    {
                        id: "workout7",
                        exercises: JSON.stringify([
                            { id: "reverse_dumbbell_curl", name: "Reverse Dumbbell Curl" },
                        ]),
                    },
                    {
                        id: "workout8",
                        exercises: JSON.stringify([
                            { id: "dumbbell_fly", name: "Dumbbell Fly" },
                        ]),
                    },
                    {
                        id: "workout9",
                        exercises: JSON.stringify([
                            { id: "machine_chest_fly", name: "Machine Chest Fly" },
                        ]),
                    },
                    {
                        id: "workout10",
                        exercises: JSON.stringify([
                            { id: "dumbbell_reverse_wrist_curl", name: "Dumbbell Reverse Wrist Curl" },
                        ]),
                    },
                    {
                        id: "workout11",
                        exercises: JSON.stringify([
                            { id: "barbell_reverse_wrist_curl", name: "Barbell Reverse Wrist Curl" },
                        ]),
                    },
                    {
                        id: "workout12",
                        exercises: JSON.stringify([
                            { id: "dumbbell_wrist_curl", name: "Dumbbell Wrist Curl" },
                        ]),
                    },
                    {
                        id: "workout13",
                        exercises: JSON.stringify([
                            { id: "barbell_wrist_curl", name: "Barbell Wrist Curl" },
                        ]),
                    },
                    {
                        id: "workout14",
                        exercises: JSON.stringify([
                            { id: "cable_fly", name: "Cable Fly" },
                        ]),
                    },
                    {
                        id: "workout15",
                        exercises: JSON.stringify([
                            { id: "overhead_dumbbell_tricep_extension", name: "Overhead Dumbbell Tricep Extension" },
                        ]),
                    },
                    {
                        id: "workout16",
                        exercises: JSON.stringify([
                            { id: "overhead_cable_tricep_extension", name: "Overhead Cable Tricep Extension" },
                        ]),
                    },
                    {
                        id: "workout17",
                        exercises: JSON.stringify([
                            { id: "dumbbell_shrug", name: "Dumbbell Shrug" },
                        ]),
                    },
                    {
                        id: "workout18",
                        exercises: JSON.stringify([
                            { id: "barbell_shrug", name: "Barbell Shrug" },
                        ]),
                    },
                    {
                        id: "workout19",
                        exercises: JSON.stringify([
                            { id: "dumbbell_calf_raise", name: "Dumbbell Calf Raise" },
                        ]),
                    },
                    {
                        id: "workout20",
                        exercises: JSON.stringify([
                            { id: "machine_calf_raise", name: "Machine Calf Raise" },
                        ]),
                    },
                    {
                        id: "workout21",
                        exercises: JSON.stringify([
                            { id: "barbell_squat", name: "Barbell Squat" },
                        ]),
                    },
                    {
                        id: "workout22",
                        exercises: JSON.stringify([
                            { id: "smith_machine_squat", name: "Smith Machine Squat" },
                        ]),
                    },
                    {
                        id: "workout23",
                        exercises: JSON.stringify([
                            { id: "hack_squat", name: "Hack Squat" },
                        ]),
                    },
                    {
                        id: "workout24",
                        exercises: JSON.stringify([
                            { id: "pendulum_squat", name: "Pendulum Squat" },
                        ]),
                    },
                    {
                        id: "workout25",
                        exercises: JSON.stringify([
                            { id: "goblet_squat", name: "Goblet Squat" },
                        ]),
                    },
                    {
                        id: "workout26",
                        exercises: JSON.stringify([
                            { id: "cable_lateral_raise", name: "Cable Lateral Raise" },
                        ]),
                    },
                    {
                        id: "workout27",
                        exercises: JSON.stringify([
                            { id: "single_arm_cable_lateral_raise", name: "Single Arm Cable Lateral Raise" },
                        ]),
                    },
                    {
                        id: "workout28",
                        exercises: JSON.stringify([
                            { id: "machine_lateral_raise", name: "Machine Lateral Raise" },
                        ]),
                    },
                    {
                        id: "workout29",
                        exercises: JSON.stringify([
                            { id: "overhead_press", name: "Overhead Press" },
                        ]),
                    },
                    {
                        id: "workout30",
                        exercises: JSON.stringify([
                            { id: "machine_shoulder_press", name: "Machine Shoulder Press" },
                        ]),
                    },
                    {
                        id: "workout31",
                        exercises: JSON.stringify([
                            { id: "arnold_press", name: "Arnold Press" },
                        ]),
                    },
                    {
                        id: "workout32",
                        exercises: JSON.stringify([
                            { id: "barbell_skullcrusher", name: "Barbell Skullcrusher" },
                        ]),
                    },
                    {
                        id: "workout33",
                        exercises: JSON.stringify([
                            { id: "dumbbell_skullcrusher", name: "Dumbbell Skullcrusher" },
                        ]),
                    },
                ];
            }
            return [];
        });

        await initDatabase();

        // Check if database tables were setup and ghost cleanups were run
        expect(mockDb.execAsync).toHaveBeenCalled();
        
        // Check if consolidation updates were run on set_logs
        const runCalls = (mockDb.runAsync as jest.Mock).mock.calls.map((c: any) => c[0]);
        
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'bench_press'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'lat_pulldown'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'seated_cable_row'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'bicep_curl'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'preacher_curl'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'hammer_curl'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'incline_curl'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'reverse_curl'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'chest_fly'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'reverse_wrist_curl'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'wrist_curl'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'overhead_tricep_extension'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'shrug'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'weighted_calf_raise'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'weighted_squat'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'lateral_raise'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'shoulder_press'"));
        expect(runCalls).toContainEqual(expect.stringContaining("UPDATE set_logs \n                SET exercise_id = 'skullcrusher'"));

        // Check if deprecated exercises delete query was run
        expect(runCalls).toContainEqual(expect.stringContaining("DELETE FROM exercises \n                WHERE id IN"));

        // Check if workouts JSON templates were updated and runAsync was called to save them
        const updateWorkoutCalls = (mockDb.runAsync as jest.Mock).mock.calls.filter((c: any) => c[0].includes("UPDATE workouts SET exercises"));
        expect(updateWorkoutCalls).toHaveLength(33);

        // Check first workout template mapping: flat_dumbbell_bench_press -> bench_press with equipment: dumbbell
        const workout1Arg = JSON.parse(updateWorkoutCalls[0][1][0]);
        expect(workout1Arg[0].id).toBe("bench_press");
        expect(workout1Arg[0].name).toBe("Bench Press");
        expect(workout1Arg[0].equipment).toBe("dumbbell");
        expect(workout1Arg[0].attachment).toBe("None");
        expect(workout1Arg[1].id).toBe("push_up"); // Unaffected

        // Check second workout template mapping: wide_grip_lat_pulldown -> lat_pulldown with attachment: Wide-Grip Bar
        const workout2Arg = JSON.parse(updateWorkoutCalls[1][1][0]);
        expect(workout2Arg[0].id).toBe("lat_pulldown");
        expect(workout2Arg[0].name).toBe("Lat Pulldown");
        expect(workout2Arg[0].equipment).toBe("cable");
        expect(workout2Arg[0].attachment).toBe("Wide-Grip Bar");

        // Check third workout template mapping: barbell_curl -> bicep_curl with equipment: barbell
        const workout3Arg = JSON.parse(updateWorkoutCalls[2][1][0]);
        expect(workout3Arg[0].id).toBe("bicep_curl");
        expect(workout3Arg[0].name).toBe("Bicep Curl");
        expect(workout3Arg[0].equipment).toBe("barbell");
        expect(workout3Arg[0].attachment).toBe("None");

        // Check fourth workout template mapping: machine_preacher_curl -> preacher_curl with equipment: machine
        const workout4Arg = JSON.parse(updateWorkoutCalls[3][1][0]);
        expect(workout4Arg[0].id).toBe("preacher_curl");
        expect(workout4Arg[0].name).toBe("Preacher Curl");
        expect(workout4Arg[0].equipment).toBe("machine");
        expect(workout4Arg[0].attachment).toBe("None");

        // Check fifth workout template mapping: hammer_dumbbell_curl -> hammer_curl with equipment: dumbbell
        const workout5Arg = JSON.parse(updateWorkoutCalls[4][1][0]);
        expect(workout5Arg[0].id).toBe("hammer_curl");
        expect(workout5Arg[0].name).toBe("Hammer Curl");
        expect(workout5Arg[0].equipment).toBe("dumbbell");
        expect(workout5Arg[0].attachment).toBe("None");

        // Check sixth workout template mapping: incline_dumbbell_curl -> incline_curl with equipment: dumbbell
        const workout6Arg = JSON.parse(updateWorkoutCalls[5][1][0]);
        expect(workout6Arg[0].id).toBe("incline_curl");
        expect(workout6Arg[0].name).toBe("Incline Curl");
        expect(workout6Arg[0].equipment).toBe("dumbbell");
        expect(workout6Arg[0].attachment).toBe("None");

        // Check seventh workout template mapping: reverse_dumbbell_curl -> reverse_curl with equipment: dumbbell
        const workout7Arg = JSON.parse(updateWorkoutCalls[6][1][0]);
        expect(workout7Arg[0].id).toBe("reverse_curl");
        expect(workout7Arg[0].name).toBe("Reverse Curl");
        expect(workout7Arg[0].equipment).toBe("dumbbell");
        expect(workout7Arg[0].attachment).toBe("None");

        // Check eighth workout template mapping: dumbbell_fly -> chest_fly with equipment: dumbbell
        const workout8Arg = JSON.parse(updateWorkoutCalls[7][1][0]);
        expect(workout8Arg[0].id).toBe("chest_fly");
        expect(workout8Arg[0].name).toBe("Chest Fly");
        expect(workout8Arg[0].equipment).toBe("dumbbell");
        expect(workout8Arg[0].attachment).toBe("None");

        // Check ninth workout template mapping: machine_chest_fly -> chest_fly with equipment: machine
        const workout9Arg = JSON.parse(updateWorkoutCalls[8][1][0]);
        expect(workout9Arg[0].id).toBe("chest_fly");
        expect(workout9Arg[0].name).toBe("Chest Fly");
        expect(workout9Arg[0].equipment).toBe("machine");
        expect(workout9Arg[0].attachment).toBe("None");

        // Check tenth workout template mapping: dumbbell_reverse_wrist_curl -> reverse_wrist_curl with equipment: dumbbell
        const workout10Arg = JSON.parse(updateWorkoutCalls[9][1][0]);
        expect(workout10Arg[0].id).toBe("reverse_wrist_curl");
        expect(workout10Arg[0].name).toBe("Reverse Wrist Curl");
        expect(workout10Arg[0].equipment).toBe("dumbbell");
        expect(workout10Arg[0].attachment).toBe("None");

        // Check eleventh workout template mapping: barbell_reverse_wrist_curl -> reverse_wrist_curl with equipment: barbell
        const workout11Arg = JSON.parse(updateWorkoutCalls[10][1][0]);
        expect(workout11Arg[0].id).toBe("reverse_wrist_curl");
        expect(workout11Arg[0].name).toBe("Reverse Wrist Curl");
        expect(workout11Arg[0].equipment).toBe("barbell");
        expect(workout11Arg[0].attachment).toBe("None");

        // Check twelfth workout template mapping: dumbbell_wrist_curl -> wrist_curl with equipment: dumbbell
        const workout12Arg = JSON.parse(updateWorkoutCalls[11][1][0]);
        expect(workout12Arg[0].id).toBe("wrist_curl");
        expect(workout12Arg[0].name).toBe("Wrist Curl");
        expect(workout12Arg[0].equipment).toBe("dumbbell");
        expect(workout12Arg[0].attachment).toBe("None");

        // Check thirteenth workout template mapping: barbell_wrist_curl -> wrist_curl with equipment: barbell
        const workout13Arg = JSON.parse(updateWorkoutCalls[12][1][0]);
        expect(workout13Arg[0].id).toBe("wrist_curl");
        expect(workout13Arg[0].name).toBe("Wrist Curl");
        expect(workout13Arg[0].equipment).toBe("barbell");
        expect(workout13Arg[0].attachment).toBe("None");

        // Check fourteenth workout template mapping: cable_fly -> chest_fly with equipment: cable
        const workout14Arg = JSON.parse(updateWorkoutCalls[13][1][0]);
        expect(workout14Arg[0].id).toBe("chest_fly");
        expect(workout14Arg[0].name).toBe("Chest Fly");
        expect(workout14Arg[0].equipment).toBe("cable");
        expect(workout14Arg[0].attachment).toBe("None");

        // Check fifteenth workout template mapping: overhead_dumbbell_tricep_extension -> overhead_tricep_extension with equipment: dumbbell
        const workout15Arg = JSON.parse(updateWorkoutCalls[14][1][0]);
        expect(workout15Arg[0].id).toBe("overhead_tricep_extension");
        expect(workout15Arg[0].name).toBe("Overhead Tricep Extension");
        expect(workout15Arg[0].equipment).toBe("dumbbell");
        expect(workout15Arg[0].attachment).toBe("None");

        // Check sixteenth workout template mapping: overhead_cable_tricep_extension -> overhead_tricep_extension with equipment: cable
        const workout16Arg = JSON.parse(updateWorkoutCalls[15][1][0]);
        expect(workout16Arg[0].id).toBe("overhead_tricep_extension");
        expect(workout16Arg[0].name).toBe("Overhead Tricep Extension");
        expect(workout16Arg[0].equipment).toBe("cable");
        expect(workout16Arg[0].attachment).toBe("None");

        // Check seventeenth workout template mapping: dumbbell_shrug -> shrug with equipment: dumbbell
        const workout17Arg = JSON.parse(updateWorkoutCalls[16][1][0]);
        expect(workout17Arg[0].id).toBe("shrug");
        expect(workout17Arg[0].name).toBe("Shrug");
        expect(workout17Arg[0].equipment).toBe("dumbbell");
        expect(workout17Arg[0].attachment).toBe("None");

        // Check eighteenth workout template mapping: barbell_shrug -> shrug with equipment: barbell
        const workout18Arg = JSON.parse(updateWorkoutCalls[17][1][0]);
        expect(workout18Arg[0].id).toBe("shrug");
        expect(workout18Arg[0].name).toBe("Shrug");
        expect(workout18Arg[0].equipment).toBe("barbell");
        expect(workout18Arg[0].attachment).toBe("None");

        // Check nineteenth workout template mapping: dumbbell_calf_raise -> weighted_calf_raise with equipment: dumbbell
        const workout19Arg = JSON.parse(updateWorkoutCalls[18][1][0]);
        expect(workout19Arg[0].id).toBe("weighted_calf_raise");
        expect(workout19Arg[0].name).toBe("Weighted Calf Raise");
        expect(workout19Arg[0].equipment).toBe("dumbbell");
        expect(workout19Arg[0].attachment).toBe("None");

        // Check twentieth workout template mapping: machine_calf_raise -> weighted_calf_raise with equipment: machine
        const workout20Arg = JSON.parse(updateWorkoutCalls[19][1][0]);
        expect(workout20Arg[0].id).toBe("weighted_calf_raise");
        expect(workout20Arg[0].name).toBe("Weighted Calf Raise");
        expect(workout20Arg[0].equipment).toBe("machine");
        expect(workout20Arg[0].attachment).toBe("None");

        // Check twenty-first workout template mapping: barbell_squat -> weighted_squat with equipment: barbell
        const workout21Arg = JSON.parse(updateWorkoutCalls[20][1][0]);
        expect(workout21Arg[0].id).toBe("weighted_squat");
        expect(workout21Arg[0].name).toBe("Weighted Squat");
        expect(workout21Arg[0].equipment).toBe("barbell");
        expect(workout21Arg[0].attachment).toBe("None");

        // Check twenty-second workout template mapping: smith_machine_squat -> weighted_squat with equipment: smith machine
        const workout22Arg = JSON.parse(updateWorkoutCalls[21][1][0]);
        expect(workout22Arg[0].id).toBe("weighted_squat");
        expect(workout22Arg[0].name).toBe("Weighted Squat");
        expect(workout22Arg[0].equipment).toBe("smith machine");
        expect(workout22Arg[0].attachment).toBe("None");

        // Check twenty-third workout template mapping: hack_squat -> weighted_squat with equipment: hack machine
        const workout23Arg = JSON.parse(updateWorkoutCalls[22][1][0]);
        expect(workout23Arg[0].id).toBe("weighted_squat");
        expect(workout23Arg[0].name).toBe("Weighted Squat");
        expect(workout23Arg[0].equipment).toBe("hack machine");
        expect(workout23Arg[0].attachment).toBe("None");

        // Check twenty-fourth workout template mapping: pendulum_squat -> weighted_squat with equipment: pendulum machine
        const workout24Arg = JSON.parse(updateWorkoutCalls[23][1][0]);
        expect(workout24Arg[0].id).toBe("weighted_squat");
        expect(workout24Arg[0].name).toBe("Weighted Squat");
        expect(workout24Arg[0].equipment).toBe("pendulum machine");
        expect(workout24Arg[0].attachment).toBe("None");

        // Check twenty-fifth workout template mapping: goblet_squat -> weighted_squat with equipment: barbell
        const workout25Arg = JSON.parse(updateWorkoutCalls[24][1][0]);
        expect(workout25Arg[0].id).toBe("weighted_squat");
        expect(workout25Arg[0].name).toBe("Weighted Squat");
        expect(workout25Arg[0].equipment).toBe("barbell");
        expect(workout25Arg[0].attachment).toBe("None");

        // Check twenty-sixth workout template mapping: cable_lateral_raise -> lateral_raise with equipment: cable, movementType: uniform
        const workout26Arg = JSON.parse(updateWorkoutCalls[25][1][0]);
        expect(workout26Arg[0].id).toBe("lateral_raise");
        expect(workout26Arg[0].name).toBe("Lateral Raise");
        expect(workout26Arg[0].equipment).toBe("cable");
        expect(workout26Arg[0].movementType).toBe("uniform");
        expect(workout26Arg[0].attachment).toBe("None");

        // Check twenty-seventh workout template mapping: single_arm_cable_lateral_raise -> lateral_raise with equipment: cable, movementType: unilateral
        const workout27Arg = JSON.parse(updateWorkoutCalls[26][1][0]);
        expect(workout27Arg[0].id).toBe("lateral_raise");
        expect(workout27Arg[0].name).toBe("Lateral Raise");
        expect(workout27Arg[0].equipment).toBe("cable");
        expect(workout27Arg[0].movementType).toBe("unilateral");
        expect(workout27Arg[0].attachment).toBe("None");

        // Check twenty-eighth workout template mapping: machine_lateral_raise -> lateral_raise with equipment: machine, movementType: uniform
        const workout28Arg = JSON.parse(updateWorkoutCalls[27][1][0]);
        expect(workout28Arg[0].id).toBe("lateral_raise");
        expect(workout28Arg[0].name).toBe("Lateral Raise");
        expect(workout28Arg[0].equipment).toBe("machine");
        expect(workout28Arg[0].movementType).toBe("uniform");
        expect(workout28Arg[0].attachment).toBe("None");

        // Check twenty-ninth workout template mapping: overhead_press -> shoulder_press with equipment: barbell, movementType: uniform
        const workout29Arg = JSON.parse(updateWorkoutCalls[28][1][0]);
        expect(workout29Arg[0].id).toBe("shoulder_press");
        expect(workout29Arg[0].name).toBe("Shoulder Press");
        expect(workout29Arg[0].equipment).toBe("barbell");
        expect(workout29Arg[0].movementType).toBe("uniform");
        expect(workout29Arg[0].attachment).toBe("None");

        // Check thirtieth workout template mapping: machine_shoulder_press -> shoulder_press with equipment: machine, movementType: uniform
        const workout30Arg = JSON.parse(updateWorkoutCalls[29][1][0]);
        expect(workout30Arg[0].id).toBe("shoulder_press");
        expect(workout30Arg[0].name).toBe("Shoulder Press");
        expect(workout30Arg[0].equipment).toBe("machine");
        expect(workout30Arg[0].movementType).toBe("uniform");
        expect(workout30Arg[0].attachment).toBe("None");

        // Check thirty-first workout template mapping: arnold_press -> shoulder_press with equipment: dumbbell, movementType: uniform
        const workout31Arg = JSON.parse(updateWorkoutCalls[30][1][0]);
        expect(workout31Arg[0].id).toBe("shoulder_press");
        expect(workout31Arg[0].name).toBe("Shoulder Press");
        expect(workout31Arg[0].equipment).toBe("dumbbell");
        expect(workout31Arg[0].movementType).toBe("uniform");
        expect(workout31Arg[0].attachment).toBe("None");

        // Check thirty-second workout template mapping: barbell_skullcrusher -> skullcrusher with equipment: barbell, movementType: uniform
        const workout32Arg = JSON.parse(updateWorkoutCalls[31][1][0]);
        expect(workout32Arg[0].id).toBe("skullcrusher");
        expect(workout32Arg[0].name).toBe("Skullcrusher");
        expect(workout32Arg[0].equipment).toBe("barbell");
        expect(workout32Arg[0].movementType).toBe("uniform");
        expect(workout32Arg[0].attachment).toBe("None");

        // Check thirty-third workout template mapping: dumbbell_skullcrusher -> skullcrusher with equipment: dumbbell, movementType: uniform
        const workout33Arg = JSON.parse(updateWorkoutCalls[32][1][0]);
        expect(workout33Arg[0].id).toBe("skullcrusher");
        expect(workout33Arg[0].name).toBe("Skullcrusher");
        expect(workout33Arg[0].equipment).toBe("dumbbell");
        expect(workout33Arg[0].movementType).toBe("uniform");
        expect(workout33Arg[0].attachment).toBe("None");
    });
});
