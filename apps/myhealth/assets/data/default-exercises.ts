export const BarbellBenchPress = [
    {
        "id": "flat_barbell_bench_press",
        "name": "Flat Barbell Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 3.0,
        "description":
            "Standard horizontal bench press targeting overall chest volume and strength.",
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
        "name": "Incline Smith Machine Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 9.5,
        "nextVariations": [],
    },
    {
        "id": "decline_smith_machine_bench_press",
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
        "name": "Incline Dumbbell Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 10.0,
        "nextVariations": [],
    },
    {
        "id": "decline_dumbbell_bench_press",
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
        "name": "Dumbbell Fly",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 5.5,
    },
    {
        "id": "cable_fly",
        "name": "Cable Fly",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        difficulty: 8.0,
    },
];

export const LatPulldowns = [
    {
        "id": "lat_pulldown",
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
        "name": "Wide Grip Lat Pulldown",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 9.5,
    },
    {
        "id": "close_grip_lat_pulldown",
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
        "name": "Seated Cable Row Wide Grip",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        difficulty: 4.5,
    },
    {
        "id": "seated_cable_row_close_grip",
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
        "name": "Face Pull",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 2.5,
    },
];

export const LateralRaises = [
    {
        "id": "lateral_raise",
        "name": "Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 3.5,
    },
    {
        "id": "cable_lateral_raise",
        "name": "Cable Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 8.5,
    },
    {
        "id": "single_arm_cable_lateral_raise",
        "name": "Single Arm Cable Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 5.0,
    },
    {
        "id": "machine_lateral_raise",
        "name": "Machine Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 2.0,
    },
];

export const FrontRaises = [
    {
        "id": "front_raise",
        "name": "Front Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 2.0,
    },
];

export const ShoulderPress = [
    {
        "id": "shoulder_press",
        "name": "Shoulder Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 2.5,
    },
    {
        "id": "machine_shoulder_press",
        "name": "Machine Shoulder Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 4.5,
    },
    {
        "id": "arnold_press",
        "name": "Arnold Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 1.5,
    },
    {
        "id": "overhead_press",
        "name": "Overhead Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        difficulty: 8.5,
    },
];

export const Deadlifts = [
    {
        "id": "deadlift",
        "name": "Deadlift",
        "type": "Weighted, Reps",
        "muscle_group": "Lower back",
        difficulty: 4.5,
    },
    {
        "id": "romanian_deadlift",
        "name": "Romanian Deadlift",
        "type": "Weighted, Reps",
        "muscle_group": "Hamstrings",
        difficulty: 4.0,
    },
];

export const Squats = [
    {
        "id": "bodyweight_squat",
        "name": "Bodyweight Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 3.0,
        "nextVariations": [
            "lunges",
        ],
    },
    {
        "id": "lunges",
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
        "name": "Dragon Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 7.5,
    },
];

export const CalfRaises = [
    {
        "id": "calf_raise",
        "name": "Calf Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Calves",
        difficulty: 1.5,
    },
    {
        "id": "dumbbell_calf_raise",
        "name": "Dumbbell Calf Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Calves",
        difficulty: 5.5,
    },
    {
        "id": "machine_calf_raise",
        "name": "Machine Calf Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Calves",
        difficulty: 4.5,
    },
];

export const LegExtensions = [
    {
        "id": "leg_extension",
        "name": "Leg Extension",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 9.0,
    },
];

export const LegCurls = [
    {
        "id": "seated_leg_curl",
        "name": "Seated Leg Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Hamstrings",
        difficulty: 3.5,
    },
    {
        "id": "lying_leg_curl",
        "name": "Lying Leg Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Hamstrings",
        difficulty: 8.5,
    },
];

export const LegPress = [
    {
        "id": "leg_press",
        "name": "Leg Press",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 7.0,
    },
    {
        "id": "horizontal_leg_press",
        "name": "Horizontal Leg Press",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 1.5,
    },
];

export const GluteBridges = [
    {
        "id": "glute_bridge",
        "name": "Glute Bridge",
        "type": "Weighted, Reps",
        "muscle_group": "Glutes",
        difficulty: 8.0,
    },
];

export const HipThrusts = [
    {
        "id": "hip_thrust",
        "name": "Hip Thrust",
        "type": "Weighted, Reps",
        "muscle_group": "Glutes",
        difficulty: 9.5,
    },
];

export const HipAdductors = [
    {
        "id": "hip_adductor",
        "name": "Hip Adductor",
        "type": "Weighted, Reps",
        "muscle_group": "Adductors",
        difficulty: 4.0,
    },
];

