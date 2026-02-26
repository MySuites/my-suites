import React, { useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import Svg, { Path, Defs, Filter, FeDropShadow } from 'react-native-svg';
import { useUITheme, IconSymbol } from '@mysuite/ui';
import { Exercise } from '../../utils/workout-api/types';

interface VariationTreeProps {
    exercises: Exercise[];
    onSetActive: (exercise: Exercise) => void;
    onSelect: (exercise: Exercise) => void;
}

interface ProcessedNode {
    exercise: Exercise;
    x: number;
    y: number;
}

export function VariationTree({ exercises, onSelect, onSetActive }: VariationTreeProps) {
    const theme = useUITheme();
    const horizontalScrollRef = useRef<ScrollView>(null);

    const currentColors = {
        text: theme.text || '#FFFFFF',
        primary: theme.primary || '#FF6F61',
        card: theme.bgLight || '#333333',
        lineDefault: theme.text, 
        lineActive: theme.primary, 
        background: (theme.bgDark || theme.bg) as string,
    };

    // Group by difficulty
    const levels = useMemo(() => {
        const difficultyMap = new Map<number, Exercise[]>();
        
        exercises.forEach(ex => {
            const diff = ex.difficulty || 1.0;
            if (!difficultyMap.has(diff)) {
                difficultyMap.set(diff, []);
            }
            difficultyMap.get(diff)!.push(ex);
        });

        const sortedDiffs = Array.from(difficultyMap.keys()).sort((a, b) => a - b);
        
        return sortedDiffs.map(diff => ({
            difficulty: diff,
            nodes: difficultyMap.get(diff)!
        }));
    }, [exercises]);

    // Layout configuration
    const NODE_SIZE = 80;
    const HORIZONTAL_SPACING = 140; 
    const VERTICAL_SPACING = 160;   
    const windowWidth = Dimensions.get('window').width;
    const PADDING_X = windowWidth / 2;
    const PADDING_Y = 100;

    // Calculate node positions
    const { nodes, connections, totalWidth, totalHeight } = useMemo(() => {
        let maxNodesInLevel = 0;
        levels.forEach(level => {
            if (level.nodes.length > maxNodesInLevel) {
                maxNodesInLevel = level.nodes.length;
            }
        });

        const width = maxNodesInLevel * HORIZONTAL_SPACING + PADDING_X * 2;
        const height = levels.length * VERTICAL_SPACING + PADDING_Y * 2;

        const layoutNodes: ProcessedNode[] = [];
        const layoutConnections: { start: ProcessedNode, end: ProcessedNode, isActivePath: boolean }[] = [];

        levels.forEach((level, levelIndex) => {
            const y = PADDING_Y + levelIndex * VERTICAL_SPACING;
            const levelWidth = level.nodes.length * HORIZONTAL_SPACING;
            const startX = (width - levelWidth) / 2 + (HORIZONTAL_SPACING / 2);

            level.nodes.forEach((ex, nodeIndex) => {
                const x = startX + nodeIndex * HORIZONTAL_SPACING;
                
                const node: ProcessedNode = { exercise: ex, x, y };
                layoutNodes.push(node);

                // Add connection to previous level
                if (levelIndex > 0) {
                    const prevLevel = levels[levelIndex - 1];
                    const prevLevelStartX = (width - prevLevel.nodes.length * HORIZONTAL_SPACING) / 2 + (HORIZONTAL_SPACING / 2);
                    
                    let bestParent: ProcessedNode | null = null;
                    let minDist = Infinity;
                    
                    prevLevel.nodes.forEach((prevEx, prevIndex) => {
                        const prevX = prevLevelStartX + prevIndex * HORIZONTAL_SPACING;
                        const dist = Math.abs(x - prevX);
                        if (dist < minDist) {
                            minDist = dist;
                            bestParent = { exercise: prevEx, x: prevX, y: PADDING_Y + (levelIndex - 1) * VERTICAL_SPACING };
                        }
                    });

                    if (bestParent) {
                        const parent = bestParent as ProcessedNode;
                        const isActivePath = ex.isActiveProgression || parent.exercise.isActiveProgression;
                        
                        layoutConnections.push({
                            start: parent,
                            end: node,
                            isActivePath: !!isActivePath
                        });
                    }
                }
            });
        });

        return { nodes: layoutNodes, connections: layoutConnections, totalWidth: width, totalHeight: height };
    }, [levels, PADDING_X]);

    const renderConnections = () => {
        return connections.map((conn, idx) => {
            const path = `M ${conn.start.x} ${conn.start.y} C ${conn.start.x} ${conn.start.y + VERTICAL_SPACING/2}, ${conn.end.x} ${conn.end.y - VERTICAL_SPACING/2}, ${conn.end.x} ${conn.end.y}`;
            return (
                <Path
                    key={`conn-${idx}`}
                    d={path}
                    stroke={conn.isActivePath ? currentColors.lineActive : currentColors.lineDefault}
                    strokeWidth={conn.isActivePath ? 4 : 2}
                    fill="none"
                    filter={conn.isActivePath ? "url(#glow)" : undefined}
                />
            );
        });
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} style={{ flex: 1, backgroundColor: currentColors.background }}>
            <ScrollView 
                horizontal 
                ref={horizontalScrollRef}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} 
                showsHorizontalScrollIndicator={false}
                onContentSizeChange={(w) => {
                    if (w > windowWidth) {
                        setTimeout(() => {
                            horizontalScrollRef.current?.scrollTo({ x: (w - windowWidth) / 2, animated: false });
                        }, 10);
                    }
                }}
            >
                <View style={{ width: totalWidth, height: totalHeight, position: 'relative' }} pointerEvents="box-none">
                    
                    {/* SVG Connections */}
                    <View style={{ position: 'absolute', top: 0, left: 0, width: totalWidth, height: totalHeight, zIndex: 0 }} pointerEvents="none">
                        <Svg width={totalWidth} height={totalHeight} pointerEvents="none">
                            <Defs>
                                <Filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <FeDropShadow dx="0" dy="0" stdDeviation="6" floodColor={currentColors.lineActive} floodOpacity="0.8"/>
                                </Filter>
                            </Defs>
                            {renderConnections()}
                        </Svg>
                    </View>

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const isActive = node.exercise.isActiveProgression;
                        
                        // The circle will replace the image in the future, for now placeholder is neutral
                        return (
                            <View 
                                key={node.exercise.id}
                                style={{
                                    position: 'absolute',
                                    left: node.x - NODE_SIZE / 2,
                                    top: node.y - NODE_SIZE / 2,
                                    width: NODE_SIZE,
                                    alignItems: 'center',
                                    zIndex: isActive ? 101 : 100, // bring definitively above SVGs
                                }}
                            >
                                <Pressable
                                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                    onPress={() => onSelect(node.exercise)}
                                >
                                    {({ pressed }) => (
                                        <View style={{
                                            width: NODE_SIZE,
                                            height: NODE_SIZE,
                                            borderRadius: NODE_SIZE / 2,
                                            // Outer shadow handling natively
                                            shadowColor: isActive ? currentColors.primary : '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: isActive ? 0.6 : 0.15,
                                            shadowRadius: isActive ? 6 : 4,
                                            elevation: isActive ? 6 : 3,
                                            backgroundColor: currentColors.card,
                                            borderWidth: isActive ? 3 : 2,
                                            borderColor: isActive ? currentColors.primary : currentColors.lineDefault,
                                            transform: [{ scale: pressed ? 0.9 : 1 }],
                                            opacity: 1,
                                        }}>
                                            <View style={{
                                                flex: 1,
                                                borderRadius: NODE_SIZE / 2,
                                                overflow: 'hidden',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: theme.bgLight || 'rgba(0,0,0,0.05)',
                                            }}>
                                                {/* Future Image will go here */}
                                                {isActive && (
                                                    <View style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                                        width: '100%',
                                                        paddingVertical: 2,
                                                        alignItems: 'center'
                                                    }}>
                                                        <IconSymbol name="checkmark.circle.fill" size={16} color={currentColors.primary} />
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </Pressable>

                                <Text 
                                    style={{ 
                                        marginTop: 12, 
                                        color: currentColors.text, 
                                        fontSize: 12, 
                                        fontWeight: isActive ? 'bold' : '500',
                                        textAlign: 'center',
                                        width: NODE_SIZE * 1.5,
                                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 3
                                    }}
                                    numberOfLines={2}
                                >
                                    {node.exercise.name.toUpperCase()}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </ScrollView>
    );
}
