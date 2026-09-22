import { Exercise, SetLog, WorkoutLog } from './workout-api/types';
import { UnitSystem, displayToLb } from './units';

// Mirrors buildWorkoutHistoryCsv's column order in exportWorkoutHistory.ts -
// import accepts exactly what export produces (one row per logged set).
const EXPECTED_HEADER = [
    'Date', 'Workout Name', 'Exercise', 'Set', 'Reps', 'Weight',
    'Weight Unit', 'Duration (s)', 'Distance', 'RPE', 'Notes',
];

export class CsvImportError extends Error {}

// RFC4180-ish parser: handles quoted fields with embedded commas, quotes
// (doubled), and newlines - the inverse of escapeCsvField/toCsvRow.
function parseCsvRows(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i += 1;
                continue;
            }
            field += char;
            i += 1;
            continue;
        }

        if (char === '"') {
            inQuotes = true;
            i += 1;
        } else if (char === ',') {
            row.push(field);
            field = '';
            i += 1;
        } else if (char === '\r') {
            i += 1;
        } else if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            i += 1;
        } else {
            field += char;
            i += 1;
        }
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function parseReps(raw: string): { reps?: number; reps_left?: number; reps_right?: number } {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    if (trimmed.includes('/')) {
        const [left, right] = trimmed.split('/');
        return { reps_left: Number(left) || 0, reps_right: Number(right) || 0 };
    }
    const reps = Number(trimmed);
    return Number.isFinite(reps) ? { reps } : {};
}

function parseNumber(raw: string): number | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
}

function parseDate(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

// Parses a workout history CSV (as produced by buildWorkoutHistoryCsv) back
// into WorkoutLog objects grouped by (date, workout name), in file order.
export function parseWorkoutHistoryCsv(csvText: string, defaultUnitSystem: UnitSystem): WorkoutLog[] {
    const rows = parseCsvRows(csvText);
    if (rows.length === 0) {
        throw new CsvImportError('CSV file is empty');
    }

    const header = rows[0].map((h) => h.trim());
    const isExpectedHeader = EXPECTED_HEADER.every((col, i) => header[i] === col);
    if (!isExpectedHeader) {
        throw new CsvImportError(
            `Unrecognized CSV format. Expected columns: ${EXPECTED_HEADER.join(', ')}`
        );
    }

    const groups = new Map<string, WorkoutLog>();
    let order = 0;
    const orderedKeys: string[] = [];

    for (const cols of rows.slice(1)) {
        if (cols.every((c) => c.trim() === '')) continue;

        const [dateRaw, workoutName, exerciseName, , repsRaw, weightRaw, weightUnitRaw, durationRaw, distanceRaw, rpeRaw, notes] = cols;
        const date = parseDate(dateRaw);
        if (!date || !exerciseName?.trim()) continue;

        const key = `${date}|||${workoutName || 'Untitled Workout'}`;
        let log = groups.get(key);
        if (!log) {
            log = {
                id: `import-${order++}`,
                userId: '',
                workoutDate: date,
                workoutName: workoutName?.trim() || 'Untitled Workout',
                notes: notes?.trim() || undefined,
                exercises: [],
            };
            groups.set(key, log);
            orderedKeys.push(key);
        }

        let exercise = log.exercises?.find((e) => e.name === exerciseName.trim());
        if (!exercise) {
            exercise = {
                id: '',
                name: exerciseName.trim(),
                sets: 0,
                reps: 0,
                completedSets: 0,
                logs: [],
            } as unknown as Exercise;
            log.exercises!.push(exercise);
        }

        const weightVal = parseNumber(weightRaw);
        const unitSystem: UnitSystem = weightUnitRaw?.trim() === 'kg' ? 'metric' : weightUnitRaw?.trim() === 'lb' ? 'imperial' : defaultUnitSystem;

        const setLog: SetLog = {
            ...parseReps(repsRaw || ''),
            ...(weightVal != null ? { weight: displayToLb(weightVal, unitSystem) } : {}),
            ...(parseNumber(durationRaw) != null ? { duration: parseNumber(durationRaw) } : {}),
            ...(parseNumber(distanceRaw) != null ? { distance: parseNumber(distanceRaw) } : {}),
            ...(parseNumber(rpeRaw) != null ? { rpe: parseNumber(rpeRaw) } : {}),
        };

        // A row with no Set number and no measurements is an exercise
        // placeholder (no sets logged), not an actual set - skip it.
        const hasSetData = Object.keys(setLog).length > 0;
        if (hasSetData) {
            exercise.logs!.push(setLog);
        }
    }

    if (orderedKeys.length === 0) {
        throw new CsvImportError('No valid workout rows found in CSV');
    }

    return orderedKeys.map((key) => {
        const log = groups.get(key)!;
        log.exercises = log.exercises!.map((ex) => ({
            ...ex,
            sets: ex.logs?.length || 0,
            completedSets: ex.logs?.length || 0,
        }));
        return log;
    });
}
