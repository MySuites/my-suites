// Bundles every local table into one importable/inspectable JSON blob for
// the Settings > Data > Export flow. One flat object per data type rather
// than a single array so the file is readable if a user opens it directly.
export interface UserDataExport {
    exportedAt: string;
    savedWorkouts: any[];
    workoutHistory: any[];
    exercises: any[];
    bodyWeightHistory: any[];
    progressPictures: any[];
}

export function buildUserDataExport(data: Omit<UserDataExport, 'exportedAt'>): string {
    const bundle: UserDataExport = {
        exportedAt: new Date().toISOString(),
        ...data,
    };
    return JSON.stringify(bundle, null, 2);
}
