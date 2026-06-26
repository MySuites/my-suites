export const EXERCISE_DATA_VERSION = 51;

export const BarbellBenchPress = [
    {
        "id": "bench_press",
        "name": "Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        "secondary_muscles": ["Triceps", "Shoulders"],
        equipment: ["barbell", "dumbbell", "smith machine", "machine", "cable"],
        angle: "flat",
        movementType: "uniform",
        "description":
            "Standard horizontal chest press targeting overall chest volume and strength.",
        "instructions": [
            "Lie flat on the bench with your feet flat on the floor.",
            "Grip the barbell or dumbbells with hands slightly wider than shoulder-width apart.",
            "Unrack the weight or position dumbbells, holding it straight over your chest.",
            "Lower the weight slowly to your chest while inhaling.",
            "Push the weight back up to the starting position while flexing your chest.",
        ],
        "tips": [
            "Keep your feet flat on the floor for maximum stability.",
            "Retract your scapula (shoulder blades) and pin them to the bench.",
            "Control the weight on the descent and touch your lower chest/sternum.",
            "Drive the weight up while keeping your elbows tucked at roughly 45 degrees.",
        ],
        "nextVariations": [],
    },
    {
        "id": "incline_bench_press",
        "name": "Incline Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        equipment: ["barbell", "dumbbell", "smith machine", "machine", "cable"],
        angle: "incline",
        movementType: "uniform",
        "description":
            "Elevated bench angle that biases the upper pectoral muscles.",
        "nextVariations": [],
    },
    {
        "id": "decline_bench_press",
        "name": "Decline Bench Press",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        equipment: ["barbell", "dumbbell", "smith machine", "machine", "cable"],
        angle: "decline",
        movementType: "uniform",
        "description":
            "Lowered bench angle focusing on the lower pectoral muscles and providing a slight mechanical advantage.",
        "nextVariations": [],
    },
];

export const SmithMachineBenchPress: typeof BarbellBenchPress = [];

export const DumbbellBenchPress: typeof BarbellBenchPress = [];

export const ChestFlys = [
    {
        "id": "chest_fly",
        "description":
            "Chest fly targeting the pectoral muscles, which can be done using dumbbells, a machine, or cables.",
        "name": "Chest Fly",
        "type": "Weighted, Reps",
        "muscle_group": "Chest",
        "secondary_muscles": ["Shoulders", "Biceps"],
        equipment: ["dumbbell", "cable", "machine"],
        movementType: "unilateral",
        "nextVariations": [],
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
        "attachment": "Lat Bar",
        "nextVariations": [],
    },
];

export const SeatedRows = [
    {
        "id": "seated_cable_row",
        "description":
            "Seated horizontal pull targeting the middle and upper back using a cable row machine.",
        "name": "Seated Cable Row",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        "attachment": "Close-Grip V-Bar",
        "nextVariations": [],
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
    },
];

export const LateralRaises = [
    {
        "id": "lateral_raise",
        "description":
            "Shoulder raise targeting the lateral deltoids to build shoulder width and roundness, which can be done using dumbbells, cables, or a machine.",
        "name": "Lateral Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        equipment: ["dumbbell", "cable", "machine"],
        movementType: "uniform",
    },
];

export const FrontRaises = [
    {
        "id": "front_raise",
        "description": "Shoulder raise targeting the anterior deltoids.",
        "name": "Front Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
    },
];

