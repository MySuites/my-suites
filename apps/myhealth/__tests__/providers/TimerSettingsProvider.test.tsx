import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerSettingsProvider, useTimerSettings } from '../../providers/TimerSettingsProvider';

describe('TimerSettingsProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TimerSettingsProvider>{children}</TimerSettingsProvider>
  );

  it('should initialize with default value of 0 (None) and isLoading as true, then false', async () => {
    const { result } = renderHook(() => useTimerSettings(), { wrapper });

    // Initial state check
    expect(result.current.prepCountdown).toBe(0);

    // Wait for the async loading effect to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.prepCountdown).toBe(0);
  });

  it('should load initial value from AsyncStorage if present', async () => {
    await AsyncStorage.setItem('setting.timer.prepCountdown', '5');

    const { result } = renderHook(() => useTimerSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.prepCountdown).toBe(5);
  });

  it('should update state and persist value to AsyncStorage when setPrepCountdown is called', async () => {
    const { result } = renderHook(() => useTimerSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setPrepCountdown(10);
    });

    expect(result.current.prepCountdown).toBe(10);
    const stored = await AsyncStorage.getItem('setting.timer.prepCountdown');
    expect(stored).toBe('10');
  });
});
