import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface UseSetPagerParams {
    horizontalSets?: boolean;
    exerciseSets: number;
    logsLength: number;
    isOutdoorGpsExercise: boolean;
    completedIndices?: number[];
    onCompleteSet: (setIndex: number) => void;
    onDeleteSet?: (index: number) => void;
    propActiveSetIndex?: number;
    onActiveSetChange?: (index: number) => void;
    initialCardWidth: number;
}

// Drives the horizontal set-paging ScrollView: width tracking, auto-scroll
// when sets are added/removed or the active index changes from outside, and
// the complete-set/delete-set actions that also page the view.
export function useSetPager({
    horizontalSets,
    exerciseSets,
    logsLength,
    isOutdoorGpsExercise,
    completedIndices,
    onCompleteSet,
    onDeleteSet,
    propActiveSetIndex,
    onActiveSetChange,
    initialCardWidth,
}: UseSetPagerParams) {
    const [localActiveSetIndex, setLocalActiveSetIndex] = useState(0);
    const activeSetIndex = propActiveSetIndex !== undefined ? propActiveSetIndex : localActiveSetIndex;
    const lastAppliedSetIndexRef = useRef(propActiveSetIndex);
    const setActiveSetIndex = useCallback((val: number) => {
        lastAppliedSetIndexRef.current = val;
        setLocalActiveSetIndex(val);
        onActiveSetChange?.(val);
    }, [onActiveSetChange]);

    const [cardWidth, setCardWidthState] = useState(initialCardWidth);
    const setCardWidth = useCallback((newWidth: number) => {
        setCardWidthState((prev) => (Math.abs(prev - newWidth) > 1 ? newWidth : prev));
    }, []);

    const [isSetPagerScrollEnabled, setIsSetPagerScrollEnabled] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);
    // Running/Biking are one continuous GPS-tracked activity, not repeatable sets.
    const totalSets = isOutdoorGpsExercise ? 1 : Math.max(exerciseSets, logsLength || 0);
    const prevSetsCountRef = useRef(exerciseSets);
    const isProgrammaticScroll = useRef(false);
    const isMountedRef = useRef(true);
    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            timeoutRefs.current.forEach(clearTimeout);
            timeoutRefs.current = [];
        };
    }, []);

    const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
        const timeoutId = setTimeout(() => {
            timeoutRefs.current = timeoutRefs.current.filter((id) => id !== timeoutId);
            if (!isMountedRef.current) {
                return;
            }
            callback();
        }, delay);
        timeoutRefs.current.push(timeoutId);
        return timeoutId;
    }, []);

    // Auto-scroll on sets length increase
    useEffect(() => {
        if (horizontalSets && scrollViewRef.current && cardWidth > 0) {
            if (exerciseSets > prevSetsCountRef.current) {
                const lastIndex = Math.max(0, totalSets - 1);
                setActiveSetIndex(lastIndex);
                // Wrap in a tiny timeout to ensure Layout is finished rendering the new item
                scheduleTimeout(() => {
                    isProgrammaticScroll.current = true;
                    scrollViewRef.current?.scrollTo({ x: lastIndex * cardWidth, animated: true });
                    scheduleTimeout(() => {
                        isProgrammaticScroll.current = false;
                    }, 500);
                }, 50);
            } else if (exerciseSets < prevSetsCountRef.current) {
                const lastIndex = Math.max(0, totalSets - 1);
                if (activeSetIndex > lastIndex) {
                    setActiveSetIndex(lastIndex);
                    isProgrammaticScroll.current = true;
                    scrollViewRef.current?.scrollTo({ x: lastIndex * cardWidth, animated: true });
                    scheduleTimeout(() => {
                        isProgrammaticScroll.current = false;
                    }, 500);
                }
            }
        }
        prevSetsCountRef.current = exerciseSets;
    }, [exerciseSets, cardWidth, horizontalSets, totalSets, activeSetIndex, setActiveSetIndex, scheduleTimeout]);

    // Parent-driven scrolling hook
    useEffect(() => {
        if (
            horizontalSets &&
            scrollViewRef.current &&
            cardWidth > 0 &&
            propActiveSetIndex !== undefined &&
            propActiveSetIndex !== lastAppliedSetIndexRef.current
        ) {
            lastAppliedSetIndexRef.current = propActiveSetIndex;
            isProgrammaticScroll.current = true;
            scrollViewRef.current.scrollTo({ x: propActiveSetIndex * cardWidth, animated: true });
            scheduleTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 500);
        }
    }, [propActiveSetIndex, cardWidth, horizontalSets, scheduleTimeout]);

    const handleDeleteActiveSet = useCallback(() => {
        if (onDeleteSet) {
            onDeleteSet(activeSetIndex);
            const nextIndex = Math.max(0, activeSetIndex - 1);
            setActiveSetIndex(nextIndex);
            if (scrollViewRef.current && cardWidth > 0) {
                isProgrammaticScroll.current = true;
                scrollViewRef.current.scrollTo({ x: nextIndex * cardWidth, animated: true });
                scheduleTimeout(() => {
                    isProgrammaticScroll.current = false;
                }, 500);
            }
        }
    }, [onDeleteSet, activeSetIndex, cardWidth, setActiveSetIndex, scheduleTimeout]);

    const handleCompleteSetAndAutoPage = useCallback((setIndex: number) => {
        const currentlyCompleted = completedIndices?.includes(setIndex);
        onCompleteSet(setIndex);

        if (horizontalSets && !currentlyCompleted && setIndex < totalSets - 1) {
            isProgrammaticScroll.current = true;
            scheduleTimeout(() => {
                const nextIndex = setIndex + 1;
                setActiveSetIndex(nextIndex);
                scrollViewRef.current?.scrollTo({ x: nextIndex * cardWidth, animated: true });
                scheduleTimeout(() => {
                    isProgrammaticScroll.current = false;
                }, 500);
            }, 300);
        }
    }, [completedIndices, onCompleteSet, horizontalSets, totalSets, cardWidth, setActiveSetIndex, scheduleTimeout]);

    const handleScrollSettle = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isProgrammaticScroll.current || cardWidth <= 0) return;
        const newIndex = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
        if (newIndex !== activeSetIndex && newIndex >= 0 && newIndex < totalSets) {
            setActiveSetIndex(newIndex);
        }
    }, [cardWidth, activeSetIndex, totalSets, setActiveSetIndex]);

    const handleScrollEndDrag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isProgrammaticScroll.current || cardWidth <= 0) return;
        if (e.nativeEvent.velocity && (Math.abs(e.nativeEvent.velocity.x) > 0.01)) return;
        handleScrollSettle(e);
    }, [cardWidth, handleScrollSettle]);

    return {
        scrollViewRef,
        cardWidth,
        setCardWidth,
        activeSetIndex,
        setActiveSetIndex,
        totalSets,
        isSetPagerScrollEnabled,
        setIsSetPagerScrollEnabled,
        handleDeleteActiveSet,
        handleCompleteSetAndAutoPage,
        handleMomentumScrollEnd: handleScrollSettle,
        handleScrollEndDrag,
    };
}
