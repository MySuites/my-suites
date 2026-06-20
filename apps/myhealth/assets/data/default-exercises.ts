export const EXERCISE_DATA_VERSION = 8;

export const BarbellBenchPress = [
    {
        "id": "flat_barbell_bench_press",
        "name": "Flat Barbell Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        "secondary_muscles": ["Triceps", "Shoulders"],
        difficulty: 3.0,
        "description":
            "Standard horizontal bench press targeting overall chest volume and strength.",
        "tips": [
            "Keep your feet flat on the floor for maximum stability.",
            "Retract your scapula (shoulder blades) and pin them to the bench.",
            "Control the bar on the descent and touch your lower chest/sternum.",
            "Drive the weight up while keeping your elbows tucked at roughly 45 degrees."
        ],
        "nextVariations": [
            "incline_barbell_bench_press",
            "decline_barbell_bench_press",
        ],
    },
    {
        "id": "incline_barbell_bench_press",
        "name": "Incline Barbell Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 8.5,
        "description":
            "Elevated bench angle that biases the upper pectoral muscles.",
    },
    {
        "id": "decline_barbell_bench_press",
        "name": "Decline Barbell Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 5.0,
        "description":
            "Lowered bench angle focusing on the lower pectoral muscles and providing a slight mechanical advantage.",
    },
];

export const SmithMachineBenchPress = [
    {
        "id": "flat_smith_machine_bench_press",
        "description":
            "Smith machine bench press targeting the chest with a guided barbell path.",
        "name": "Flat Smith Machine Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 4.0,
        "nextVariations": [
            "incline_smith_machine_bench_press",
            "decline_smith_machine_bench_press",
        ],
    },
    {
        "id": "incline_smith_machine_bench_press",
        "description":
            "Smith machine bench press targeting the upper chest with an inclined angle.",
        "name": "Incline Smith Machine Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 9.5,
        "nextVariations": [],
    },
    {
        "id": "decline_smith_machine_bench_press",
        "description":
            "Smith machine bench press targeting the lower chest with a declined angle.",
        "name": "Decline Smith Machine Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 6.5,
        "nextVariations": [],
    },
];

export const DumbbellBenchPress = [
    {
        "id": "flat_dumbbell_bench_press",
        "description":
            "Dumbbell bench press targeting the chest with an independent range of motion.",
        "name": "Flat Dumbbell Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 5.0,
        "nextVariations": [
            "incline_dumbbell_bench_press",
            "decline_dumbbell_bench_press",
        ],
    },
    {
        "id": "incline_dumbbell_bench_press",
        "description":
            "Dumbbell bench press targeting the upper chest with an inclined angle.",
        "name": "Incline Dumbbell Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 10.0,
        "nextVariations": [],
    },
    {
        "id": "decline_dumbbell_bench_press",
        "description":
            "Dumbbell bench press targeting the lower chest with a declined angle.",
        "name": "Decline Dumbbell Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 9.5,
        "nextVariations": [],
    },
];

export const ChestFlys = [
    {
        "id": "dumbbell_fly",
        "description":
            "Chest fly targeting the pectoral muscles using dumbbells.",
        "name": "Dumbbell Fly",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        "secondary_muscles": ["Shoulders", "Biceps"],
        difficulty: 5.5,
    },
    {
        "id": "cable_fly",
        "description":
            "Chest fly targeting the pectoral muscles using cables.",
        "name": "Cable Fly",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        "secondary_muscles": ["Shoulders"],
        difficulty: 8.0,
    },
    {
        "id": "machine_chest_fly",
        "name": "Machine Chest Fly",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        "secondary_muscles": ["Shoulders"],
        difficulty: 4.5,
        "description": "Seated chest fly using a machine for constant tension and stability."
    },
];

export const LatPulldowns = [
    {
        "id": "lat_pulldown",
        "description":
            "Upper back and lat exercise using a cable pulldown machine.",
        "name": "Lat Pulldown",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 3.5,
        "nextVariations": [
            "wide_grip_lat_pulldown",
        ],
    },
    {
        "id": "wide_grip_lat_pulldown",
        "description":
            "Wide grip cable pulldown focusing on lat width.",
        "name": "Wide Grip Lat Pulldown",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 9.5,
    },
    {
        "id": "close_grip_lat_pulldown",
        "description":
            "Close grip cable pulldown targeting the lower lats.",
        "name": "Close Grip Lat Pulldown",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 8.5,
        "nextVariations": [
            "wide_grip_lat_pulldown",
        ],
    },
    {
        "id": "reverse_grip_lat_pulldown",
        "description":
            "Underhand grip cable pulldown targeting the lats and biceps.",
        "name": "Reverse Grip Lat Pulldown",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 7.0,
        "nextVariations": [
            "wide_grip_lat_pulldown",
        ],
    },
];

