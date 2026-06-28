import React, { useState } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    Alert,
    ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '@mysuite/auth';
import { RaisedCard, useUITheme, IconSymbol, useToast } from '@mysuite/ui';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ProgressPictureService } from '../../services/ProgressPictureService';

export default function AddProgressPictureScreen() {
    const { user } = useAuth();
    const theme = useUITheme();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();

    const [tempPhotoUris, setTempPhotoUris] = useState<string[]>([]);
    const [photoDate, setPhotoDate] = useState<Date>(new Date());
    const [photoNotes, setPhotoNotes] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Camera roll access is needed to select progress pictures.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            allowsEditing: false, // Must be false for multiple selection to work
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uris = result.assets.map(asset => asset.uri);
            setTimeout(() => {
                setTempPhotoUris(prev => [...prev, ...uris]);
            }, 100);
        }
    };

    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Camera access is needed to take progress pictures.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            setTimeout(() => {
                setTempPhotoUris(prev => [...prev, uri]);
            }, 100);
        }
    };

    const handleSave = async () => {
        if (tempPhotoUris.length === 0) {
            Alert.alert('Missing Image', 'Please take or select at least one photo first.');
            return;
        }

        setIsSaving(true);
        try {
            for (const uri of tempPhotoUris) {
                await ProgressPictureService.saveProgressPicture(
                    user?.id || null,
                    uri,
                    photoDate,
                    photoNotes
                );
            }
            showToast({ message: `Successfully saved ${tempPhotoUris.length} progress picture(s)!`, type: 'success' });
            router.back();
        } catch (e) {
            console.error('Failed to save pictures:', e);
            showToast({ message: 'Failed to save progress picture(s)', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader
                title="Add Progress Picture"
                leftAction={
                    <RaisedCard
                        onPress={() => router.back()}
                        className="w-12 p-0 rounded-full items-center justify-center bg-lighter dark:bg-dark"
                        style={{ borderRadius: 9999 }}
                    >
                        <IconSymbol name="chevron.left" size={24} color={theme.primary} />
                    </RaisedCard>
                }
            />

            <ScrollView
                contentContainerStyle={{
                    padding: 20,
                    paddingTop: insets.top + 80,
                    paddingBottom: insets.bottom + 40,
                }}
            >
                {/* Photo Picker */}
                <View style={{ marginBottom: 32 }}>
                    {tempPhotoUris.length > 0 ? (
                        <View>
                            <Text className="text-sm font-bold text-light dark:text-dark mb-3">
                                Selected Photos ({tempPhotoUris.length})
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 16 }}>
                                {tempPhotoUris.map((uri, index) => (
                                    <View key={index} style={{ width: 120, height: 160, marginRight: 12, position: 'relative', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                                        <Image
                                            source={{ uri }}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="cover"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setTempPhotoUris(prev => prev.filter((_, i) => i !== index))}
                                            style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <IconSymbol name="xmark" size={12} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    style={{ width: 120, height: 160, borderWidth: 2, borderStyle: 'dashed', borderColor: theme.border || '#9ca3af', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bgLight || '#f9fafb' }}
                                >
                                    <IconSymbol name="plus" size={24} color={theme.textMuted} />
                                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4, fontWeight: '600' }}>Add More</Text>
                                </TouchableOpacity>
                            </ScrollView>
                            
                            {/* Quick options to add more */}
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={handleTakePhoto}
                                    style={{ flex: 1, borderWidth: 1, borderColor: theme.border || '#9ca3af', paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>Take Another</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    style={{ flex: 1, borderWidth: 1, borderColor: theme.border || '#9ca3af', paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>Choose More</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <View style={{ width: 256, height: 320, borderWidth: 2, borderStyle: 'dashed', borderColor: theme.border || '#9ca3af', borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bgLight || '#f9fafb' }}>
                                <IconSymbol
                                    name="photo.fill"
                                    size={48}
                                    color={theme.textMuted}
                                    style={{ marginBottom: 16 }}
                                />
                                <TouchableOpacity
                                    onPress={handleTakePhoto}
                                    style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 9999, marginBottom: 12 }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Take Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handlePickImage}>
                                    <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>
                                        Choose from Library
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Date */}
                <Text className="text-sm font-bold text-light dark:text-dark mb-2">Photo Date</Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-gray-100 dark:bg-dark-light p-4 rounded-xl flex-row justify-between items-center mb-6"
                >
                    <Text className="text-light dark:text-dark font-medium">
                        {photoDate.toLocaleDateString()}
                    </Text>
                    <IconSymbol name="calendar" size={20} color={theme.textMuted} />
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={photoDate}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(_event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setPhotoDate(selectedDate);
                        }}
                    />
                )}

                {/* Notes */}
                <Text className="text-sm font-bold text-light dark:text-dark mb-2">Notes (optional)</Text>
                <TextInput
                    placeholder="e.g. Morning check-in, cold start, 76kg"
                    placeholderTextColor={theme.textMuted}
                    value={photoNotes}
                    onChangeText={setPhotoNotes}
                    multiline
                    numberOfLines={3}
                    className="bg-gray-100 dark:bg-dark-light p-4 rounded-xl text-light dark:text-dark text-sm min-h-[80px] mb-8"
                    style={{ textAlignVertical: 'top' }}
                />

                {/* Save Button */}
                <TouchableOpacity
                    disabled={tempPhotoUris.length === 0 || isSaving}
                    onPress={handleSave}
                    style={{
                        backgroundColor: tempPhotoUris.length > 0 && !isSaving ? theme.primary : (theme.bgLight || '#eaeaea'),
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: 'center',
                    }}
                    testID="save-picture-btn"
                >
                    {isSaving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text
                            style={{
                                color: tempPhotoUris.length > 0 ? '#fff' : theme.textMuted,
                                fontWeight: '700',
                                fontSize: 16,
                            }}
                        >
                            Save Progress {tempPhotoUris.length > 1 ? `Photos (${tempPhotoUris.length})` : 'Photo'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
