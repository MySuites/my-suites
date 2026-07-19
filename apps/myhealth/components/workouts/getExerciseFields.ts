import { getExerciseDefaultProperties } from '../../providers/WorkoutManagerProvider';

export const getExerciseFields = (properties?: string[], exerciseId?: string) => {
    let props = properties || [];

    // Fallback to default properties if available (handles stale data)
    if (exerciseId) {
        const defaults = getExerciseDefaultProperties(exerciseId);
        // Merge unique properties
        const unique = new Set([...props, ...defaults]);
        props = Array.from(unique);
    }

    const lowerProps = props.map(p => p.toLowerCase());
    return {
        showBodyweight: lowerProps.includes('bodyweight'),
        showWeight: lowerProps.includes('weighted'),
        showReps: lowerProps.includes('reps'),
        showDuration: lowerProps.includes('duration'),
        showDistance: lowerProps.includes('distance'),
        showRPE: lowerProps.includes('weighted') || lowerProps.includes('reps') || lowerProps.includes('duration') || lowerProps.includes('distance') || lowerProps.includes('rpe')
    };
};
