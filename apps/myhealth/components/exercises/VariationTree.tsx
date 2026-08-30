import React, { useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useUITheme, IconSymbol } from '@mysuite/ui';
import { Exercise } from '../../utils/workout-api/types';

interface VariationTreeProps {
    exercises: Exercise[];
    onSelect: (exercise: Exercise) => void;
    activeId?: string;
}

interface ProcessedNode {
    exercise: Exercise;
    x: number;
    y: number;
}

export const VariationTree = React.memo(function VariationTree({ exercises, onSelect, activeId }: VariationTreeProps) {
    const theme = useUITheme();
    const horizontalScrollRef = useRef<ScrollView>(null);

    const currentColors = {
        text: theme.text,
        primary: theme.primary,
        card: theme.bgLight,
        lineDefault: theme.text,
        lineActive: theme.primary,
        background: (theme.bgDark || theme.bg) as string,
    };

    // Group by depth levels using topological sort / DAG longest path
    const levels = useMemo(() => {
        if (exercises.length === 0) return [];
        
        const inDegree = new Map<string, number>();
        const adjList = new Map<string, string[]>();
        
        exercises.forEach(ex => {
            if (!inDegree.has(ex.id)) inDegree.set(ex.id, 0);
            if (!adjList.has(ex.id)) adjList.set(ex.id, []);
            
            (ex.nextVariations || []).forEach(childId => {
                // Ignore edges pointing out of our provided subgraph 
                if (!exercises.some(e => e.id === childId)) return;

                if (!inDegree.has(childId)) inDegree.set(childId, 0);
                inDegree.set(childId, inDegree.get(childId)! + 1);
                
                if (!adjList.has(ex.id)) adjList.set(ex.id, []);
                adjList.get(ex.id)!.push(childId);
            });
        });

        const rootNodes = exercises.filter(ex => inDegree.get(ex.id) === 0);
        
        // If there are loops or no roots (fallback), just pick the first node.
        if (rootNodes.length === 0 && exercises.length > 0) {
            rootNodes.push(exercises[0]);
        }
        
        const maxDepthMap = new Map<string, number>();
        const topoQueue = [...rootNodes];
        rootNodes.forEach(r => maxDepthMap.set(r.id, 1));
        
        while(topoQueue.length > 0) {
            const curr = topoQueue.shift()!;
            const currentDepth = maxDepthMap.get(curr.id) || 1;
            
            (curr.nextVariations || []).forEach(childId => {
                const childDepth = maxDepthMap.get(childId) || 1;
                if (currentDepth + 1 > childDepth) {
                    maxDepthMap.set(childId, currentDepth + 1);
                }
                
                const currentIn = inDegree.get(childId)! - 1;
                inDegree.set(childId, currentIn);
                
                const childEx = exercises.find(e => e.id === childId);
                if (currentIn === 0 && childEx) {
                    topoQueue.push(childEx);
                }
            });
        }
        
        const levelMap = new Map<number, Exercise[]>();
        exercises.forEach(ex => {
            const depth = maxDepthMap.get(ex.id) || 1;
            if (!levelMap.has(depth)) levelMap.set(depth, []);
            levelMap.get(depth)!.push(ex);
        });

        const sortedDepths = Array.from(levelMap.keys()).sort((a, b) => a - b);
        
        return sortedDepths.map(depth => ({
            difficulty: depth,
            nodes: levelMap.get(depth)!
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
            });
        });

        // Compute connections
        const connectionSet = new Set<string>();

        for (let levelIndex = 1; levelIndex < levels.length; levelIndex++) {
            const currentLevelNodes = layoutNodes.filter(n => n.y === PADDING_Y + levelIndex * VERTICAL_SPACING);
            const prevLevelNodes = layoutNodes.filter(n => n.y === PADDING_Y + (levelIndex - 1) * VERTICAL_SPACING);

                // Check every node in the current level against nodes in the previous level
            for (const parent of prevLevelNodes) {
                // Determine valid children from the parent's explicit nextVariations array
                const validChildrenIds = new Set(parent.exercise.nextVariations || []);
                
                for (const child of currentLevelNodes) {
                    if (validChildrenIds.has(child.exercise.id)) {
                        const key = `${parent.exercise.id}->${child.exercise.id}`;
                        if (!connectionSet.has(key)) {
                            connectionSet.add(key);
                            layoutConnections.push({
                                start: parent,
                                end: child,
                                isActivePath: false
                            });
                        }
                    }
                }
            }
        }

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
                            {renderConnections()}
                        </Svg>
                    </View>

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const isActive = node.exercise.id === activeId;
                        
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
                                            shadowOpacity: isActive ? 0.35 : 0.12,
                                            shadowRadius: isActive ? 5 : 3,
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
});
