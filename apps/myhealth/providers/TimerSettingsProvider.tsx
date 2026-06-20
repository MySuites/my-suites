import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TimerSettingsContextType = {
  prepCountdown: number;
  setPrepCountdown: (value: number) => Promise<void>;
  isLoading: boolean;
};

const TimerSettingsContext = createContext<TimerSettingsContextType | undefined>(undefined);

export const useTimerSettings = () => {
  const context = useContext(TimerSettingsContext);
  if (!context) {
    throw new Error('useTimerSettings must be used within a TimerSettingsProvider');
  }
  return context;
};

const KEY_PREP_COUNTDOWN = 'setting.timer.prepCountdown';

export function TimerSettingsProvider({ children }: { children: React.ReactNode }) {
  const [prepCountdown, setPrepCountdownState] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const value = await AsyncStorage.getItem(KEY_PREP_COUNTDOWN);
        if (value !== null) {
          setPrepCountdownState(parseInt(value, 10) || 0);
        } else {
          setPrepCountdownState(0); // Default to 0 (None)
        }
      } catch (error) {
        console.error('Failed to load timer settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const setPrepCountdown = async (value: number) => {
    try {
      setPrepCountdownState(value);
      await AsyncStorage.setItem(KEY_PREP_COUNTDOWN, String(value));
    } catch (error) {
      console.error('Failed to save timer settings:', error);
    }
  };

  return (
    <TimerSettingsContext.Provider value={{ prepCountdown, setPrepCountdown, isLoading }}>
      {children}
    </TimerSettingsContext.Provider>
  );
}