export const ShoulderPress = [
    {
        "id": "shoulder_press",
        "description": "Overhead shoulder press targeting the deltoids.",
        "name": "Shoulder Press",
        "type": "Weighted, Reps",
        "muscle_group": "Shoulders",
        equipment: ["dumbbell", "barbell", "machine"],
        movementType: "uniform",
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
    },
    {
        "id": "romanian_deadlift",
        "description":
            "Deadlift variation focusing on the hamstrings and glutes with minimal knee bend.",
        "name": "Romanian Deadlift",
        "type": "Weighted, Reps",
        "muscle_group": "Hamstrings",
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
        difficulty: 1.0,
        "instructions": [
            "Stand with your feet shoulder-width apart and toes pointing slightly outward.",
            "Place your hands on your hips, behind your head, or straight out in front.",
            "Lower your hips as if sitting back into a chair, keeping your knees behind your toes.",
            "Keep your chest up and core engaged.",
            "Return to the standing position by driving through your heels.",
        ],
        "tips": [
            "Keep your heels firmly on the ground throughout the movement.",
            "Push your knees outwards to track inline with your toes.",
            "Maintain a straight, neutral spine and look forward or slightly down.",
            "Descend until your thighs are at least parallel to the floor.",
        ],
        "nextVariations": [
            "sissy_squat",
            "shrimp_squat",
        ],
    },
    {
        "id": "sissy_squat",
        "description": "Quad isolation exercise focusing on knee extension.",
        "name": "Sissy Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 3.5,
    },
    {
        "id": "shrimp_squat",
        "description":
            "Advanced bodyweight unilateral squat holding one leg behind.",
        "name": "Shrimp Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 3.0,
        "nextVariations": [
            "pistol_squat",
        ],
    },
    {
        "id": "pistol_squat",
        "description": "Advanced single-leg bodyweight squat.",
        "name": "Pistol Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 3.5,
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
        difficulty: 5.0,
    },
];

export const WeightedSquats = [
    {
        "id": "weighted_squat",
        "description":
            "Squat variation performed with added weight, which can be done using a barbell, smith machine, hack machine, or pendulum machine.",
        "name": "Weighted Squat",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        equipment: [
            "barbell",
            "dumbbell",
            "smith machine",
            "hack machine",
            "pendulum machine",
        ],
        movementType: "uniform",
    },
];

export const Lunges = [
    {
        "id": "lunges",
        "description":
            "Unilateral leg exercise targeting the quads, glutes, and hamstrings.",
        "name": "Lunges",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 1.0,
        "nextVariations": [],
    },
    {
        "id": "weighted_lunges",
        "description": "Lunges performed with added weight.",
        "name": "Weighted Lunges",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 1.5,
        "nextVariations": [],
    },
];

export const SplitSquats = [
    {
        "id": "split_squat",
        "description":
            "Stationary unilateral squat targeting the quads and glutes.",
        "name": "Split Squat",
        "type": "Bodyweight, Reps",
        "muscle_group": "Quadriceps",
        difficulty: 1.0,
        "nextVariations": [],
    },
    {
        "id": "bulgarian_split_squat",
        "description":
            "Rear-foot elevated split squat targeting the quads and glutes.",
        "name": "Bulgarian Split Squat",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
        "nextVariations": [],
    },
];

export const CalfRaises = [
    {
        "id": "calf_raise",
        "description": "Calf exercise targeting the gastrocnemius muscle.",
        "name": "Calf Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Calves",
    },
    {
        "id": "weighted_calf_raise",
        "description":
            "Calf raise performed with additional weight, which can be done using dumbbells or a machine.",
        "name": "Weighted Calf Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Calves",
        equipment: ["dumbbell", "machine", "barbell"],
        movementType: "unilateral",
    },
];

export const LegExtensions = [
    {
        "id": "leg_extension",
        "description": "Machine isolation exercise targeting the quadriceps.",
        "name": "Leg Extension",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
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
    },
    {
        "id": "lying_leg_curl",
        "description":
            "Machine isolation exercise targeting the hamstrings while lying prone.",
        "name": "Lying Leg Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Hamstrings",
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
    },
    {
        "id": "horizontal_leg_press",
        "description":
            "Horizontal leg press machine targeting the quads and glutes.",
        "name": "Horizontal Leg Press",
        "type": "Weighted, Reps",
        "muscle_group": "Quadriceps",
    },
];

export const GluteBridges = [
    {
        "id": "glute_bridge",
        "description": "Glute isolation exercise performed on the floor.",
        "name": "Glute Bridge",
        "type": "Weighted, Reps",
        "muscle_group": "Glutes",
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
    },
];