export const HipAbductors = [
    {
        "id": "hip_abductor",
        "name": "Hip Abductor",
        "type": "Weighted, Reps",
        "muscle_group": "Abductors",
        difficulty: 5.0,
    },
];

export const DumbbellCurls = [
    {
        "id": "dumbbell_curl",
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
        "name": "Incline Dumbbell Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 8.0,
    },
    {
        "id": "hammer_dumbbell_curl",
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
        "name": "Cable Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.5,
    },
    {
        "id": "bayesian_curl",
        "name": "Bayesian Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.0,
    },
];

export const BarbellCurls = [
    {
        "id": "barbell_curl",
        "name": "Barbell Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 4.0,
    },
    {
        "id": "spider_curl",
        "name": "Spider Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.0,
    },
    {
        "id": "barbell_preacher_curl",
        "name": "Barbell Preacher Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 2.5,
    },
    {
        "id": "machine_preacher_curl",
        "name": "Machine Preacher Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        difficulty: 9.0,
    },
];

export const TricepExtensions = [
    {
        "id": "barbell_skullcrusher",
        "name": "Barbell Skullcrusher",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 2.5,
    },
    {
        "id": "dumbbell_skullcrusher",
        "name": "Dumbbell Skullcrusher",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 7.0,
    },
    {
        "id": "overhead_dumbbell_tricep_extension",
        "name": "Overhead Dumbbell Tricep Extension",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 6.0,
    },
    {
        "id": "overhead_cable_tricep_extension",
        "name": "Overhead Cable Tricep Extension",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 5.0,
    },
];

export const TricepPushdowns = [
    {
        "id": "cable_tricep_pushdown",
        "name": "Cable Tricep Pushdown",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 5.5,
    },
    {
        "id": "single_arm_tricep_pushdown",
        "name": "Single-Arm Tricep Pushdown",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 4.5,
    },
];

export const TricepKickbacks = [
    {
        "id": "tricep_kickback",
        "name": "Tricep Kickback",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        difficulty: 1.5,
    },
];

export const LegRaises = [
    {
        "id": "leg_raise",
        "name": "Leg Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 5.0,
    },
    {
        "id": "hanging_leg_raise",
        "name": "Hanging Leg Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 6.5,
    },
    {
        "id": "l-sit_hold",
        "name": "L-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 9.0,
    },
    {
        "id": "v-sit_hold",
        "name": "V-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.5,
    },
    {
        "id": "i-sit_hold",
        "name": "I-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 7.0,
    },
    {
        "id": "manna_hold",
        "name": "Manna Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 8.0,
    },
];

export const Crunches = [
    {
        "id": "crunch",
        "name": "Crunch",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 6.0,
    },
    {
        "id": "cable_crunch",
        "name": "Cable Crunch",
        "type": "Weighted, Reps",
        "muscle_group": "Abdominals",
        difficulty: 4.0,
    },
];

export const PushUps = [
    {
        "id": "wall_push_up",
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
        "name": "Pseudo Planche Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Other",
        difficulty: 4.0,
    },
    {
        "id": "weighted_push_up",
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
        "name": "Weighted Chin-up",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Biceps",
        difficulty: 1.0,
    },
    {
        "id": "weighted_pull_up",
        "name": "Weighted Pull-up",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 7.0,
    },
];

export const Rows = [
    {
        "id": "bodyweight_row",
        "name": "Bodyweight Row",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 6.5,
    },
    {
        "id": "weighted_row",
        "name": "Weighted Row",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 4.5,
    },
];

export const Planks = [
    {
        "id": "plank",
        "name": "Plank",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 9.5,
    },
    {
        "id": "weighted_plank",
        "name": "Weighted Plank",
        "type": "Weighted, Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 6.5,
    },
    {
        "id": "side_plank",
        "name": "Side Plank",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 5.0,
    },
];

export const RussianTwists = [
    {
        "id": "russian_twist",
        "name": "Russian Twist",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 4.0,
    },
];

export const Dips = [
    {
        "id": "bodyweight_dip",
        "name": "Bodyweight Dip",
        "type": "Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 7.5,
    },
    {
        "id": "weighted_dip",
        "name": "Weighted Dip",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 7.5,
    },
];

