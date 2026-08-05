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
    const isBodyweight = lowerProps.includes('bodyweight');
    // Every bodyweight exercise gets the weight wheel now (negative for
    // assistance, positive for added load, 0 for neither) - no separate
    // "Weighted" tag/exercise variant needed per bodyweight family anymore.
    const showWeight = lowerProps.includes('weighted') || isBodyweight;
    return {
        showBodyweight: isBodyweight,
        showWeight,
        showReps: lowerProps.includes('reps'),
        showDuration: lowerProps.includes('duration'),
        showDistance: lowerProps.includes('distance'),
        showRPE: showWeight || lowerProps.includes('reps') || lowerProps.includes('duration') || lowerProps.includes('distance') || lowerProps.includes('rpe')
    };
};
