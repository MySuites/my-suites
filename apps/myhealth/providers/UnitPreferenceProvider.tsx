import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../utils/storage';
import {
    UnitSystem,
    UNIT_SYSTEM_STORAGE_KEY,
    DEFAULT_UNIT_SYSTEM,
    weightUnitLabel,
} from '../utils/units';

interface UnitPreferenceContextValue {
    unitSystem: UnitSystem;
    setUnitSystem: (system: UnitSystem) => Promise<void>;
    weightUnit: 'lb' | 'kg';
}

const UnitPreferenceContext = createContext<UnitPreferenceContextValue | undefined>(undefined);

export function UnitPreferenceProvider({ children }: { children: React.ReactNode }) {
    const [unitSystem, setUnitSystemState] = useState<UnitSystem>(DEFAULT_UNIT_SYSTEM);

    useEffect(() => {
        storage.getItem<UnitSystem>(UNIT_SYSTEM_STORAGE_KEY).then((stored) => {
            if (stored === 'imperial' || stored === 'metric') setUnitSystemState(stored);
        });
    }, []);

    const setUnitSystem = async (system: UnitSystem) => {
        setUnitSystemState(system);
        await storage.setItem(UNIT_SYSTEM_STORAGE_KEY, system);
    };

    return (
        <UnitPreferenceContext.Provider
            value={{ unitSystem, setUnitSystem, weightUnit: weightUnitLabel(unitSystem) }}
        >
            {children}
        </UnitPreferenceContext.Provider>
    );
}

// Falls back to the default unit system (not a throw) when used without a
// provider — e.g. component tests that render in isolation, matching the
// same non-throwing convention as useUITheme.
export function useUnitPreference() {
    const ctx = useContext(UnitPreferenceContext);
    if (!ctx) {
        return {
            unitSystem: DEFAULT_UNIT_SYSTEM,
            setUnitSystem: async () => {},
            weightUnit: weightUnitLabel(DEFAULT_UNIT_SYSTEM),
        };
    }
    return ctx;
}
