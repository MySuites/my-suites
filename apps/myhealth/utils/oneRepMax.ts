// Epley formula — the most common e1RM estimate, accurate for the
// low-to-moderate rep ranges (roughly 1-12) that strength sets fall in.
// Returns null for inputs that can't produce a meaningful estimate.
export function estimateOneRepMax(weight: number, reps: number): number | null {
    if (!isFinite(weight) || !isFinite(reps) || weight <= 0 || reps <= 0) return null;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
}
