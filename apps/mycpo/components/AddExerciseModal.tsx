import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useUITheme as useTheme } from '@mycsuite/ui';

interface AddExerciseModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (name: string, sets: string, reps: string) => void;
}

export function AddExerciseModal({ visible, onClose, onAdd }: AddExerciseModalProps) {
    const theme = useTheme();
    const styles = makeStyles(theme);

    const [name, setName] = useState("");
    const [sets, setSets] = useState("3");
    const [reps, setReps] = useState("10");

    const handleAdd = () => {
        onAdd(name, sets, reps);
        // Reset fields
        setName("");
        setSets("3");
        setReps("10");
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Add Exercise</Text>
                    <TextInput 
                        placeholder="Name" 
                        placeholderTextColor={theme.icon}
                        value={name} 
                        onChangeText={setName} 
                        style={styles.input} 
                    />
                    <TextInput 
                        placeholder="Sets" 
                        placeholderTextColor={theme.icon}
                        value={sets} 
                        onChangeText={setSets} 
                        style={styles.input} 
                        keyboardType="number-pad" 
                    />
                    <TextInput 
                        placeholder="Reps" 
                        placeholderTextColor={theme.icon}
                        value={reps} 
                        onChangeText={setReps} 
                        style={styles.input} 
                        keyboardType="number-pad" 
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={onClose} style={[styles.controlButton, {marginRight: 8}]}> 
                            <Text style={styles.controlText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAdd} style={styles.controlButtonPrimary}>
                            <Text style={styles.controlTextPrimary}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const makeStyles = (theme: any) =>
    StyleSheet.create({
        modalBackdrop: {
            flex: 1, 
            justifyContent: "center", 
            alignItems: "center", 
            backgroundColor: "rgba(0,0,0,0.5)"
        },
        modalCard: {
            width: "90%", 
            padding: 20, 
            borderRadius: 16, 
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.surface
        },
        modalTitle: {
            fontSize: 20, 
            fontWeight: "700", 
            marginBottom: 16, 
            color: theme.text
        },
        input: {
            borderWidth: 1, 
            borderColor: theme.surface, 
            borderRadius: 8, 
            padding: 12, 
            marginBottom: 12, 
            color: theme.text,
            backgroundColor: theme.surface
        },
        buttonRow: {
            flexDirection: "row", 
            justifyContent: "flex-end",
            marginTop: 8
        },
        controlButton: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: theme.surface, 
            backgroundColor: 'transparent'
        },
        controlButtonPrimary: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8, 
            backgroundColor: theme.primary
        },
        controlText: {
            color: theme.text,
            fontWeight: '600'
        },
        controlTextPrimary: {
            color: '#fff', 
            fontWeight: "700"
        },
    });
