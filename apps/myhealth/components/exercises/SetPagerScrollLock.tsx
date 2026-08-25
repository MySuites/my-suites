import React, { createContext, useContext, useRef } from 'react';

// Lets a nested horizontal wheel (weight/reps selector) temporarily disable
// the set-swipe pager's own horizontal ScrollView while the user is dragging
// the wheel. Same-axis nested ScrollViews in RN negotiate touches
// unreliably — without this, the outer pager can intermittently steal part
// of a wheel drag, so the wheel snaps to whatever offset it happened to be
// at when the outer view interrupted it instead of where the user released.
// Defaults to no-ops so wheels used outside a pager (e.g. exercise details
// screen) work unchanged.
interface SetPagerScrollLockValue {
    lock: () => void;
    unlock: () => void;
}

const noopSetPagerScrollLock: SetPagerScrollLockValue = { lock: () => {}, unlock: () => {} };

const SetPagerScrollLockContext = createContext<SetPagerScrollLockValue>(noopSetPagerScrollLock);

export function useSetPagerScrollLock() {
    return useContext(SetPagerScrollLockContext);
}

// Wrap the pager with this and pass it the setter for the pager
// ScrollView's `scrollEnabled` prop.
export function SetPagerScrollLockProvider({
    setScrollEnabled,
    children,
}: {
    setScrollEnabled: (enabled: boolean) => void;
    children: React.ReactNode;
}) {
    // Multiple wheels can theoretically be mid-drag in overlapping frames
    // (e.g. a stray touch), so track a count rather than a single boolean —
    // only re-enable once nothing is holding the lock.
    const lockCount = useRef(0);

    const value = useRef<SetPagerScrollLockValue>({
        lock: () => {
            lockCount.current += 1;
            setScrollEnabled(false);
        },
        unlock: () => {
            lockCount.current = Math.max(0, lockCount.current - 1);
            if (lockCount.current === 0) {
                setScrollEnabled(true);
            }
        },
    }).current;

    return (
        <SetPagerScrollLockContext.Provider value={value}>
            {children}
        </SetPagerScrollLockContext.Provider>
    );
}