export const HipAdductors = [
    {
        "id": "hip_adductor",
        "description": "Machine exercise targeting the inner thigh muscles.",
        "name": "Hip Adductor",
        "type": "Weighted, Reps",
        "muscle_group": "Adductors",
    },
];

export const HipAbductors = [
    {
        "id": "hip_abductor",
        "description": "Machine exercise targeting the outer glute muscles.",
        "name": "Hip Abductor",
        "type": "Weighted, Reps",
        "muscle_group": "Abductors",
    },
];

export const BicepCurls = [
    {
        "id": "bicep_curl",
        "description":
            "Standard curl targeting the biceps brachii, which can be performed using dumbbells, barbell, or cables.",
        "name": "Bicep Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        equipment: ["dumbbell", "barbell", "cable"],
        movementType: "unilateral",
        "nextVariations": [],
    },
    {
        "id": "incline_curl",
        "description":
            "Incline bench curl for a deep stretch on the biceps, which can be done using dumbbells or cables.",
        "name": "Incline Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        equipment: ["dumbbell", "cable"],
        movementType: "unilateral",
    },
    {
        "id": "hammer_curl",
        "description":
            "Curl with a neutral grip targeting the brachialis and brachioradialis, which can be done using dumbbells or cables.",
        "name": "Hammer Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        equipment: ["dumbbell", "cable"],
        movementType: "unilateral",
        "nextVariations": [],
    },
    {
        "id": "reverse_curl",
        "description":
            "Overhand grip curl targeting the forearms and brachialis, which can be done using a barbell, dumbbells, or cables.",
        "name": "Reverse Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        equipment: ["barbell", "dumbbell", "cable"],
        movementType: "unilateral",
        "nextVariations": [],
    },
    {
        "id": "bayesian_curl",
        "description":
            "Cable curl facing away from the machine to stretch the long head of the bicep.",
        "name": "Bayesian Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        equipment: ["cable"],
        movementType: "unilateral",
    },
    {
        "id": "spider_curl",
        "description": "Incline bench curl facing down to isolate the biceps.",
        "name": "Spider Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        equipment: ["barbell", "dumbbell"],
        movementType: "uniform",
    },
    {
        "id": "preacher_curl",
        "description":
            "Bicep curl performed on a preacher bench to prevent momentum, which can be done using a barbell, dumbbells, or a machine.",
        "name": "Preacher Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Biceps",
        equipment: ["barbell", "dumbbell", "machine"],
        movementType: "uniform",
    },
];

export const TricepExtensions = [
    {
        "id": "skullcrusher",
        "description":
            "Tricep extension performed lying on a bench, which can be done using a barbell or dumbbells.",
        "name": "Skullcrusher",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        equipment: ["barbell", "dumbbell"],
        movementType: "uniform",
    },
    {
        "id": "overhead_tricep_extension",
        "description":
            "Overhead tricep extension targeting the long head of the triceps, which can be done using a dumbbell or cables.",
        "name": "Overhead Tricep Extension",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
        equipment: ["dumbbell", "cable"],
        movementType: "unilateral",
    },
];

export const TricepPushdowns = [
    {
        "id": "cable_tricep_pushdown",
        "description": "Tricep pushdown using a cable machine.",
        "name": "Cable Tricep Pushdown",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
    },
    {
        "id": "single_arm_tricep_pushdown",
        "description": "One-arm tricep pushdown using a cable machine.",
        "name": "Single-Arm Tricep Pushdown",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
    },
];

export const TricepKickbacks = [
    {
        "id": "tricep_kickback",
        "description": "Dumbbell tricep extension leaning forward.",
        "name": "Tricep Kickback",
        "type": "Weighted, Reps",
        "muscle_group": "Triceps",
    },
];