export const SeatedRows = [
    {
        "id": "seated_cable_row",
        "description":
            "Seated horizontal pull targeting the middle and upper back.",
        "name": "Seated Cable Row",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 2.0,
        "nextVariations": [
            "seated_cable_row_wide_grip",
        ],
    },
    {
        "id": "seated_cable_row_wide_grip",
        "description":
            "Wide grip cable row targeting the upper back and rear delts.",
        "name": "Seated Cable Row Wide Grip",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 4.5,
    },
    {
        "id": "seated_cable_row_close_grip",
        "description":
            "Close grip cable row focusing on the mid-back and lats.",
        "name": "Seated Cable Row Close Grip",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 10.0,
        "nextVariations": [
            "seated_cable_row_wide_grip",
        ],
    },
    {
        "id": "seated_cable_row_reverse_grip",
        "description":
            "Underhand cable row targeting the lower lats and biceps.",
        "name": "Seated Cable Row Reverse Grip",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 8.0,
        "nextVariations": [
            "seated_cable_row_wide_grip",
        ],
    },
];

export const FacePulls = [
    {
        "id": "face_pull",
        "description":
            "Cable exercise targeting the rear delts, upper back, and rotator cuff.",
        "name": "Face Pull",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 2.5,
    },
];

export const LateralRaises = [
    {
        "id": "lateral_raise",
        "description":
            "Dumbbell exercise targeting the lateral deltoids for shoulder width.",
        "name": "Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 3.5,
    },
    {
        "id": "cable_lateral_raise",
        "description":
            "Cable shoulder raise for constant tension on the lateral deltoids.",
        "name": "Cable Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 8.5,
    },
    {
        "id": "single_arm_cable_lateral_raise",
        "description":
            "One-arm cable raise targeting the lateral deltoids.",
        "name": "Single Arm Cable Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 5.0,
    },
    {
        "id": "machine_lateral_raise",
        "description":
            "Machine shoulder raise targeting the lateral deltoids.",
        "name": "Machine Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 2.0,
    },
];

export const FrontRaises = [
    {
        "id": "front_raise",
        "description":
            "Shoulder raise targeting the anterior deltoids.",
        "name": "Front Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 2.0,
    },
];

export const ShoulderPress = [
    {
        "id": "shoulder_press",
        "description":
            "Overhead shoulder press targeting the deltoids.",
        "name": "Shoulder Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 2.5,
    },
    {
        "id": "machine_shoulder_press",
        "description":
            "Machine overhead press targeting the deltoids.",
        "name": "Machine Shoulder Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 4.5,
    },
    {
        "id": "arnold_press",
        "description":
            "Dumbbell shoulder press with rotation to target all deltoid heads.",
        "name": "Arnold Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 1.5,
    },
    {
        "id": "overhead_press",
        "description":
            "Barbell overhead shoulder press targeting the deltoids and triceps.",
        "name": "Overhead Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 8.5,
    },
];

export const Deadlifts = [
    {
        "id": "deadlift",
        "description":
            "Compound lift targeting the posterior chain, including hamstrings, glutes, and back.",
        "name": "Deadlift",
        "type": "Weighted, Reps",
        "muscle_group": "Lower back",
        difficulty: 4.5,
    },
    {
        "id": "romanian_deadlift",
        "description":
            "Deadlift variation focusing on the hamstrings and glutes with minimal knee bend.",
        "name": "Romanian Deadlift",
        "type": "Weighted, Reps",
        "muscle_group": "Hamstrings",
        difficulty: 4.0,
    },
];

