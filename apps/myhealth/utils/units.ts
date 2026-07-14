// All weight data is stored internally in pounds (lb) — the app's existing
// canonical unit — regardless of the user's display preference. Conversion
// happens only at display time (lb -> chosen unit) and entry time (chosen
// unit -> lb), so stored history, e1RM math, and strength standards never
// need to care which unit the user is currently viewing.
export type UnitSystem = 'imperial' | 'metric';

export const UNIT_SYSTEM_STORAGE_KEY = 'unit_system';
export const DEFAULT_UNIT_SYSTEM: UnitSystem = 'imperial';

const LB_PER_KG = 2.2046226218;

export function lbToDisplay(lb: number, system: UnitSystem): number {
    return system === 'metric' ? lb / LB_PER_KG : lb;
}

export function displayToLb(value: number, system: UnitSystem): number {
    return system === 'metric' ? value * LB_PER_KG : value;
}

export function weightUnitLabel(system: UnitSystem): 'lb' | 'kg' {
    return system === 'metric' ? 'kg' : 'lb';
}

// Round to a sane display precision per unit — kg values from an lb->kg
// conversion are rarely clean integers, so allow one decimal place there.
// Only for static text display — never feed this into a selector wheel's
// controlled `value` prop (see snapToValues below for that).
export function roundForDisplay(value: number, system: UnitSystem): number {
    return system === 'metric' ? Math.round(value * 10) / 10 : Math.round(value);
}

// Snaps a value to the nearest entry in a wheel's own values array (e.g.
// WEIGHT_VALUES_LB's 2.5lb steps). A selector wheel's controlled `value`
// prop must always exactly equal one of its `values` entries — feeding it
// something merely "rounded" (e.g. roundForDisplay's whole-number rounding,
// which doesn't line up with a 2.5-step array) causes the wheel's internal
// bookkeeping to mismatch the actual scrolled-to item, which then
// re-corrects on every re-render — visible as the value flickering between
// two positions indefinitely.
export function snapToValues(value: number, values: number[]): number {
    return values.reduce((prev, curr) =>
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
}