export const LegRaises = [
    {
        "id": "leg_raise",
        "description": "Core exercise lifting the legs from a lying position.",
        "name": "Leg Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 1.0,
    },
    {
        "id": "hanging_leg_raise",
        "description":
            "Core exercise lifting the legs while hanging from a bar.",
        "name": "Hanging Leg Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 1.5,
    },
    {
        "id": "l-sit_hold",
        "description": "Isometric core and arm hold in an L shape.",
        "name": "L-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 2.5,
        "nextVariations": [
            "v-sit_hold",
            "straddle_l-sit_hold",
        ],
    },
    {
        "id": "straddle_l-sit_hold",
        "description": "Isometric core and arm hold in a straddle L shape.",
        "name": "Straddle L-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.0,
    },
    {
        "id": "v-sit_hold",
        "description": "Isometric core and arm hold in a V shape.",
        "name": "V-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 4.5,
        "nextVariations": [
            "i-sit_hold",
        ],
    },
    {
        "id": "i-sit_hold",
        "description": "Advanced isometric hold in an I shape.",
        "name": "I-Sit Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 6.0,
        "nextVariations": [
            "manna_hold",
        ],
    },
    {
        "id": "manna_hold",
        "description":
            "Elite isometric gymnastics hold with hips pushed forward over the hands.",
        "name": "Manna Hold",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 9.5,
    },
];

export const Crunches = [
    {
        "id": "crunch",
        "description": "Abdominal crunch targeting the upper abs.",
        "name": "Crunch",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 1.0,
    },
    {
        "id": "cable_crunch",
        "description": "Kneeling cable crunch targeting the abdominal muscles.",
        "name": "Cable Crunch",
        "type": "Weighted, Reps",
        "muscle_group": "Abdominals",
    },
];

