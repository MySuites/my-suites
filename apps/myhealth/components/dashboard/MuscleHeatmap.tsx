import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Ellipse } from 'react-native-svg';
import { useUITheme, RaisedCard } from '@mysuite/ui';

interface MuscleVolume {
    muscle: string;
    sets: number;
    exercises: string[];
}

interface MuscleHeatmapProps {
    volumes: Record<string, MuscleVolume>;
    isLoading?: boolean;
}

export function MuscleHeatmap({ volumes, isLoading }: MuscleHeatmapProps) {
    const theme = useUITheme();
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

    const isDark = theme.bgDark === '#000000';

    // Premium dark-mode palette calibrated from the reference screenshot
    const chartBg   = '#15171e';
    const bodyColor = '#000000';
    const silhouetteGlow = 'rgba(173, 216, 230, 0.25)'; // Light-blue/gray outer glow
    
    // Inactive plate fill matching cool light gray/blue
    const inactiveFill = isDark ? '#2e303e' : '#b0bec5';

    const getMuscleColor = (name: string): string => {
        const lookup = name === 'Obliques' ? 'Abdominals' : name;
        const sets = volumes[lookup]?.sets ?? 0;
        if (sets === 0) return inactiveFill;
        
        // Heatmap colors from orange to red matching the screenshot's active plates
        if (sets < 3)  return '#ff8a7a'; // Soft orange/peach
        if (sets < 6)  return '#ff6f61'; // Solid coral orange
        if (sets < 10) return '#ff4d3d'; // Intense red-orange
        return '#e62e1c'; // Vivid deep red
    };

    const handlePress = (name: string) => {
        const lookup = name === 'Obliques' ? 'Abdominals' : name;
        setSelectedMuscle(prev => prev === lookup ? null : lookup);
    };

    const sel = (name: string) => {
        const lookup = name === 'Obliques' ? 'Abdominals' : name;
        return selectedMuscle === lookup;
    };

    const mp = (name: string) => ({
        fill: getMuscleColor(name),
        stroke: sel(name) ? theme.primary : bodyColor,
        strokeWidth: sel(name) ? 2.5 : 1.5, // 1.5px stroke creates crisp black gaps between plates
        onPress: () => handlePress(name),
    });

    const activeInfo = selectedMuscle ? volumes[selectedMuscle] : null;

    return (
        <RaisedCard className="p-4" style={{ borderRadius: 16 }}>
            <View className="mb-2">
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                    Weekly Muscle Heatmap
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    Tap a muscle group to view sets & exercises
                </Text>
            </View>

            {/* Premium recovery-app chart wrapper */}
            <View style={[styles.chartWrapper, { backgroundColor: chartBg }]}>
                {isLoading ? (
                    <Text style={{ color: '#6a6a88' }}>Loading…</Text>
                ) : (
                    <>
                        <Svg width="100%" height="100%" viewBox="0 0 200 260">

                            {/* ================================================ */}
                            {/*  ANTERIOR (FRONT) · center x = 50                */}
                            {/* ================================================ */}

                            {/* ---- dark body silhouette with outer glow ---- */}
                            <G id="a-body">
                                <Ellipse cx="50" cy="18" rx="8.5" ry="10.5" fill={bodyColor} stroke={silhouetteGlow} strokeWidth="1.5" />
                                <Path 
                                    d="M 50,27 C 47,27 45,28 43,30 C 43,33 42,35 41,36 C 36,36 31,36 29,37 C 24,37 19,41 17,46 C 16,51 18,57 21,58 C 21,63 20,70 21,75 C 19,77 17,80 16,87 C 15,94 16,101 18,106 C 20,108 23,109 25,108 L 27,108 C 29,108 32,112 33,116 C 31,124 31,132 32,142 C 33,152 34,158 36,163 C 37,165 38,168 38,170 C 35,170 33,178 32,188 C 32,198 32,210 33,212 C 34,213 36,215 37,215 C 37,222 36,230 35,236 C 35,242 34,248 31,250 C 35,250 40,248 43,242 C 45,236 46,230 46,215 L 46,168 C 48,168 50,168 50,168 C 50,168 52,168 54,168 L 54,215 C 54,230 55,236 57,242 C 60,248 65,250 69,250 C 66,248 65,242 65,236 C 64,230 63,222 63,215 C 64,215 66,213 67,212 C 68,210 68,198 68,188 C 67,178 65,170 62,170 C 62,168 63,165 64,163 C 66,158 67,152 68,142 C 69,132 69,124 67,116 C 68,112 71,108 73,108 L 75,108 C 77,109 80,108 82,106 C 84,101 85,94 84,87 C 83,80 81,77 79,75 C 80,70 79,63 79,58 C 82,57 84,51 83,46 C 81,41 76,37 71,37 C 69,36 64,36 59,36 C 58,35 57,33 57,30 C 55,28 53,27 50,27 Z" 
                                    fill={bodyColor} 
                                    stroke={silhouetteGlow}
                                    strokeWidth="1.5"
                                />
                            </G>

                            {/* ---- anterior stylized muscle plates ---- */}
                            <G id="a-muscles">
                                {/* Neck connectors (Traps) */}
                                <G {...mp('Traps')}>
                                    <Path d="M 43,26 C 41,29 38,32 35,34 L 43,34 Z" />
                                    <Path d="M 57,26 C 59,29 62,32 65,34 L 57,34 Z" />
                                </G>
                                {/* Shoulders (Deltoids) */}
                                <G {...mp('Shoulders')}>
                                    <Path d="M 33,36 C 28,36.5 24,40 22,46 C 21,50 22,54 25,55 C 28,56 30,52 31,48 C 32,44 33,40 33,36 Z" />
                                    <Path d="M 67,36 C 72,36.5 76,40 78,46 C 79,50 78,54 75,55 C 72,56 70,52 69,48 C 68,44 67,40 67,36 Z" />
                                </G>
                                {/* Chest (Pectorals) */}
                                <G {...mp('Chest')}>
                                    <Path d="M 36,37 C 39,36 44,36 48.5,36 L 48.5,56 C 45,58 40,57 36,53 Z" />
                                    <Path d="M 64,37 C 61,36 56,36 51.5,36 L 51.5,56 C 55,58 60,57 64,53 Z" />
                                </G>
                                {/* Biceps */}
                                <G {...mp('Biceps')}>
                                    <Path d="M 28,55 C 26,56 24,60 24,64 C 24,68 26,71 28,70 C 29,69 30,65 30,61 C 30,57 29,55 28,55 Z" />
                                    <Path d="M 72,55 C 74,56 76,60 76,64 C 76,68 74,71 72,70 C 71,69 70,65 70,61 C 70,57 71,55 72,55 Z" />
                                </G>
                                {/* Underarm (Triceps / Lats view from front) */}
                                <G {...mp('Triceps')}>
                                    <Path d="M 32,54 C 33,60 33,66 33,70 L 35,68 L 35,56 Z" />
                                    <Path d="M 68,54 C 67,60 67,66 67,70 L 65,68 L 65,56 Z" />
                                </G>
                                {/* Forearms */}
                                <G {...mp('Forearms')}>
                                    <Path d="M 25,73 C 22,76 21,80 20,87 C 19,93 20,99 22,102 C 23,103 24,101 24,99 C 24,94 25,89 26,84 C 26,80 26,76 25,73 Z" />
                                    <Path d="M 75,73 C 78,76 79,80 80,87 C 81,93 80,99 78,102 C 77,103 76,101 76,99 C 76,94 75,89 74,84 C 74,80 74,76 75,73 Z" />
                                </G>
                                {/* Abdominals — 3x2 grid + V-cut lower ab wall */}
                                <G {...mp('Abdominals')}>
                                    {/* Row 1 */}
                                    <Path d="M 44.5,59 C 45.5,59 48,59 49,59 L 49,66 C 48,66 45.5,66 44.5,66 Z" />
                                    <Path d="M 55.5,59 C 54.5,59 52,59 51,59 L 51,66 C 52,66 54.5,66 55.5,66 Z" />
                                    {/* Row 2 */}
                                    <Path d="M 44.5,68 C 45.5,68 48,68 49,68 L 49,76 C 48,76 45.5,76 44.5,76 Z" />
                                    <Path d="M 55.5,68 C 54.5,68 52,68 51,68 L 51,76 C 52,76 54.5,76 55.5,76 Z" />
                                    {/* Row 3 */}
                                    <Path d="M 44.5,78 C 45.5,78 48,78 49,78 L 49,86 C 48,86 45.5,86 44.5,86 Z" />
                                    <Path d="M 55.5,78 C 54.5,78 52,78 51,78 L 51,86 C 52,86 54.5,86 55.5,86 Z" />
                                    {/* Lower shield */}
                                    <Path d="M 44.5,88 L 55.5,88 C 54.5,93 53,98 52,102 C 50.5,104 49.5,104 48,102 C 47,98 45.5,93 44.5,88 Z" />
                                </G>
                                {/* Obliques */}
                                <G {...mp('Obliques')}>
                                    <Path d="M 36,58 L 42.5,58 L 42.5,66 L 36,68 Z" />
                                    <Path d="M 36,70 L 42.5,68 L 42.5,76 L 36,78 Z" />
                                    <Path d="M 36,80 L 42.5,78 L 42.5,86 L 36,88 Z" />
                                    <Path d="M 36,90 L 42.5,88 L 42.5,102 C 40,103 38,102 36,100 Z" />
                                    
                                    <Path d="M 64,58 L 57.5,58 L 57.5,66 L 64,68 Z" />
                                    <Path d="M 64,70 L 57.5,68 L 57.5,76 L 64,78 Z" />
                                    <Path d="M 64,80 L 57.5,78 L 57.5,86 L 64,88 Z" />
                                    <Path d="M 64,90 L 57.5,88 L 57.5,102 C 60,103 62,102 64,100 Z" />
                                </G>
                                {/* Quadriceps */}
                                <G {...mp('Quadriceps')}>
                                    {/* Left Thigh (Rectus Femoris, Vastus Lateralis, Vastus Medialis) */}
                                    <Path d="M 39,116 C 41,116 42,116 43,116 C 43,128 42,140 41.5,152 C 41,152 40,152 39.5,152 C 39,140 39,128 39,116 Z" />
                                    <Path d="M 34,116 C 36,116 38,116 38.5,116 C 38.5,128 38,140 38.5,152 C 39,158 39.5,162 40,164 C 38,162 36,152 35,140 C 34,128 34,120 34,116 Z" />
                                    <Path d="M 43.5,128 C 45,128 47,128 47.5,128 C 47.5,138 47,148 46.5,154 C 46,158 45.5,160 45,160 C 44,152 43.5,140 43.5,128 Z" />
                                    {/* Right Thigh */}
                                    <Path d="M 61,116 C 59,116 58,116 57,116 C 57,128 58,140 58.5,152 C 59,152 60,152 60.5,152 C 61,140 61,128 61,116 Z" />
                                    <Path d="M 66,116 C 64,116 62,116 61.5,116 C 61.5,128 62,140 61.5,152 C 61,158 60.5,162 60,164 C 62,162 64,152 65,140 C 66,128 66,120 66,116 Z" />
                                    <Path d="M 56.5,128 C 55,128 53,128 52.5,128 C 52.5,138 53,148 53.5,154 C 54,158 54.5,160 55,160 C 56,152 56.5,140 56.5,128 Z" />
                                </G>
                                {/* Adductors */}
                                <G {...mp('Adductors')}>
                                    <Path d="M 48,116 C 48.5,124 49,132 49,140 C 48.5,140 47.5,138 47,136 C 47.5,128 48,120 48,116 Z" />
                                    <Path d="M 52,116 C 51.5,124 51,132 51,140 C 51.5,140 52.5,138 53,136 C 52.5,128 52,120 52,116 Z" />
                                </G>
                                {/* Calves (front) */}
                                <G {...mp('Calves')}>
                                    <Path d="M 34,170 C 33,178 33,188 33,198 C 34,198 35,194 36,188 C 36,180 35,174 34,170 Z" />
                                    <Path d="M 38,170 C 37,178 37,188 37,198 C 38,198 39,194 40,188 C 40,180 39,174 38,170 Z" />
                                    <Path d="M 66,170 C 67,178 67,188 67,198 C 66,198 65,194 64,188 C 64,180 65,174 66,170 Z" />
                                    <Path d="M 62,170 C 63,178 63,188 63,198 C 62,198 61,194 60,188 C 60,180 61,174 62,170 Z" />
                                </G>
                            </G>


                            {/* ================================================ */}
                            {/*  POSTERIOR (BACK) · center x = 150               */}
                            {/* ================================================ */}

                            {/* ---- dark body silhouette with outer glow ---- */}
                            <G id="p-body">
                                <Ellipse cx="150" cy="18" rx="8.5" ry="10.5" fill={bodyColor} stroke={silhouetteGlow} strokeWidth="1.5" />
                                <Path 
                                    d="M 150,27 C 147,27 145,28 143,30 C 143,33 142,35 141,36 C 136,36 131,36 129,37 C 124,37 119,41 117,46 C 116,51 118,57 121,58 C 121,63 120,70 121,75 C 119,77 117,80 116,87 C 115,94 116,101 118,106 C 120,108 123,109 125,108 L 127,108 C 129,108 32,112 133,116 C 131,124 131,132 132,142 C 133,152 134,158 136,163 C 137,165 138,170 138,170 C 135,170 133,178 132,188 C 132,198 132,210 133,212 C 134,213 136,215 137,215 C 137,222 136,230 135,236 C 135,242 134,248 131,250 C 135,250 140,248 143,242 C 145,236 146,230 146,215 L 146,168 C 148,168 150,168 150,168 C 150,168 152,168 154,168 L 154,215 C 154,230 155,236 157,242 C 160,248 165,250 169,250 C 166,248 165,242 165,236 C 164,230 163,222 163,215 C 164,215 166,213 167,212 C 168,210 168,198 168,188 C 167,178 165,170 162,170 C 162,168 163,165 164,163 C 166,158 167,152 168,142 C 169,132 169,124 167,116 C 168,112 171,108 173,108 L 175,108 C 177,109 180,108 182,106 C 184,101 185,94 184,87 C 183,80 181,77 179,75 C 180,70 179,63 179,58 C 182,57 184,51 183,46 C 181,41 176,37 171,37 C 169,36 164,36 159,36 C 158,35 157,33 157,30 C 155,28 153,27 150,27 Z" 
                                    fill={bodyColor} 
                                    stroke={silhouetteGlow}
                                    strokeWidth="1.5"
                                />
                            </G>

                            {/* ---- posterior stylized muscle plates ---- */}
                            <G id="p-muscles">
                                {/* Trapezius (split down spine) */}
                                <G {...mp('Traps')}>
                                    <Path d="M 150,27 C 147.5,27 145.5,28 144.5,28 C 142,32 138.5,35 135.5,37 C 137.5,44 139.5,49 141.5,53 C 144,57 146.5,60 149,63 L 149,27 Z" />
                                    <Path d="M 150,27 C 152.5,27 154.5,28 155.5,28 C 158,32 161.5,35 164.5,37 C 162.5,44 160.5,49 158.5,53 C 156,57 153.5,60 151,63 L 151,27 Z" />
                                </G>
                                {/* Rear Deltoids */}
                                <G {...mp('Shoulders')}>
                                    <Path d="M 133,36 C 128,36.5 124,40 122,46 C 121,50 122,54 125,55 C 128,56 130,52 131,48 C 132,44 133,40 133,36 Z" />
                                    <Path d="M 167,36 C 172,36.5 76,40 178,46 C 179,50 178,54 175,55 C 172,56 170,52 169,48 C 168,44 167,40 167,36 Z" />
                                </G>
                                {/* Lats (winged plates) */}
                                <G {...mp('Lats')}>
                                    <Path d="M 148,47 L 148,74 C 145,76 141,75 138,74 C 135.5,72 133.5,67 133.5,59 C 133.5,52 134.5,48 136,47 Z" />
                                    <Path d="M 152,47 L 152,74 C 155,76 159,75 162,74 C 164.5,72 166.5,67 166.5,59 C 166.5,52 165.5,48 164,47 Z" />
                                </G>
                                {/* Lower Back */}
                                <G {...mp('Lower back')}>
                                    <Path d="M 144,70 C 144,76 144,84 144,91 C 144,93 146,94 148,93 L 148,70 Z" />
                                    <Path d="M 156,70 C 156,76 156,84 156,91 C 156,93 154,94 152,93 L 152,70 Z" />
                                </G>
                                {/* Triceps (horseshoe split) */}
                                <G {...mp('Triceps')}>
                                    {/* Left Arm Triceps */}
                                    <Path d="M 128,55 C 126,56 124,60 124,64 C 124,68 126,71 128,70 Z" />
                                    <Path d="M 129.5,57 C 129.5,62 129,67 129,71 C 130,71 130.5,67 130.5,62 Z" />
                                    {/* Right Arm Triceps */}
                                    <Path d="M 172,55 C 174,56 176,60 176,64 C 176,68 174,71 172,70 Z" />
                                    <Path d="M 170.5,57 C 170.5,62 171,67 171,71 C 170,71 169.5,67 169.5,62 Z" />
                                </G>
                                {/* Forearms */}
                                <G {...mp('Forearms')}>
                                    <Path d="M 125,74 C 123,76 121,80 120,87 C 119,94 120,101 122,106 C 123,107 124,106 124,104 C 124,98 125,92 126,86 C 127,81 127,77 125,74 Z" />
                                    <Path d="M 175,74 C 177,76 179,80 180,87 C 181,94 180,101 178,106 C 177,107 176,106 176,104 C 176,98 175,92 174,86 C 173,81 173,77 175,74 Z" />
                                </G>
                                {/* Glutes */}
                                <G {...mp('Glutes')}>
                                    <Path d="M 148,95 C 143,95 137.5,97 134.5,101 C 132.5,105 133,112 137,116 C 141,118.5 145,118 148,115 C 149,110 149,102 148,95 Z" />
                                    <Path d="M 152,95 C 157,95 162.5,97 165.5,101 C 167.5,105 167,112 163,116 C 159,118.5 155,118 152,115 C 151,110 151,102 152,95 Z" />
                                </G>
                                {/* Hamstrings */}
                                <G {...mp('Hamstrings')}>
                                    {/* Left Hamstring (split columns) */}
                                    <Path d="M 134,118 C 134,128 134,142 136,152 C 137,158 139,162 140,164 C 139,152 138,140 138,118 Z" />
                                    <Path d="M 142,118 C 142,128 142.5,140 141.5,152 C 142,158 143.5,162 145,164 C 146,152 146,128 146,118 Z" />
                                    {/* Right Hamstring */}
                                    <Path d="M 166,118 C 166,128 166,142 164,152 C 163,158 161,162 160,164 C 161,152 162,140 162,118 Z" />
                                    <Path d="M 158,118 C 158,128 157.5,140 158.5,152 C 158,158 156.5,162 155,164 C 154,152 154,128 154,118 Z" />
                                </G>
                                {/* Calves */}
                                <G {...mp('Calves')}>
                                    <Path d="M 137,170 C 134,171 131,175 131,185 C 131,195 133,205 135,212 C 136,212 136.5,205 137,195 Z M 139,170 C 139.5,175 139.5,185 140,195 C 140.5,205 141,212 142,212 C 145,205 146,195 146,185 C 146,175 143,171 139,170 Z" />
                                    <Path d="M 163,170 C 166,171 169,175 169,185 C 169,195 167,205 165,212 C 164,212 163.5,205 163,195 Z M 161,170 C 160.5,175 160.5,185 160,195 C 159.5,205 159,212 158,212 C 155,205 154,195 154,185 C 154,175 157,171 161,170 Z" />
                                </G>
                            </G>

                        </Svg>

                        {/* Labels */}
                        <View style={styles.labelsRow}>
                            <Text style={styles.labelText}>FRONT</Text>
                            <Text style={styles.labelText}>BACK</Text>
                        </View>
                    </>
                )}
            </View>

            {/* Tooltip HUD */}
            <View style={[styles.tooltip, { backgroundColor: isDark ? '#1c1c24' : '#f2f2f7' }]}>
                {activeInfo ? (
                    <View className="items-center w-full">
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>
                            {activeInfo.muscle}: {activeInfo.sets} working sets
                        </Text>
                        {activeInfo.exercises.length > 0 ? (
                            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, textAlign: 'center' }} numberOfLines={1}>
                                {activeInfo.exercises.join(', ')}
                            </Text>
                        ) : (
                            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                                No exercises logged
                            </Text>
                        )}
                    </View>
                ) : (
                    <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic' }}>
                        Tap any muscle to see your training log
                    </Text>
                )}
            </View>
        </RaisedCard>
    );
}

const styles = StyleSheet.create({
    chartWrapper: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8,
    },
    labelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        position: 'absolute',
        bottom: 6,
    },
    labelText: {
        color: '#6666aa',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 2,
    },
    tooltip: {
        minHeight: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        padding: 8,
        marginTop: 4,
    },
});
