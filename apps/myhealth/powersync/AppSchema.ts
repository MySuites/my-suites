import { column, Schema, Table } from "@powersync/react-native";

export const AppSchema = new Schema({
    workouts: new Table({
        name: column.text,
        user_id: column.text,
        exercises: column.text,
        created_at: column.text,
        updated_at: column.text,
    }),
    workout_logs: new Table({
        user_id: column.text,
        workout_id: column.text,
        workout_name: column.text,
        workout_time: column.text,
        duration: column.integer,
        note: column.text,
        created_at: column.text,
        updated_at: column.text,
    }),
    set_logs: new Table({
        user_id: column.text,
        workout_log_id: column.text,
        exercise_id: column.text,
        weight: column.real,
        reps: column.integer,
        bodyweight: column.real,
        duration: column.integer,
        distance: column.real,
        created_at: column.text,
        details: column.text,
    }),
    exercises: new Table({
        name: column.text,
        user_id: column.text,
        category: column.text,
        muscle_group: column.text,
        created_at: column.text,
    }),
    body_measurements: new Table({
        user_id: column.text,
        weight: column.real,
        date: column.text,
        created_at: column.text,
        updated_at: column.text,
    }),
});
