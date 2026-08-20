import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useUITheme, IconSymbol } from '@mysuite/ui';
import { Exercise } from '../../utils/workout-api/types';

interface VariationDetailModalProps {
    variation: Exercise | null;
    onClose: () => void;
    onViewFullDetails: (exercise: Exercise) => void;
}

export function VariationDetailModal({ variation, onClose, onViewFullDetails }: VariationDetailModalProps) {
    const theme = useUITheme();
    const text = theme.text as string;
    const cardBackground = (theme.bgDark || theme.bg) as string;
    const primary = theme.primary as string;

    return (
        <Modal transparent visible={!!variation} animationType="fade">
            {variation && (
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 24,
                    zIndex: 1000,
                }}>
                    <Pressable
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={onClose}
                    />
                    <View style={{
                        backgroundColor: cardBackground,
                        borderRadius: 24,
                        padding: 24,
                        width: '100%',
                        maxWidth: 400,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5,
                        position: 'relative',
                    }}>
                        <Pressable
                            onPress={onClose}
                            style={{
                                position: 'absolute',
                                top: 16,
                                left: 16,
                                padding: 8,
                                borderRadius: 9999,
                                zIndex: 10,
                            }}
                        >
                            {({ pressed }) => (
                                <IconSymbol name="xmark" size={20} color={text} style={{ opacity: pressed ? 0.6 : 1 }} />
                            )}
                        </Pressable>

                        <Pressable
                            onPress={() => onViewFullDetails(variation)}
                            style={{
                                position: 'absolute',
                                top: 24,
                                right: 20,
                                zIndex: 10,
                            }}
                        >
                            {({ pressed }) => (
                                <Text style={{ color: primary, fontSize: 13, fontWeight: '600', opacity: pressed ? 0.6 : 1 }}>
                                    View Full Details
                                </Text>
                            )}
                        </Pressable>

                        <View style={{ height: 28 }} />

                        <Text style={{ color: text, fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                            {variation.name}
                        </Text>

                        {variation.difficulty !== undefined && variation.properties?.includes('Bodyweight') && (() => {
                            const diff = Number(variation.difficulty);
                            const maxStars = 10;
                            const fullStars = Math.floor(diff);
                            const hasHalfStar = diff % 1 !== 0;

                            return (
                                <View style={{
                                    flexDirection: 'row',
                                    alignSelf: 'center',
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                    marginBottom: 16,
                                    borderWidth: 1,
                                    borderColor: primary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2
                                }}>
                                    <View style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: primary,
                                        opacity: 0.15,
                                        borderRadius: 12,
                                    }} />

                                    {Array.from({ length: maxStars }).map((_, index) => {
                                        if (index < fullStars) {
                                            return <IconSymbol key={index} name="star.fill" size={12} color={primary} />;
                                        } else if (index === fullStars && hasHalfStar) {
                                            return <IconSymbol key={index} name="star.leadinghalf.filled" size={12} color={primary} />;
                                        }
                                        return null;
                                    })}
                                </View>
                            );
                        })()}

                        {(variation.equipment || variation.movementType || variation.angle || variation.attachment) ? (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                {variation.equipment && variation.equipment !== 'none' && (
                                    <View style={{
                                        backgroundColor: theme.bgLight,
                                        paddingHorizontal: 12,
                                        paddingVertical: 5,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: theme.border
                                    }}>
                                        <Text style={{ color: text, fontSize: 12, textTransform: 'capitalize', fontWeight: '500' }}>
                                            {variation.equipment}
                                        </Text>
                                    </View>
                                )}
                                {variation.angle && (
                                    <View style={{
                                        backgroundColor: theme.bgLight,
                                        paddingHorizontal: 12,
                                        paddingVertical: 5,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: theme.border
                                    }}>
                                        <Text style={{ color: text, fontSize: 12, textTransform: 'capitalize', fontWeight: '500' }}>
                                            {variation.angle}
                                        </Text>
                                    </View>
                                )}
                                {variation.attachment && (
                                    <View style={{
                                        backgroundColor: theme.bgLight,
                                        paddingHorizontal: 12,
                                        paddingVertical: 5,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: theme.border
                                    }}>
                                        <Text style={{ color: text, fontSize: 12, fontWeight: '500' }}>
                                            {variation.attachment}
                                        </Text>
                                    </View>
                                )}
                                {variation.movementType && (
                                    <View style={{
                                        backgroundColor: theme.bgLight,
                                        paddingHorizontal: 12,
                                        paddingVertical: 5,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: theme.border
                                    }}>
                                        <Text style={{ color: text, fontSize: 12, textTransform: 'capitalize', fontWeight: '500' }}>
                                            {variation.movementType}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ) : null}

                        {variation.description ? (
                            <Text style={{ color: text, fontSize: 15, opacity: 0.8, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
                                {variation.description}
                            </Text>
                        ) : (
                            <View style={{ height: 8 }} />
                        )}
                    </View>
                </View>
            )}
        </Modal>
    );
}
