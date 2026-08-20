import { Exercise } from "./providers/WorkoutManagerProvider";

export interface SavedWorkout {
    id: string;
    name: string;
    exercises: Exercise[];
    createdAt: string;
}

