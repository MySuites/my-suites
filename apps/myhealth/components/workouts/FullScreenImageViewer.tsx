import React from 'react';
import { View, Text, Pressable, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@mysuite/ui';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { resolveImageUri } from '../../utils/progressPictures';

interface FullScreenImageViewerProps {
    uri: string | null;
    onClose: () => void;
}

export function FullScreenImageViewer({ uri, onClose }: FullScreenImageViewerProps) {
    const insets = useSafeAreaInsets();

    if (!uri) return null;

    const handleSaveToPhotos = async () => {
        try {
            const resolvedUri = resolveImageUri(uri);
            const fileInfo = await FileSystem.getInfoAsync(resolvedUri);
            if (!fileInfo.exists) {
                Alert.alert("Photo Not Found", "This photo no longer exists on the device. It may have been removed when the app was reinstalled.");
                return;
            }
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "Permission to access the photo library is required to save photos.");
                return;
            }
            await MediaLibrary.saveToLibraryAsync(resolvedUri);
            Alert.alert("Success", "Photo successfully saved to your Photos library!");
        } catch (error) {
            console.error("Failed to save photo to library:", error);
            Alert.alert("Error", "Failed to save photo to your library.");
        }
    };

    return (
        <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999
        }}>
            <Pressable
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                onPress={onClose}
            />

            <Image
                source={{ uri: resolveImageUri(uri) }}
                style={{ width: '100%', height: '80%', resizeMode: 'contain' }}
            />

            {/* Top Action Header */}
            <View style={{
                position: 'absolute',
                top: insets.top + 12,
                left: 0,
                right: 0,
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                zIndex: 100000
            }}>
                <TouchableOpacity
                    onPress={onClose}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <IconSymbol name="xmark" size={20} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSaveToPhotos}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <IconSymbol name="square.and.arrow.down" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.6)', position: 'absolute', bottom: insets.bottom + 20, fontSize: 14 }}>
                Tap anywhere to close
            </Text>
        </View>
    );
}