export const PushUps = [
    {
        "id": "wall_push_up",
        "description": "Push-up variation performed against a wall.",
        "name": "Wall Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 0.5,
        "nextVariations": [
            "incline_push_up",
            "knee_push_up",
        ],
    },
    {
        "id": "incline_push_up",
        "description": "Push-up variation with hands elevated.",
        "name": "Incline Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 1.0,
        "nextVariations": [
            "push_up",
        ],
    },
    {
        "id": "knee_push_up",
        "description": "Push-up variation performed on the knees.",
        "name": "Knee Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 1.5,
        "nextVariations": [
            "push_up",
        ],
    },
    {
        "id": "push_up",
        "description": "Standard bodyweight chest and arm exercise.",
        "name": "Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 2.0,
        "nextVariations": [
            "decline_push_up",
            "military_push_up",
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
        difficulty: 2.5,
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
        difficulty: 3.0,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
    {
        "id": "military_push_up",
        "description": "Push-up with elbows tucked to the sides.",
        "name": "Military Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 2.5,
        "nextVariations": [
            "diamond_push_up",
            "pseudo_planche_push_up",
        ],
    },
    {
        "id": "wide_push_up",
        "description": "Push-up with hands placed wide apart.",
        "name": "Wide Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 2.0,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
    {
        "id": "pike_push_up",
        "description": "Bodyweight shoulder exercise in a pike position.",
        "name": "Pike Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 3.0,
        "nextVariations": [
            "pseudo_planche_push_up",
            "wall_handstand_push_up",
        ],
    },
    {
        "id": "pseudo_planche_push_up",
        "description":
            "Push-up leaning forward to target the shoulders and chest.",
        "name": "Pseudo Planche Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Other",
        difficulty: 3.5,
    },
    {
        "id": "weighted_push_up",
        "description": "Push-up performed with added weight.",
        "name": "Weighted Push-up",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Chest",
        difficulty: 2.5,
        "nextVariations": [
            "pseudo_planche_push_up",
        ],
    },
];

export const PullUps = [
    {
        "id": "scapular_pull_up",
        "description":
            "Pull-up variation focusing on scapular retraction and depression, without bending the elbows.",
        "name": "Scapular Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 1.5,
        "nextVariations": [],
    },
    {
        "id": "assisted_pull_up",
        "description":
            "Pull-up variation using assistance from a band or partner to complete the movement.",
        "name": "Assisted Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 2.0,
        "nextVariations": [],
    },
    {
        "id": "negative_pull_up",
        "description":
            "Pull-up variation focusing on the eccentric (lowering) phase. Start at the top of the pull-up and slowly lower yourself to the bottom.",
        "name": "Negative Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 2.0,
        "nextVariations": [],
    },
    {
        "id": "chin_up",
        "description":
            "Pull-up variation with an underhand grip targeting the lats and biceps.",
        "name": "Chin-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Biceps",
        difficulty: 2.5,
        "nextVariations": [],
    },
    {
        "id": "pull_up",
        "description":
            "Upper body pulling exercise targeting the lats and back.",
        "name": "Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 3.0,
        "nextVariations": [
            "wide_pull_up",
        ],
    },
    {
        "id": "wide_pull_up",
        "description":
            "Upper body pulling exercise targeting the lats and back.",
        "name": "Wide Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 3.5,
        "nextVariations": [
            "archer_pull_up",
            "typewriter_pull_up",
        ],
    },
    {
        "id": "archer_pull_up",
        "description":
            "Pull-up variation with one arm reaching out to the side.",
        "name": "Archer Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 5.0,
        "nextVariations": [],
    },
    {
        "id": "typewriter_pull_up",
        "description":
            "Pull-up variation with one arm sliding across the bar to the other side.",
        "name": "Typewriter Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 5.5,
        "nextVariations": [],
    },
    {
        "id": "explosive_pull_up",
        "description":
            "Pull-up variation using explosive force to pull the body as high as possible.",
        "name": "Explosive Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 4.0,
        "nextVariations": [],
    },
    {
        "id": "muscle_up",
        "description":
            "Combination of a pull-up and a dip, using explosive force to pull the body over the bar and into a dip position.",
        "name": "Muscle-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 5.0,
        "nextVariations": [],
    },
    {
        "id": "weighted_chin_up",
        "description": "Chin-up performed with added weight.",
        "name": "Weighted Chin-up",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Biceps",
        difficulty: 3.0,
    },
    {
        "id": "weighted_pull_up",
        "description": "Pull-up performed with added weight.",
        "name": "Weighted Pull-up",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 3.5,
    },
];

export const Rows = [
    {
        "id": "bodyweight_row",
        "description": "Horizontal pull using bodyweight on rings or a bar.",
        "name": "Bodyweight Row",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 1.5,
    },
    {
        "id": "weighted_row",
        "description": "Bodyweight row performed with added weight.",
        "name": "Weighted Row",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 2.0,
    },
];

export const DumbbellRows = [
    {
        "id": "dumbbell_row",
        "name": "Dumbbell Row",
        "type": "Weighted, Reps",
        "muscle_group": "Lats",
        "description":
            "One-arm dumbbell row targeting the lats and upper back.",
    },
];

export const Planks = [
    {
        "id": "plank",
        "description": "Isometric core stability exercise.",
        "name": "Plank",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 1.0,
    },
    {
        "id": "weighted_plank",
        "description": "Plank performed with added weight.",
        "name": "Weighted Plank",
        "type": "Weighted, Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 1.5,
    },
    {
        "id": "side_plank",
        "description": "Isometric core exercise targeting the obliques.",
        "name": "Side Plank",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 1.5,
    },
];

export const RussianTwists = [
    {
        "id": "russian_twist",
        "description": "Rotational core exercise.",
        "name": "Russian Twist",
        "type": "Bodyweight, Reps",
        "muscle_group": "Abdominals",
        difficulty: 1.5,
    },
];

export const Dips = [
    {
        "id": "bodyweight_dip",
        "description": "Tricep and lower chest exercise on parallel bars.",
        "name": "Bodyweight Dip",
        "type": "Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 3.0,
    },
    {
        "id": "weighted_dip",
        "description": "Bodyweight dip performed with added weight.",
        "name": "Weighted Dip",
        "type": "Weighted, Bodyweight, Reps",
        "muscle_group": "Triceps",
        difficulty: 3.5,
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
        difficulty: 1.5,
        "nextVariations": [
            "crow_pose",
        ],
    },
    {
        "id": "crow_pose",
        "description": "Yoga arm balance balancing knees on the triceps.",
        "name": "Crow Pose",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 2.0,
        "nextVariations": [
            "chest_to_wall_handstand",
        ],
    },
    {
        "id": "chest_to_wall_handstand",
        "description": "Handstand hold facing the wall to practice form.",
        "name": "Chest-to-Wall Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 2.5,
        "nextVariations": [
            "back_to_wall_handstand",
        ],
    },
    {
        "id": "back_to_wall_handstand",
        "description": "Handstand hold facing away from the wall.",
        "name": "Back-to-Wall Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 2.5,
        "nextVariations": [
            "handstand",
        ],
    },
    {
        "id": "handstand",
        "description": "Free-standing handstand hold balancing on the hands.",
        "name": "Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 3.5,
        "nextVariations": [
            "one_arm_handstand",
            "pike_handstand_press",
        ],
    },
    {
        "id": "wall_handstand_push_up",
        "description": "Handstand push-up performed against a wall.",
        "name": "Wall Handstand Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 3.5,
        "nextVariations": [
            "handstand_push_up",
        ],
    },
    {
        "id": "handstand_push_up",
        "description": "Free-standing handstand push-up.",
        "name": "Handstand Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 4.5,
    },
    {
        "id": "one_arm_handstand",
        "description": "Elite handstand hold balancing on one hand.",
        "name": "One-Arm Handstand",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 9.0,
    },
];

export const HandstandPressExercises = [
    {
        "id": "tuck_handstand_press",
        "description": "Pressing into a handstand from a tuck position.",
        "name": "Tuck Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 7.5,
        "nextVariations": [
            "pike_handstand_press",
        ],
    },
    {
        "id": "pike_handstand_press",
        "description": "Pressing into a handstand from a pike position.",
        "name": "Pike Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 7.5,
        "nextVariations": [],
    },
    {
        "id": "wall_straddle_handstand_press",
        "description":
            "Pressing into a handstand from a straddle position against a wall.",
        "name": "Wall Straddle Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 6.0,
        "nextVariations": [
            "straddle_handstand_press",
        ],
    },
    {
        "id": "straddle_handstand_press",
        "description": "Pressing into a handstand from a straddle position.",
        "name": "Straddle Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 7.5,
        "nextVariations": [
            "handstand_press",
        ],
    },
    {
        "id": "bent_arm_handstand_press",
        "description": "Pressing into a handstand from a bent arm position.",
        "name": "Bent Arm Handstand Press",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 7.5,
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
        difficulty: 2.5,
        "nextVariations": [
            "toe_assisted_tuck_planche",
            "bent_arm_planche_lean",
        ],
    },
    {
        "id": "toe_assisted_tuck_planche",
        "description": "Tuck planche hold with assistance from your toes.",
        "name": "Toe Assisted Tuck Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 4.0,
        "nextVariations": [
            "tuck_planche",
        ],
    },
    {
        "id": "tuck_planche",
        "description": "Isometric arm support hold with knees tucked.",
        "name": "Tuck Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 4.5,
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
        "description": "Isometric planche hold with legs straddled.",
        "name": "Straddle Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 8.0,
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
        difficulty: 9.0,
        "nextVariations": [
            "planche_push_up",
            "one_arm_planche",
            "maltese",
        ],
    },
    {
        "id": "planche_push_up",
        "description": "Push-up performed in a planche position.",
        "name": "Planche Push-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Shoulders",
        difficulty: 9.5,
    },
    {
        "id": "one_arm_planche",
        "description": "Planche hold supported on a single arm.",
        "name": "One-Arm Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 10.0,
    },
    {
        "id": "maltese",
        "description": "Elite wide-arm planche hold.",
        "name": "Maltese",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 9.5,
        "nextVariations": [
            "dragon_maltese",
        ],
    },
    {
        "id": "dragon_maltese",
        "description": "Advanced wide-arm planche hold variation.",
        "name": "Dragon Maltese",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 10.0,
    },
    {
        "id": "bent_arm_planche_lean",
        "description":
            "Isometric lean with bent arms, mimicking the planche position.",
        "name": "Bent Arm Planche Lean",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 4.0,
        "nextVariations": [
            "bent_arm_planche",
        ],
    },
    {
        "id": "bent_arm_planche",
        "description":
            "Bent arm planche hold with body parallel to the ground.",
        "name": "Bent Arm Planche",
        "type": "Bodyweight, Duration",
        "muscle_group": "Shoulders",
        difficulty: 5.5,
        "nextVariations": [],
    },
];

export const FrontLeverExercises = [
    {
        "id": "tuck_front_lever",
        "description": "Isometric back pull with knees tucked.",
        "name": "Tuck Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 4.5,
        "nextVariations": [
            "advanced_tuck_front_lever",
        ],
    },
    {
        "id": "advanced_tuck_front_lever",
        "description": "Isometric back pull with back flat and knees tucked.",
        "name": "Advanced Tuck Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 5.0,
        "nextVariations": [
            "half_lay_front_lever",
        ],
    },
    {
        "id": "half_lay_front_lever",
        "description":
            "Isometric front lever with hips extended and knees bent.",
        "name": "Half-Lay Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 6.0,
        "nextVariations": [
            "straddle_front_lever",
        ],
    },
    {
        "id": "straddle_front_lever",
        "description": "Isometric front lever with legs straddled.",
        "name": "Straddle Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 6.5,
        "nextVariations": [
            "front_lever",
        ],
    },
    {
        "id": "front_lever",
        "description": "Full isometric back hold parallel to the ground.",
        "name": "Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 7.0,
        "nextVariations": [
            "front_lever_pull_up",
            "one_arm_front_lever",
        ],
    },
    {
        "id": "front_lever_pull_up",
        "description": "Pull-up performed in a front lever position.",
        "name": "Front Lever Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Lats",
        difficulty: 7.5,
        "nextVariations": [
            "front_lever_touch",
        ],
    },
    {
        "id": "front_lever_touch",
        "description": "Pulling the front lever to touch the bar.",
        "name": "Front Lever Touch",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 8.0,
    },
    {
        "id": "one_arm_front_lever",
        "description": "Front lever hold supported on a single arm.",
        "name": "One-Arm Front Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Lats",
        difficulty: 9.5,
    },
];

export const BackLeverExercises = [
    {
        "id": "tuck_back_lever",
        "description": "Gymnastic hold facing downward with knees tucked.",
        "name": "Tuck Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.0,
        "nextVariations": [
            "advanced_tuck_back_lever",
        ],
    },
    {
        "id": "advanced_tuck_back_lever",
        "description": "Gymnastic hold facing downward with back flat.",
        "name": "Advanced Tuck Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 3.5,
        "nextVariations": [
            "straddle_back_lever",
        ],
    },
    {
        "id": "straddle_back_lever",
        "description": "Back lever hold with legs straddled.",
        "name": "Straddle Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 4.0,
        "nextVariations": [
            "back_lever",
        ],
    },
    {
        "id": "back_lever",
        "description": "Full back lever hold parallel to the ground.",
        "name": "Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Abdominals",
        difficulty: 4.5,
        "nextVariations": [
            "back_lever_pull_up",
            "one_arm_back_lever",
        ],
    },
    {
        "id": "back_lever_pull_up",
        "description": "Pull-up performed in a back lever position.",
        "name": "Back Lever Pull-up",
        "type": "Bodyweight, Reps",
        "muscle_group": "Other",
        difficulty: 6.0,
        "nextVariations": [
            "back_lever_touch",
        ],
    },
    {
        "id": "back_lever_touch",
        "description": "Pulling the back lever to touch the bar.",
        "name": "Back Lever Touch",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 6.5,
    },
    {
        "id": "one_arm_back_lever",
        "description": "Back lever hold supported on a single arm.",
        "name": "One-Arm Back Lever",
        "type": "Bodyweight, Duration",
        "muscle_group": "Other",
        difficulty: 8.0,
    },
];

export const WristExercises = [
    {
        "id": "wrist_curl",
        "description":
            "Forearm curl targeting the wrist flexors, which can be done using dumbbells or a barbell.",
        "name": "Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        equipment: ["barbell", "dumbbell"],
        movementType: "uniform",
    },
    {
        "id": "reverse_wrist_curl",
        "description":
            "Forearm curl targeting the wrist extensors, which can be done using dumbbells or a barbell.",
        "name": "Reverse Wrist Curl",
        "type": "Weighted, Reps",
        "muscle_group": "Forearms",
        equipment: ["barbell", "dumbbell"],
        movementType: "uniform",
    },

    {
        "id": "first_knuckle_raise",
        "description":
            "Grip strength exercise raising the hand onto the knuckles.",
        "name": "First Knuckle Raise",
        "type": "Bodyweight, Reps",
        "muscle_group": "Forearms",
        difficulty: 1.0,
    },
];

export const TibialisExercises = [
    {
        "id": "tibialis_raise",
        "name": "Tibialis Raise",
        "type": "Weighted, Reps",
        "muscle_group": "Tibialis",
        "description":
            "Exercise to isolate the tibialis anterior muscle on the front of the shin.",
    },
];

export const Shrugs = [
    {
        "id": "shrug",
        "description":
            "Shrug targeting the upper trapezius muscles, which can be done using dumbbells or a barbell.",
        "name": "Shrug",
        "type": "Weighted, Reps",
        "muscle_group": "Traps",
        equipment: ["barbell", "dumbbell"],
        movementType: "uniform",
    },
];

export const CardioExercises = [
    {
        "id": "treadmill",
        "description": "Cardio walking or running on a treadmill.",
        "name": "Treadmill",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "elliptical",
        "description": "Low-impact cardio exercise on an elliptical machine.",
        "name": "Elliptical",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "stair_climber",
        "description": "Cardio climbing exercise on a stair machine.",
        "name": "Stair Climber",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "rowing_machine",
        "description": "Full body cardio and pulling exercise on a rower.",
        "name": "Rowing Machine",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "bike",
        "description": "Stationary cycling cardio exercise.",
        "name": "Bike",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "running",
        "description": "Outdoor or indoor running cardio exercise.",
        "name": "Running",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "cycling",
        "description": "Outdoor or indoor cycling cardio exercise.",
        "name": "Cycling",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "swimming",
        "description": "Full body pool swimming cardio exercise.",
        "name": "Swimming",
        "type": "Distance, Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "jump_rope",
        "description": "High intensity jumping cardio exercise.",
        "name": "Jump Rope",
        "type": "Duration",
        "muscle_group": "Cardio",
    },
    {
        "id": "jumping_jacks",
        "description": "Bodyweight jumping cardio exercise.",
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
    ...WeightedSquats,
    ...Lunges,
    ...SplitSquats,
    ...CalfRaises,
    ...LegExtensions,
    ...LegCurls,
    ...LegPress,
    ...GluteBridges,
    ...HipThrusts,
    ...HipAdductors,
    ...HipAbductors,
    ...BicepCurls,
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
    "Bench Press": BarbellBenchPress,
    "Chest Flys": ChestFlys,
    "Lat Pulldowns": LatPulldowns,
    "Seated Rows": SeatedRows,
    "Face Pulls": FacePulls,
    "Lateral Raises": LateralRaises,
    "Front Raises": FrontRaises,
    "Shoulder Press": ShoulderPress,
    "Deadlifts": Deadlifts,
    "Squats": Squats,
    "Weighted Squats": WeightedSquats,
    "Lunges": Lunges,
    "Split Squats": SplitSquats,
    "Calf Raises": CalfRaises,
    "Leg Extensions": LegExtensions,
    "Leg Curls": LegCurls,
    "Leg Press": LegPress,
    "Glute Bridges": GluteBridges,
    "Hip Thrusts": HipThrusts,
    "Hip Adductors": HipAdductors,
    "Hip Abductors": HipAbductors,
    "Bicep Curls": BicepCurls,
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
