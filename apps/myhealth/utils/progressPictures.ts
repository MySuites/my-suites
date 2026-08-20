import * as FileSystem from 'expo-file-system/legacy';

// Progress-picture URIs are stored relative to the app's document directory
// so they survive reinstalls/path changes; this rebuilds the absolute
// `file://…/progress_pictures/…` path for display. Any other URI (e.g.
// already-absolute HealthKit/GPS-synced photo) passes through unchanged.
export function resolveImageUri(uri: string | null | undefined): string {
    if (!uri) return '';
    if (uri.includes('/progress_pictures/')) {
        const parts = uri.split('/progress_pictures/');
        const filename = parts[parts.length - 1];
        return `${FileSystem.documentDirectory}progress_pictures/${filename}`;
    }
    return uri;
}