export const Squats = [
    {
        "id": "bodyweight_squat",
        "description":
            "Basic lower body exercise targeting the quads, glutes, and hamstrings.",
        "name": "Bodyweight Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 3.0,
        "tips": [
            "Keep your heels firmly on the ground throughout the movement.",
            "Push your knees outwards to track inline with your toes.",
            "Maintain a straight, neutral spine and look forward or slightly down.",
            "Descend until your thighs are at least parallel to the floor."
        ],
        "nextVariations": [
            "lunges",
        ],
    },
    {
        "id": "lunges",
        "description":
            "Unilateral leg exercise targeting the quads, glutes, and hamstrings.",
        "name": "Lunges",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 7.5,
        "nextVariations": [
            "split_squat",
        ],
    },
    {
        "id": "split_squat",
        "description":
            "Stationary unilateral squat targeting the quads and glutes.",
        "name": "Split Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 2.5,
        "nextVariations": [
            "sissy_squat",
            "goblet_squat",
            "weighted_squat",
        ],
    },
    {
        "id": "sissy_squat",
        "description":
            "Quad isolation exercise focusing on knee extension.",
        "name": "Sissy Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 7.5,
        "nextVariations": [
            "weighted_lunges",
        ],
    },
    {
        "id": "goblet_squat",
        "description":
            "Front-loaded squat targeting the quads and core using a dumbbell or kettlebell.",
        "name": "Goblet Squat",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 6.5,
        "nextVariations": [
            "weighted_lunges",
        ],
    },
    {
        "id": "weighted_squat",
        "description":
            "Squat variation performed with added weight.",
        "name": "Weighted Squat",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 3.0,
        "nextVariations": [
            "weighted_lunges",
        ],
    },
    {
        "id": "weighted_lunges",
        "description":
            "Lunges performed with added weight.",
        "name": "Weighted Lunges",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 4.5,
        "nextVariations": [
            "bulgarian_split_squat",
        ],
    },
    {
        "id": "bulgarian_split_squat",
        "description":
            "Rear-foot elevated split squat targeting the quads and glutes.",
        "name": "Bulgarian Split Squat",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 5.0,
        "nextVariations": [
            "shrimp_squat",
            "barbell_squat",
            "smith_machine_squat",
            "hack_squat",
            "pendulum_squat",
        ],
    },
    {
        "id": "shrimp_squat",
        "description":
            "Advanced bodyweight unilateral squat holding one leg behind.",
        "name": "Shrimp Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 10.0,
        "nextVariations": [
            "pistol_squat",
        ],
    },
    {
        "id": "barbell_squat",
        "description":
            "Barbell back squat targeting the quads, glutes, and hamstrings.",
        "name": "Barbell Squat",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 7.5,
        "nextVariations": [
            "pistol_squat",
        ],
    },
    {
        "id": "smith_machine_squat",
        "description":
            "Squat performed in a Smith machine for a guided movement path.",
        "name": "Smith Machine Squat",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 1.5,
        "nextVariations": [
            "pistol_squat",
        ],
    },
    {
        "id": "hack_squat",
        "description":
            "Machine-assisted squat targeting the quadriceps.",
        "name": "Hack Squat",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 3.0,
        "nextVariations": [
            "pistol_squat",
        ],
    },
    {
        "id": "pendulum_squat",
        "description":
            "Machine squat variation with a curved path to reduce lower back stress.",
        "name": "Pendulum Squat",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 1.5,
        "nextVariations": [
            "pistol_squat",
        ],
    },
    {
        "id": "pistol_squat",
        "description":
            "Advanced single-leg bodyweight squat.",
        "name": "Pistol Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 9.0,
        "nextVariations": [
            "dragon_squat",
        ],
    },
    {
        "id": "dragon_squat",
        "description":
            "Advanced unilateral squat with the non-working leg wrapped behind.",
        "name": "Dragon Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 7.5,
    },
];

export const CalfRaises = [
    {
        "id": "calf_raise",
        "description":
            "Calf exercise targeting the gastrocnemius muscle.",
        "name": "Calf Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Calves",
        difficulty: 1.5,
    },
    {
        "id": "dumbbell_calf_raise",
        "description":
            "Calf raise performed holding dumbbells.",
        "name": "Dumbbell Calf Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Calves",
        difficulty: 5.5,
    },
    {
        "id": "machine_calf_raise",
        "description":
            "Machine-assisted calf raise targeting the calves.",
        "name": "Machine Calf Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Calves",
        difficulty: 4.5,
    },
];

export const LegExtensions = [
    {
        "id": "leg_extension",
        "description":
            "Machine isolation exercise targeting the quadriceps.",
        "name": "Leg Extension",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 9.0,
    },
];

export const LegCurls = [
    {
        "id": "seated_leg_curl",
        "description":
            "Machine isolation exercise targeting the hamstrings while seated.",
        "name": "Seated Leg Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Hamstrings",
        difficulty: 3.5,
    },
    {
        "id": "lying_leg_curl",
        "description":
            "Machine isolation exercise targeting the hamstrings while lying prone.",
        "name": "Lying Leg Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Hamstrings",
        difficulty: 8.5,
    },
];

export const LegPress = [
    {
        "id": "leg_press",
        "description":
            "Compound lower body machine exercise targeting the quads and glutes.",
        "name": "Leg Press",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 7.0,
    },
    {
        "id": "horizontal_leg_press",
        "description":
            "Horizontal leg press machine targeting the quads and glutes.",
        "name": "Horizontal Leg Press",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 1.5,
    },
];

export const GluteBridges = [
    {
        "id": "glute_bridge",
        "description":
            "Glute isolation exercise performed on the floor.",
        "name": "Glute Bridge",
        "type": "Weighted, Reps",
        "muscle_group": "Glutes",
        difficulty: 8.0,
    },
];

export const HipThrusts = [
    {
        "id": "hip_thrust",
        "description":
            "Glute exercise performed with the upper back elevated on a bench.",
        "name": "Hip Thrust",
        "type": "Weighted, Reps",
        "muscle_group": "Glutes",
        difficulty: 9.5,
    },
];

