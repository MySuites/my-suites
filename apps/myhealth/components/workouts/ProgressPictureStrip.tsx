import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { resolveImageUri } from '../../utils/progressPictures';

interface ProgressPictureStripProps {
    imageUrls: string[];
    onSelect: (uri: string) => void;
}

export function ProgressPictureStrip({ imageUrls, onSelect }: ProgressPictureStripProps) {
    if (imageUrls.length === 0) return null;

    return (
        <View style={{ marginBottom: 20 }}>
            <Text className="font-semibold text-light dark:text-dark mb-3 text-lg">Progress Pictures</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
            >
                {imageUrls.map((rawUri: string, idx: number) => {
                    const uri = resolveImageUri(rawUri);
                    return (
                        <Pressable
                            key={idx}
                            onPress={() => onSelect(uri)}
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: 12,
                                overflow: 'hidden',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                            }}
                        >
                            <Image
                                source={{ uri }}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                            />
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}
