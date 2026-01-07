import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';
import DateTimePicker from '@react-native-community/datetimepicker';

interface WeightLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number, date: Date) => void;
}

export function WeightLogModal({ visible, onClose, onSave }: WeightLogModalProps) {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const theme = useUITheme();

  const handleSave = () => {
    const numericWeight = parseFloat(weight);
    if (!isNaN(numericWeight)) {
      onSave(numericWeight, date);
      setWeight('');
      setDate(new Date()); // Reset to today for next time
      onClose();
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
            {/* Closes the modal when user taps outside of the modal */}
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="absolute inset-0" />
            </TouchableWithoutFeedback>
            
            {/* Modal content */}
            <View className="bg-light-lighter dark:bg-dark-lighter rounded-t-3xl overflow-hidden" style={{ maxHeight: '90%' }}>
                <ScrollView 
                    bounces={false} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 24, paddingBottom: 36 }}
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <RaisedCard 
                            onPress={onClose} 
                            style={{ borderRadius: 9999 }}
                            className="w-12 h-12 p-0 rounded-full items-center justify-center"
                        >
                            <IconSymbol name="xmark" size={22} color={theme.primary} />
                        </RaisedCard>
                        <Text className="text-lg font-bold text-light dark:text-dark">Log Weight</Text>
                        <RaisedCard 
                            onPress={handleSave} 
                            disabled={!weight}
                            style={{ borderRadius: 9999 }}
                            className={`w-12 h-12 p-0 rounded-full items-center justify-center ${!weight ? 'opacity-40' : ''}`}
                        >
                            <IconSymbol name="checkmark" size={24} color={theme.primary} />
                        </RaisedCard>
                    </View>

                    <View>
                        <Text className="text-sm text-light-muted dark:text-dark-muted mb-2 font-medium">DATE</Text>
                        <TouchableOpacity 
                            onPress={() => setShowDatePicker(true)}
                            className="flex-row items-center justify-between p-4 bg-light dark:bg-dark rounded-xl"
                        >
                            <Text className="text-base text-light dark:text-dark">
                                {formatDate(date)}
                            </Text>
                            <IconSymbol name="calendar" size={20} color={theme.primary} />
                        </TouchableOpacity>

                        {/* Date wheel picker */}
                        {(showDatePicker || Platform.OS === 'ios') && (
                            <View className={Platform.OS === 'ios' ? 'mt-2' : ''}>
                                {Platform.OS === 'ios' ? (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="spinner"
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                    />
                                ) : showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                    />
                                )}
                            </View>
                        )}
                    </View>

                    <View>
                        <Text className="text-sm text-light-muted dark:text-dark-muted mb-2 font-medium">WEIGHT (LBS)</Text>
                        <TextInput
                            className="text-2xl font-bold text-center py-4 bg-light dark:bg-dark rounded-xl text-light dark:text-dark"
                            value={weight}
                            onChangeText={(text) => {
                                if (text === '' || /^\d*\.?\d{0,2}$/.test(text)) {
                                    setWeight(text);
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="0.0"
                            placeholderTextColor={theme.placeholder}
                            autoFocus={Platform.OS !== 'ios'}
                        />
                    </View>
                </ScrollView>
            </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
