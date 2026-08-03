import { WorkoutLog } from './workout-api/types';
import { UnitSystem, lbToDisplay, roundForDisplay, weightUnitLabel } from './units';

const CSV_HEADER = [
    'Date',
    'Workout Name',
    'Exercise',
    'Set',
    'Reps',
    'Weight',
    'Weight Unit',
    'Duration (s)',
    'Distance',
    'RPE',
    'Notes',
];

// Quotes any field containing a comma, quote, or newline, doubling internal
// quotes per the CSV spec - values here (names, notes) are free text.
function escapeCsvField(value: string | number | undefined | null): string {
    const str = value == null ? '' : String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCsvRow(fields: (string | number | undefined | null)[]): string {
    return fields.map(escapeCsvField).join(',');
}

// One row per logged set - the most granular record available, and what
// every other export/analysis tool (spreadsheets, other fitness apps)
// expects from a workout CSV.
export function buildWorkoutHistoryCsv(history: WorkoutLog[], unitSystem: UnitSystem): string {
    const unitLabel = weightUnitLabel(unitSystem);
    const rows: string[] = [CSV_HEADER.join(',')];

    for (const log of history) {
        const dateStr = log.workoutDate ? new Date(log.workoutDate).toLocaleDateString() : '';
        const workoutName = log.workoutName || 'Untitled Workout';

        for (const exercise of log.exercises || []) {
            const sets = exercise.logs || [];
            if (sets.length === 0) {
                rows.push(toCsvRow([dateStr, workoutName, exercise.name, '', '', '', '', '', '', '', log.notes]));
                continue;
            }
            sets.forEach((set, index) => {
                const rawWeight = set.weight ?? set.bodyweight;
                const weightDisplay = rawWeight != null
                    ? roundForDisplay(lbToDisplay(rawWeight, unitSystem), unitSystem)
                    : '';
                const reps = set.reps ?? (set.reps_left != null || set.reps_right != null
                    ? `${set.reps_left ?? 0}/${set.reps_right ?? 0}`
                    : '');
                rows.push(toCsvRow([
                    dateStr,
                    workoutName,
                    exercise.name,
                    index + 1,
                    reps,
                    weightDisplay,
                    rawWeight != null ? unitLabel : '',
                    set.duration ?? '',
                    set.distance ?? '',
                    set.rpe ?? '',
                    index === 0 ? log.notes : '',
                ]));
            });
        }
    }

    return rows.join('\n');
}
