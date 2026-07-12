import { Platform } from 'react-native';
import * as LiveActivity from '../modules/live-activity';

export const LiveActivityService = {
  /**
   * Start a Live Activity for the current workout.
   */
  async start(input: {
    workoutName: string;
    exerciseName: string;
    setProgress: string;
    startedAt: Date;
    isPaused: boolean;
  }): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    try {
      await LiveActivity.startActivity({
        workoutName: input.workoutName,
        exerciseName: input.exerciseName,
        setProgress: input.setProgress,
        startedAtMs: input.startedAt.getTime(),
        isPaused: input.isPaused,
      });
    } catch (error) {
      console.error('Failed to start workout Live Activity:', error);
    }
  },

  /**
   * Update the currently running Live Activity with new workout content.
   */
  async update(input: {
    exerciseName?: string;
    setProgress?: string;
    isPaused?: boolean;
    startedAt?: Date;
    isResting?: boolean;
    restEndsAt?: Date | null;
  }): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    try {
      await LiveActivity.updateActivity({
        exerciseName: input.exerciseName,
        setProgress: input.setProgress,
        isPaused: input.isPaused,
        startedAtMs: input.startedAt ? input.startedAt.getTime() : undefined,
        isResting: input.isResting,
        restEndsAtMs: input.restEndsAt ? input.restEndsAt.getTime() : undefined,
      });
    } catch (error) {
      console.error('Failed to update workout Live Activity:', error);
    }
  },

  /**
   * End the currently running Live Activity, if any.
   */
  async end(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    try {
      await LiveActivity.endActivity();
    } catch (error) {
      console.error('Failed to end workout Live Activity:', error);
    }
  },
};
