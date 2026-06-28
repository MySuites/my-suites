import * as FileSystem from 'expo-file-system/legacy';
import uuid from 'react-native-uuid';
import { DataRepository } from '../providers/DataRepository';

export interface ProgressPictureEntry {
    id: string;
    userId: string;
    imageUri: string;
    date: string; // YYYY-MM-DD
    notes: string;
    createdAt?: string;
    updatedAt?: number;
    syncStatus?: string;
}

export const ProgressPictureService = {
    /**
     * Get all progress pictures for a user.
     */
    async getProgressPictures(userId: string | null): Promise<ProgressPictureEntry[]> {
        return DataRepository.getProgressPictures(userId || 'guest');
    },

    /**
     * Save a new progress picture. Copy the image to the app document directory first.
     */
    async saveProgressPicture(
        userId: string | null,
        tempImageUri: string,
        date: Date,
        notes: string
    ): Promise<ProgressPictureEntry> {
        const dateStr = date.toISOString().split('T')[0];
        const id = uuid.v4() as string;
        
        // Prepare local directory path
        const directory = `${FileSystem.documentDirectory}progress_pictures/`;
        
        // Ensure the directory exists
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }

        const extension = tempImageUri.split('.').pop() || 'jpg';
        const fileName = `${id}.${extension}`;
        const permanentUri = `${directory}${fileName}`;

        // Copy the temporary image to permanent storage
        await FileSystem.copyAsync({
            from: tempImageUri,
            to: permanentUri
        });

        const newPic = {
            id,
            imageUri: permanentUri,
            date: dateStr,
            notes: notes || ""
        };

        await DataRepository.saveProgressPicture(userId || 'guest', newPic);

        return {
            ...newPic,
            userId: userId || 'guest',
            createdAt: new Date().toISOString(),
            syncStatus: 'pending'
        };
    },

    /**
     * Delete a progress picture and its local file.
     */
    async deleteProgressPicture(id: string, imageUri: string): Promise<void> {
        // Delete record from DB
        await DataRepository.deleteProgressPicture(id);

        // Delete the physical file from device storage
        try {
            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(imageUri, { idempotent: true });
            }
        } catch (e) {
            console.error(`Failed to delete local file at ${imageUri}:`, e);
        }
    }
};