export const HipAdductors = [
    {
        "id": "hip_adductor",
        "description":
            "Machine exercise targeting the inner thigh muscles.",
        "name": "Hip Adductor",
        "type": "Weighted, Reps",
        "muscle_group": "Adductors",
        difficulty: 4.0,
    },
];

export const HipAbductors = [
    {
        "id": "hip_abductor",
        "description":
            "Machine exercise targeting the outer glute muscles.",
        "name": "Hip Abductor",
        "type": "Weighted, Reps",
        "muscle_group": "Abductors",
        difficulty: 5.0,
    },
];

export const DumbbellCurls = [
    {
        "id": "dumbbell_curl",
        "description":
            "Bicep curl performed holding dumbbells.",
        "name": "Dumbbell Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.0,
        "nextVariations": [
            "incline_dumbbell_curl",
        ],
    },
    {
        "id": "incline_dumbbell_curl",
        "description":
            "Incline bench dumbbell curl for a deep stretch on the biceps.",
        "name": "Incline Dumbbell Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 8.0,
    },
    {
        "id": "hammer_dumbbell_curl",
        "description":
            "Dumbbell curl with a neutral grip targeting the brachialis and brachioradialis.",
        "name": "Hammer Dumbbell Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 1.5,
        "nextVariations": [
            "incline_dumbbell_curl",
        ],
    },
    {
        "id": "reverse_dumbbell_curl",
        "description":
            "Overhand grip dumbbell curl targeting the forearms and brachialis.",
        "name": "Reverse Dumbbell Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 3.0,
        "nextVariations": [
            "incline_dumbbell_curl",
        ],
    },
];

export const CableCurls = [
    {
        "id": "cable_curl",
        "description":
            "Bicep curl using a cable machine for constant tension.",
        "name": "Cable Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.5,
    },
    {
        "id": "bayesian_curl",
        "description":
            "Cable curl facing away from the machine to stretch the long head of the bicep.",
        "name": "Bayesian Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.0,
    },
];

export const BarbellCurls = [
    {
        "id": "barbell_curl",
        "description":
            "Bicep curl using a barbell.",
        "name": "Barbell Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 4.0,
    },
    {
        "id": "spider_curl",
        "description":
            "Incline bench curl facing down to isolate the biceps.",
        "name": "Spider Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.0,
    },
    {
        "id": "barbell_preacher_curl",
        "description":
            "Barbell curl on a preacher bench to prevent momentum.",
        "name": "Barbell Preacher Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 2.5,
    },
    {
        "id": "machine_preacher_curl",
        "description":
            "Preacher curl performed using a machine.",
        "name": "Machine Preacher Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.0,
    },
];

export const TricepExtensions = [
    {
        "id": "barbell_skullcrusher",
        "description":
            "Tricep extension using a barbell or EZ bar.",
        "name": "Barbell Skullcrusher",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 2.5,
    },
    {
        "id": "dumbbell_skullcrusher",
        "description":
            "Tricep extension using dumbbells.",
        "name": "Dumbbell Skullcrusher",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 7.0,
    },
    {
        "id": "overhead_dumbbell_tricep_extension",
        "description":
            "Overhead tricep extension performed holding a dumbbell.",
        "name": "Overhead Dumbbell Tricep Extension",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 6.0,
    },
    {
        "id": "overhead_cable_tricep_extension",
        "description":
            "Overhead tricep extension using a cable machine.",
        "name": "Overhead Cable Tricep Extension",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 5.0,
    },
];

export const TricepPushdowns = [
    {
        "id": "cable_tricep_pushdown",
        "description":
            "Tricep pushdown using a cable machine.",
        "name": "Cable Tricep Pushdown",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 5.5,
    },
    {
        "id": "single_arm_tricep_pushdown",
        "description":
            "One-arm tricep pushdown using a cable machine.",
        "name": "Single-Arm Tricep Pushdown",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 4.5,
    },
];

export const TricepKickbacks = [
    {
        "id": "tricep_kickback",
        "description":
            "Dumbbell tricep extension leaning forward.",
        "name": "Tricep Kickback",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 1.5,
    },
];

export const LegRaises = [
    {
        "id": "leg_raise",
        "description":
            "Core exercise lifting the legs from a lying position.",
        "name": "Leg Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 5.0,
    },
    {
        "id": "hanging_leg_raise",
        "description":
            "Core exercise lifting the legs while hanging from a bar.",
        "name": "Hanging Leg Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 6.5,
    },
    {
        "id": "l-sit_hold",
        "description":
            "Isometric core and arm hold in an L shape.",
        "name": "L-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 9.0,
    },
    {
        "id": "v-sit_hold",
        "description":
            "Isometric core and arm hold in a V shape.",
        "name": "V-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.5,
    },
    {
        "id": "i-sit_hold",
        "description":
            "Advanced isometric hold in an I shape.",
        "name": "I-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 7.0,
    },
    {
        "id": "manna_hold",
        "description":
            "Elite isometric gymnastics hold with hips pushed forward over the hands.",
        "name": "Manna Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 8.0,
    },
];

