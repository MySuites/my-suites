import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemePreference } from '../../providers/AppThemeProvider';

export const ThemeToggle = () => {
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12, backgroundColor: '#e5e7eb', borderRadius: 9999, padding: 4, height: 48, width: '100%' }}>
      <TouchableOpacity
        onPress={() => setPreference('light')}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9999, height: '100%', backgroundColor: preference === 'light' ? 'white' : 'transparent' }}
        activeOpacity={0.8}
      >
        <Text style={{ fontWeight: '600', color: preference === 'light' ? 'black' : '#6b7280' }}>Light</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => setPreference('dark')}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9999, height: '100%', backgroundColor: preference === 'dark' ? '#374151' : 'transparent' }}
        activeOpacity={0.8}
      >
        <Text style={{ fontWeight: '600', color: preference === 'dark' ? 'white' : '#6b7280' }}>Dark</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ThemeToggle;
