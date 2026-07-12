import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export interface LiveActivityStartOptions {
  workoutName: string;
  exerciseName: string;
  setProgress: string;
  startedAtMs: number;
  isPaused: boolean;
}

export interface LiveActivityUpdateOptions {
  exerciseName?: string;
  setProgress?: string;
  isPaused?: boolean;
  startedAtMs?: number;
  isResting?: boolean;
  restEndsAtMs?: number;
}

interface LiveActivityNativeModule {
  areActivitiesEnabled(): Promise<boolean>;
  startActivity(options: LiveActivityStartOptions): Promise<void>;
  updateActivity(options: LiveActivityUpdateOptions): Promise<void>;
  endActivity(): Promise<void>;
}

let nativeModule: LiveActivityNativeModule | null = null;

function getNativeModule(): LiveActivityNativeModule | null {
  if (Platform.OS !== 'ios') {
    return null;
  }
  if (!nativeModule) {
    nativeModule = requireNativeModule<LiveActivityNativeModule>('LiveActivity');
  }
  return nativeModule;
}

export async function areActivitiesEnabled(): Promise<boolean> {
  return (await getNativeModule()?.areActivitiesEnabled()) ?? false;
}

export async function startActivity(options: LiveActivityStartOptions): Promise<void> {
  await getNativeModule()?.startActivity(options);
}

export async function updateActivity(options: LiveActivityUpdateOptions): Promise<void> {
  await getNativeModule()?.updateActivity(options);
}

export async function endActivity(): Promise<void> {
  await getNativeModule()?.endActivity();
}
