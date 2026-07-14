// Height is stored as a single value in inches (canonical unit, matching the
// app's existing imperial-first convention for weight/lb) — not a history
// log like body weight, since height rarely changes for adults. Convert for
// display/entry only.
export const HEIGHT_STORAGE_KEY = 'user_height_inches';

const CM_PER_INCH = 2.54;

export function inchesToCm(inches: number): number {
    return inches * CM_PER_INCH;
}

export function cmToInches(cm: number): number {
    return cm / CM_PER_INCH;
}

export function feetInchesToTotalInches(feet: number, inches: number): number {
    return feet * 12 + inches;
}

export function totalInchesToFeetInches(totalInches: number): { feet: number; inches: number } {
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches - feet * 12);
    // Rounding inches up to 12 should carry into an extra foot.
    if (inches >= 12) return { feet: feet + 1, inches: 0 };
    return { feet, inches };
}