export const Crunches = [
    {
        "id": "crunch",
        "description":
            "Abdominal crunch targeting the upper abs.",
        "name": "Crunch",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 6.0,
    },
    {
        "id": "cable_crunch",
        "description":
            "Kneeling cable crunch targeting the abdominal muscles.",
        "name": "Cable Crunch",
        "type": "Weighted, Reps",
        "muscle_group": "Abdominals",
        difficulty: 4.0,
    },
];

export const PushUps = [
    {
        "id": "wall_push_up",
        "description":
            "Push-up variation performed against a wall.",
        "name": "Wall Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 3.0,
        "nextVariations": [
            "incline_push_up",
            "knee_push_up",
        ],
    },
    {
        "id": "incline_push_up",
        "description":
            "Push-up variation with hands elevated.",
        "name": "Incline Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 6.0,
        "nextVariations": [
            "push_up",
        ],
    },
    {
        "id": "knee_push_up",
        "description":
            "Push-up variation performed on the knees.",
        "name": "Knee Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 3.0,
        "nextVariations": [
            "push_up",
        ],
    },
    {
        "id": "push_up",
        "description":
            "Standard bodyweight chest and arm exercise.",
        "name": "Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 6.0,
        "nextVariations": [
            "decline_push_up",
            "diamond_push_up",
            "close_push_up",
            "wide_push_up",
            "pike_push_up",
            "weighted_push_up",
        ],
    },
    {
        "id": "decline_push_up",
        "description":
            "Push-up variation with feet elevated to target the upper chest.",
        "name": "Decline Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 4.5,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
    {
        "id": "diamond_push_up",
        "description":
            "Close grip push-up targeting the triceps and inner chest.",
        "name": "Diamond Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 6.5,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
    {
        "id": "close_push_up",
        "description":
            "Push-up with hands placed close together.",
        "name": "Close Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 8.5,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
    {
        "id": "wide_push_up",
        "description":
            "Push-up with hands placed wide apart.",
        "name": "Wide Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 8.5,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
    {
        "id": "pike_push_up",
        "description":
            "Bodyweight shoulder exercise in a pike position.",
        "name": "Pike Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 9.5,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
    {
        "id": "pseudo_planche_push_up",
        "description":
            "Push-up leaning forward to target the shoulders and chest.",
        "name": "Pseudo Planche Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Other",
        difficulty: 4.0,
    },
    {
        "id": "weighted_push_up",
        "description":
            "Push-up performed with added weight.",
        "name": "Weighted Push-up",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 4.0,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
];

export const PullUps = [
    {
        "id": "chin_up",
        "description":
            "Pull-up variation with an underhand grip targeting the lats and biceps.",
        "name": "Chin-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Biceps",
        difficulty: 8.5,
        "nextVariations": [
            "pull_up",
        ],
    },
    {
        "id": "pull_up",
        "description":
            "Upper body pulling exercise targeting the lats and back.",
        "name": "Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 6.5,
        "nextVariations": [
            "weighted_chin_up",
            "weighted_pull_up",
        ],
    },
    {
        "id": "weighted_chin_up",
        "description":
            "Chin-up performed with added weight.",
        "name": "Weighted Chin-up",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Biceps",
        difficulty: 1.0,
    },
    {
        "id": "weighted_pull_up",
        "description":
            "Pull-up performed with added weight.",
        "name": "Weighted Pull-up",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 7.0,
    },
];

export const Rows = [
    {
        "id": "bodyweight_row",
        "description":
            "Horizontal pull using bodyweight on rings or a bar.",
        "name": "Bodyweight Row",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 6.5,
    },
    {
        "id": "weighted_row",
        "description":
            "Bodyweight row performed with added weight.",
        "name": "Weighted Row",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 4.5,
    },
];

export const DumbbellRows = [
    {
        "id": "dumbbell_row",
        "name": "Dumbbell Row",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 3.5,
        "description": "One-arm dumbbell row targeting the lats and upper back.",
    },
];

export const Planks = [
    {
        "id": "plank",
        "description":
            "Isometric core stability exercise.",
        "name": "Plank",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 9.5,
    },
    {
        "id": "weighted_plank",
        "description":
            "Plank performed with added weight.",
        "name": "Weighted Plank",
        "type": "Weighted, Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 6.5,
    },
    {
        "id": "side_plank",
        "description":
            "Isometric core exercise targeting the obliques.",
        "name": "Side Plank",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 5.0,
    },
];

export const RussianTwists = [
    {
        "id": "russian_twist",
        "description":
            "Rotational core exercise.",
        "name": "Russian Twist",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 4.0,
    },
];

export const Dips = [
    {
        "id": "bodyweight_dip",
        "description":
            "Tricep and lower chest exercise on parallel bars.",
        "name": "Bodyweight Dip",
        "type": "Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 7.5,
    },
    {
        "id": "weighted_dip",
        "description":
            "Bodyweight dip performed with added weight.",
        "name": "Weighted Dip",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 7.5,
    },
];

export const HandstandExercises = [
    {
        "id": "frog_stand",
        "description":
            "Beginner arm support balance targeting the shoulders and core.",
        "name": "Frog Stand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 4.0,
    },
    {
        "id": "crow_pose",
        "description":
            "Yoga arm balance balancing knees on the triceps.",
        "name": "Crow Pose",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 5.0,
    },
    {
        "id": "chest_to_wall_handstand",
        "description":
            "Handstand hold facing the wall to practice form.",
        "name": "Chest-to-Wall Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 1.5,
    },
    {
        "id": "back_to_wall_handstand",
        "description":
            "Handstand hold facing away from the wall.",
        "name": "Back-to-Wall Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 3.5,
    },
    {
        "id": "handstand",
        "description":
            "Free-standing handstand hold balancing on the hands.",
        "name": "Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 7.5,
    },
    {
        "id": "wall_handstand_push_up",
        "description":
            "Handstand push-up performed against a wall.",
        "name": "Wall Handstand Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 7.0,
    },
    {
        "id": "handstand_push_up",
        "description":
            "Free-standing handstand push-up.",
        "name": "Handstand Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.5,
    },
    {
        "id": "one_arm_handstand",
        "description":
            "Elite handstand hold balancing on one hand.",
        "name": "One-Arm Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 6.0,
    },
];

export const HandstandPressExercises = [
    {
        "id": "pike_handstand_press",
        "description":
            "Pressing into a handstand from a pike position.",
        "name": "Pike Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.0,
    },
    {
        "id": "straddle_handstand_press",
        "description":
            "Pressing into a handstand from a straddle position.",
        "name": "Straddle Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.0,
    },
    {
        "id": "handstand_press",
        "description":
            "Pressing into a handstand from a standing position.",
        "name": "Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 5.5,
    },
];

export const PlancheExercises = [
    {
        "id": "pseudo_planche_hold",
        "description":
            "Isometric hold leaning forward to prepare for the planche.",
        "name": "Pseudo Planche Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 7.5,
        "nextVariations": [
            "tuck_planche",
        ],
    },
    {
        "id": "tuck_planche",
        "description":
            "Isometric arm support hold with knees tucked.",
        "name": "Tuck Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 4.0,
        "nextVariations": [
            "advanced_tuck_planche",
        ],
    },
    {
        "id": "advanced_tuck_planche",
        "description":
            "Isometric arm support hold with back flat and knees tucked.",
        "name": "Advanced Tuck Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 5.5,
        "nextVariations": [
            "half_lay_planche",
        ],
    },
    {
        "id": "half_lay_planche",
        "description":
            "Isometric planche hold with hips extended and knees bent.",
        "name": "Half-Lay Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 7.0,
        "nextVariations": [
            "straddle_planche",
        ],
    },
    {
        "id": "straddle_planche",
        "description":
            "Isometric planche hold with legs straddled.",
        "name": "Straddle Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 5.0,
        "nextVariations": [
            "planche",
        ],
    },
    {
        "id": "planche",
        "description":
            "Full isometric planche hold with body parallel to the ground.",
        "name": "Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 2.5,
        "nextVariations": [
            "planche_push_up",
            "one_arm_planche",
            "maltese",
        ],
    },
    {
        "id": "planche_push_up",
        "description":
            "Push-up performed in a planche position.",
        "name": "Planche Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.0,
    },
    {
        "id": "one_arm_planche",
        "description":
            "Planche hold supported on a single arm.",
        "name": "One-Arm Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 9.0,
    },
    {
        "id": "maltese",
        "description":
            "Elite wide-arm planche hold.",
        "name": "Maltese",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 6.0,
        "nextVariations": [
            "dragon_maltese",
        ],
    },
    {
        "id": "dragon_maltese",
        "description":
            "Advanced wide-arm planche hold variation.",
        "name": "Dragon Maltese",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 8.5,
    },
];

export const FrontLeverExercises = [
    {
        "id": "tuck_front_lever",
        "description":
            "Isometric back pull with knees tucked.",
        "name": "Tuck Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 6.0,
        "nextVariations": [
            "advanced_tuck_front_lever",
        ],
    },
    {
        "id": "advanced_tuck_front_lever",
        "description":
            "Isometric back pull with back flat and knees tucked.",
        "name": "Advanced Tuck Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 7.0,
    },
    {
        "id": "half_lay_front_lever",
        "description":
            "Isometric front lever with hips extended and knees bent.",
        "name": "Half-Lay Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 7.5,
        "nextVariations": [
            "advanced_tuck_front_lever",
        ],
    },
    {
        "id": "straddle_front_lever",
        "description":
            "Isometric front lever with legs straddled.",
        "name": "Straddle Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 8.0,
        "nextVariations": [
            "advanced_tuck_front_lever",
        ],
    },
    {
        "id": "front_lever",
        "description":
            "Full isometric back hold parallel to the ground.",
        "name": "Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 3.5,
        "nextVariations": [
            "advanced_tuck_front_lever",
        ],
    },
    {
        "id": "front_lever_pull_up",
        "description":
            "Pull-up performed in a front lever position.",
        "name": "Front Lever Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 9.5,
        "nextVariations": [
            "advanced_tuck_front_lever",
        ],
    },
    {
        "id": "front_lever_touch",
        "description":
            "Pulling the front lever to touch the bar.",
        "name": "Front Lever Touch",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 7.5,
        "nextVariations": [
            "advanced_tuck_front_lever",
        ],
    },
    {
        "id": "one_arm_front_lever",
        "description":
            "Front lever hold supported on a single arm.",
        "name": "One-Arm Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 9.5,
        "nextVariations": [
            "advanced_tuck_front_lever",
        ],
    },
];

export const BackLeverExercises = [
    {
        "id": "tuck_back_lever",
        "description":
            "Gymnastic hold facing downward with knees tucked.",
        "name": "Tuck Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 9.0,
    },
    {
        "id": "advanced_tuck_back_lever",
        "description":
            "Gymnastic hold facing downward with back flat.",
        "name": "Advanced Tuck Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 4.0,
    },
    {
        "id": "half_lay_back_lever",
        "description":
            "Back lever hold with hips extended and knees bent.",
        "name": "Half-Lay Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.5,
    },
    {
        "id": "straddle_back_lever",
        "description":
            "Back lever hold with legs straddled.",
        "name": "Straddle Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.0,
    },
    {
        "id": "back_lever",
        "description":
            "Full back lever hold parallel to the ground.",
        "name": "Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 1.5,
    },
    {
        "id": "back_lever_pull_up",
        "description":
            "Pull-up performed in a back lever position.",
        "name": "Back Lever Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Other",
        difficulty: 3.5,
    },
    {
        "id": "back_lever_touch",
        "description":
            "Pulling the back lever to touch the bar.",
        "name": "Back Lever Touch",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 8.0,
    },
    {
        "id": "one_arm_back_lever",
        "description":
            "Back lever hold supported on a single arm.",
        "name": "One-Arm Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 8.0,
    },
];

export const WristExercises = [
    {
        "id": "dumbbell_wrist_curl",
        "description":
            "Forearm curl targeting the wrist flexors.",
        "name": "Dumbbell Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        difficulty: 2.0,
    },
    {
        "id": "dumbbell_reverse_wrist_curl",
        "description":
            "Forearm curl targeting the wrist extensors.",
        "name": "Dumbbell Reverse Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        difficulty: 2.5,
    },
    {
        "id": "barbell_wrist_curl",
        "description":
            "Forearm curl targeting the wrist flexors using a barbell.",
        "name": "Barbell Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        difficulty: 3.0,
    },
    {
        "id": "barbell_reverse_wrist_curl",
        "description":
            "Forearm curl targeting the wrist extensors using a barbell.",
        "name": "Barbell Reverse Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        difficulty: 3.5,
    },
    {
        "id": "first_knuckle_raise",
        "description":
            "Grip strength exercise raising the hand onto the knuckles.",
        "name": "First Knuckle Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Forearms",
        difficulty: 4.0,
    },
];

export const TibialisExercises = [
    {
        "id": "tibialis_raise",
        "name": "Tibialis Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Tibialis",
        difficulty: 2.0,
        "description": "Exercise to isolate the tibialis anterior muscle on the front of the shin.",
    },
];

export const Shrugs = [
    {
        "id": "dumbbell_shrug",
        "name": "Dumbbell Shrug",
        "type": "Weighted, Reps",
        "muscle_group": "Traps",
        difficulty: 2.0,
        "description": "Dumbbell shrug targeting the upper trapezius muscles.",
    },
    {
        "id": "barbell_shrug",
        "name": "Barbell Shrug",
        "type": "Weighted, Reps",
        "muscle_group": "Traps",
        difficulty: 3.5,
        "description": "Barbell shrug for upper trapezius development.",
    },
];

export const CardioExercises = [
    {
        "id": "treadmill",
        "description":
            "Cardio walking or running on a treadmill.",
        "name": "Treadmill",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 9.5,
    },
    {
        "id": "elliptical",
        "description":
            "Low-impact cardio exercise on an elliptical machine.",
        "name": "Elliptical",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 5.5,
    },
    {
        "id": "stair_climber",
        "description":
            "Cardio climbing exercise on a stair machine.",
        "name": "Stair Climber",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 9.0,
    },
    {
        "id": "rowing_machine",
        "description":
            "Full body cardio and pulling exercise on a rower.",
        "name": "Rowing Machine",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 9.5,
    },
    {
        "id": "bike",
        "description":
            "Stationary cycling cardio exercise.",
        "name": "Bike",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 6.5,
    },
    {
        "id": "running",
        "description":
            "Outdoor or indoor running cardio exercise.",
        "name": "Running",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 4.0,
    },
    {
        "id": "cycling",
        "description":
            "Outdoor or indoor cycling cardio exercise.",
        "name": "Cycling",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 2.5,
    },
    {
        "id": "swimming",
        "description":
            "Full body pool swimming cardio exercise.",
        "name": "Swimming",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 8.5,
    },
    {
        "id": "jump_rope",
        "description":
            "High intensity jumping cardio exercise.",
        "name": "Jump Rope",
        "type": "Duration",
        "muscle_group": "Cardio",
        difficulty: 3.5,
    },
    {
        "id": "jumping_jacks",
        "description":
            "Bodyweight jumping cardio exercise.",
        "name": "Jumping Jacks",
        "type": "Bodyweight, Reps",
        "muscle_group": "Cardio",
        difficulty: 1.5,
    },
];

export default [
    ...BarbellBenchPress,
    ...SmithMachineBenchPress,
    ...DumbbellBenchPress,
    ...ChestFlys,
    ...LatPulldowns,
    ...SeatedRows,
    ...FacePulls,
    ...LateralRaises,
    ...FrontRaises,
    ...ShoulderPress,
    ...Deadlifts,
    ...Squats,
    ...CalfRaises,
    ...LegExtensions,
    ...LegCurls,
    ...LegPress,
    ...GluteBridges,
    ...HipThrusts,
    ...HipAdductors,
    ...HipAbductors,
    ...DumbbellCurls,
    ...CableCurls,
    ...BarbellCurls,
    ...TricepExtensions,
    ...TricepPushdowns,
    ...TricepKickbacks,
    ...LegRaises,
    ...Crunches,
    ...PushUps,
    ...PullUps,
    ...Rows,
    ...DumbbellRows,
    ...Planks,
    ...RussianTwists,
    ...Dips,
    ...HandstandExercises,
    ...HandstandPressExercises,
    ...PlancheExercises,
    ...FrontLeverExercises,
    ...BackLeverExercises,
    ...WristExercises,
    ...TibialisExercises,
    ...Shrugs,
    ...CardioExercises,
];

export const Groups = {
    "Barbell Bench Press": BarbellBenchPress,
    "Smith Machine Bench Press": SmithMachineBenchPress,
    "Dumbbell Bench Press": DumbbellBenchPress,
    "Chest Flys": ChestFlys,
    "Lat Pulldowns": LatPulldowns,
    "Seated Rows": SeatedRows,
    "Face Pulls": FacePulls,
    "Lateral Raises": LateralRaises,
    "Front Raises": FrontRaises,
    "Shoulder Press": ShoulderPress,
    "Deadlifts": Deadlifts,
    "Squats": Squats,
    "Calf Raises": CalfRaises,
    "Leg Extensions": LegExtensions,
    "Leg Curls": LegCurls,
    "Leg Press": LegPress,
    "Glute Bridges": GluteBridges,
    "Hip Thrusts": HipThrusts,
    "Hip Adductors": HipAdductors,
    "Hip Abductors": HipAbductors,
    "Dumbbell Curls": DumbbellCurls,
    "Cable Curls": CableCurls,
    "Barbell Curls": BarbellCurls,
    "Tricep Extensions": TricepExtensions,
    "Tricep Pushdowns": TricepPushdowns,
    "Tricep Kickbacks": TricepKickbacks,
    "Leg Raises": LegRaises,
    "Crunches": Crunches,
    "Push Ups": PushUps,
    "Pull Ups": PullUps,
    "Rows": Rows,
    "Dumbbell Rows": DumbbellRows,
    "Planks": Planks,
    "Russian Twists": RussianTwists,
    "Dips": Dips,
    "Handstand Exercises": HandstandExercises,
    "Handstand Press Exercises": HandstandPressExercises,
    "Planche Exercises": PlancheExercises,
    "Front Lever Exercises": FrontLeverExercises,
    "Back Lever Exercises": BackLeverExercises,
    "Wrist Exercises": WristExercises,
    "Tibialis Exercises": TibialisExercises,
    "Shrugs": Shrugs,
    "Cardio Exercises": CardioExercises,
};
