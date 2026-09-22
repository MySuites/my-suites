import { UserDataExport } from './exportUserData';

export class UserDataImportError extends Error {}

// Parses and shape-validates a file produced by buildUserDataExport
// (Settings > Data > Export Data). Only checks that the five expected
// arrays are present - individual row shape is whatever DataRepository's
// bulk save methods already tolerate (same fields their getters return).
export function parseUserDataExport(jsonText: string): UserDataExport {
    let parsed: any;
    try {
        parsed = JSON.parse(jsonText);
    } catch {
        throw new UserDataImportError('File is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new UserDataImportError('Unrecognized data export format');
    }

    const requiredArrayKeys: (keyof UserDataExport)[] = [
        'savedWorkouts', 'workoutHistory', 'exercises', 'bodyWeightHistory', 'progressPictures',
    ];
    for (const key of requiredArrayKeys) {
        if (!Array.isArray(parsed[key])) {
            throw new UserDataImportError(`Missing or invalid "${key}" in data export`);
        }
    }

    return parsed as UserDataExport;
}
