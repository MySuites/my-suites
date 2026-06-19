import React, { useState, useEffect } from "react";
import { View, Modal, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, Pressable } from "react-native";
import { useUITheme } from "@mysuite/ui";

interface WorkoutNamePromptProps {
    visible: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    initialName: string;
}

export function WorkoutNamePrompt({
    visible,
    onClose,
    onSave,
    initialName,
}: WorkoutNamePromptProps) {
    const theme = useUITheme();
    const [name, setName] = useState(initialName);

    useEffect(() => {
        if (visible) {
            setName(initialName);
        }
    }, [visible, initialName]);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <Pressable onPress={Keyboard.dismiss} className="flex-1 justify-center items-center bg-black/50 p-6">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="w-full max-w-[320px]"
                >
                    <View className="bg-light dark:bg-dark-elem rounded-3xl p-6 shadow-xl border border-light dark:border-white/10">
                        <Text className="text-xl font-bold mb-2 text-light dark:text-dark text-center">Save Workout</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">Give your workout template a name.</Text>

                        <TextInput
                            key={visible ? 'open' : 'closed'}
                            className="px-4 py-3 border border-light dark:border-white/10 rounded-xl text-[20px] text-light dark:text-dark bg-white dark:bg-black/20 mb-6"
                            defaultValue={initialName}
                            onChangeText={setName}
                            placeholder="Workout Name"
                            placeholderTextColor={theme.icon || "#9ca3af"}
                            autoFocus={true}
                            selectTextOnFocus={true}
                        />

                        <View className="flex-row gap-4 border-t border-light dark:border-white/10 pt-4">
                            <TouchableOpacity
                                className="flex-1 py-3 items-center"
                                onPress={onClose}
                            >
                                <Text className="text-base font-semibold text-primary">Cancel</Text>
                            </TouchableOpacity>

                            <View className="w-[1px] bg-light dark:bg-white/10 my-2" />

                            <TouchableOpacity
                                className="flex-1 py-3 items-center"
                                onPress={() => onSave(name)}
                            >
                                <Text className="text-base font-bold text-primary">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}
