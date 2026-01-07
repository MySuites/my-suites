import React, { useCallback } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useUITheme, RaisedCard, IconSymbol } from '@mysuite/ui';

export function useBackButtonAction() {
    const router = useRouter();
    const pathname = usePathname();
    const { startWorkout, isExpanded, setExpanded } = useActiveWorkout();

    const handleBack = useCallback(() => {
        // Special handling for End Workout screen
        if (pathname === '/workouts/end') {
            startWorkout(); // Resumes and maximizes
            router.back();
            return;
        }

        // If Active Workout Overlay is expanded, AND we are on the main workout screen
        // collapse it instead of navigating back.
        // We check for workout path to ensure back buttons on other screens (like /exercises)
        // still function as expected (actually navigating back).
        if (isExpanded && pathname.includes('workout')) {
            setExpanded(false);
            return;
        }

        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }, [pathname, isExpanded, setExpanded, startWorkout, router]);

    return { handleBack };
}

export function BackButton({ onPress }: { onPress?: () => void }) {
    const theme = useUITheme();
    const { handleBack } = useBackButtonAction();

    return (
        <RaisedCard
            onPress={onPress || handleBack}
            className="w-10 h-10 p-0 rounded-full items-center justify-center"
            style={{ borderRadius: 9999 }}
        >
            <IconSymbol
                name="chevron.left"
                size={24}
                color={theme.primary}
            />
        </RaisedCard>
    );
}