export const HandstandExercises = [
    {
        "id": "frog_stand",
        "name": "Frog Stand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 4.0,
    },
    {
        "id": "crow_pose",
        "name": "Crow Pose",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 5.0,
    },
    {
        "id": "chest_to_wall_handstand",
        "name": "Chest-to-Wall Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 1.5,
    },
    {
        "id": "back_to_wall_handstand",
        "name": "Back-to-Wall Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 3.5,
    },
    {
        "id": "handstand",
        "name": "Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 7.5,
    },
    {
        "id": "wall_handstand_push_up",
        "name": "Wall Handstand Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 7.0,
    },
    {
        "id": "handstand_push_up",
        "name": "Handstand Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.5,
    },
    {
        "id": "one_arm_handstand",
        "name": "One-Arm Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 6.0,
    },
];

export const HandstandPressExercises = [
    {
        "id": "pike_handstand_press",
        "name": "Pike Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.0,
    },
    {
        "id": "straddle_handstand_press",
        "name": "Straddle Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.0,
    },
    {
        "id": "handstand_press",
        "name": "Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 5.5,
    },
];

export const PlancheExercises = [
    {
        "id": "pseudo_planche_hold",
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
        "name": "Planche Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.0,
    },
    {
        "id": "one_arm_planche",
        "name": "One-Arm Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 9.0,
    },
    {
        "id": "maltese",
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
        "name": "Dragon Maltese",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 8.5,
    },
];

export const FrontLeverExercises = [
    {
        "id": "tuck_front_lever",
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
        "name": "Advanced Tuck Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 7.0,
    },
    {
        "id": "half_lay_front_lever",
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
        "name": "Tuck Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 9.0,
    },
    {
        "id": "advanced_tuck_back_lever",
        "name": "Advanced Tuck Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 4.0,
    },
    {
        "id": "half_lay_back_lever",
        "name": "Half-Lay Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.5,
    },
    {
        "id": "straddle_back_lever",
        "name": "Straddle Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.0,
    },
    {
        "id": "back_lever",
        "name": "Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 1.5,
    },
    {
        "id": "back_lever_pull_up",
        "name": "Back Lever Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Other",
        difficulty: 3.5,
    },
    {
        "id": "back_lever_touch",
        "name": "Back Lever Touch",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 8.0,
    },
    {
        "id": "one_arm_back_lever",
        "name": "One-Arm Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 8.0,
    },
];

export const WristExercises = [
    {
        "id": "dumbbell_wrist_curl",
        "name": "Dumbbell Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        difficulty: 2.0,
    },
    {
        "id": "dumbbell_reverse_wrist_curl",
        "name": "Dumbbell Reverse Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        difficulty: 2.5,
    },
    {
        "id": "barbell_wrist_curl",
        "name": "Barbell Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        difficulty: 3.0,
    },
    {
        "id": "barbell_reverse_wrist_curl",
        "name": "Barbell Reverse Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        difficulty: 3.5,
    },
    {
        "id": "first_knuckle_raise",
        "name": "First Knuckle Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Forearms",
        difficulty: 4.0,
    },
];

export const CardioExercises = [
    {
        "id": "treadmill",
        "name": "Treadmill",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 9.5,
    },
    {
        "id": "elliptical",
        "name": "Elliptical",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 5.5,
    },
    {
        "id": "stair_climber",
        "name": "Stair Climber",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 9.0,
    },
    {
        "id": "rowing_machine",
        "name": "Rowing Machine",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 9.5,
    },
    {
        "id": "bike",
        "name": "Bike",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 6.5,
    },
    {
        "id": "running",
        "name": "Running",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 4.0,
    },
    {
        "id": "cycling",
        "name": "Cycling",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 2.5,
    },
    {
        "id": "swimming",
        "name": "Swimming",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
        difficulty: 8.5,
    },
    {
        "id": "jump_rope",
        "name": "Jump Rope",
        "type": "Duration",
        "muscle_group": "Cardio",
        difficulty: 3.5,
    },
    {
        "id": "jumping_jacks",
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
    ...Planks,
    ...RussianTwists,
    ...Dips,
    ...HandstandExercises,
    ...HandstandPressExercises,
    ...PlancheExercises,
    ...FrontLeverExercises,
    ...BackLeverExercises,
    ...WristExercises,
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
    "Planks": Planks,
    "Russian Twists": RussianTwists,
    "Dips": Dips,
    "Handstand Exercises": HandstandExercises,
    "Handstand Press Exercises": HandstandPressExercises,
    "Planche Exercises": PlancheExercises,
    "Front Lever Exercises": FrontLeverExercises,
    "Back Lever Exercises": BackLeverExercises,
    "Wrist Exercises": WristExercises,
    "Cardio Exercises": CardioExercises,
};
