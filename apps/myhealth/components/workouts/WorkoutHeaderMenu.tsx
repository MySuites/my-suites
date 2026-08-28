import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { RaisedCard, IconSymbol, useUITheme } from '@mysuite/ui';

interface WorkoutHeaderMenuProps {
    onEdit: () => void;
    onAddExercise: () => void;
    // Omit to hide the Delete item entirely (e.g. a workout that hasn't
    // been saved yet has nothing to delete).
    onDelete?: () => void;
}

export function WorkoutHeaderMenu({ onEdit, onAddExercise, onDelete }: WorkoutHeaderMenuProps) {
    const theme = useUITheme();
    const [visible, setVisible] = useState(false);
    const [pos, setPos] = useState({ top: 0, right: 0 });
    const triggerRef = useRef<View>(null);
    const { width: SCREEN_WIDTH } = Dimensions.get('window');

    const openMenu = () => {
        triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
            setPos({ top: pageY + height + 4, right: SCREEN_WIDTH - pageX - width });
            setVisible(true);
        });
    };

    return (
        <>
            <View ref={triggerRef as any}>
                <RaisedCard
                    onPress={openMenu}
                    className="w-12 h-12 p-0 rounded-full bg-lighter dark:bg-dark-lighter items-center justify-center"
                    style={{ borderRadius: 9999 }}
                >
                    <IconSymbol name="ellipsis" size={20} color={theme.primary as string} />
                </RaisedCard>
            </View>

            <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                    className="flex-1"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                >
                    <RaisedCard
                        className="absolute w-48 p-1 origin-top-right rounded-xl bg-lighter dark:bg-dark-lighter"
                        style={{
                            top: pos.top,
                            right: pos.right,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            elevation: 5,
                        }}
                    >
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); setVisible(false); onEdit(); }}
                            className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                        >
                            <IconSymbol name="pencil" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                            <Text style={{ color: theme.text as string }} className="font-medium">Edit Workout</Text>
                        </TouchableOpacity>

                        <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); setVisible(false); onAddExercise(); }}
                            className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                        >
                            <IconSymbol name="plus" size={18} color={theme.text as string} style={{ marginRight: 12 }} />
                            <Text style={{ color: theme.text as string }} className="font-medium">Add Exercise</Text>
                        </TouchableOpacity>

                        {onDelete && (
                            <>
                                <View className="h-[1px] bg-black/5 dark:bg-white/5 my-1" />
                                <TouchableOpacity
                                    onPress={(e) => { e.stopPropagation(); setVisible(false); onDelete(); }}
                                    className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                                >
                                    <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} style={{ marginRight: 12 }} />
                                    <Text style={{ color: theme.options?.destructiveColor || '#ff4444' }} className="font-medium">Delete</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </RaisedCard>
                </TouchableOpacity>
            </Modal>
        </>
    );
}
