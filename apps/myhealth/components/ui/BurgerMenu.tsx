import React from 'react';
import { Text, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { RaisedCard, useUITheme, IconSymbol } from '@mysuite/ui';

export interface BurgerMenuItem {
    label: string;
    icon: string;
    route: string;
}

// Default items - used by any screen that doesn't pass its own `items`, and
// matches the original single hardcoded list this component used to always
// show everywhere.
const DEFAULT_ITEMS: BurgerMenuItem[] = [
    { label: 'Workout History', icon: 'clock.fill', route: '/history' },
    { label: 'Progress Pictures', icon: 'camera.fill', route: '/progress-pictures' },
    { label: 'Settings', icon: 'gearshape.fill', route: '/settings' },
];

interface BurgerMenuProps {
    visible: boolean;
    onClose: () => void;
    // Per-screen menu contents - each top-nav screen passes the items
    // relevant to it instead of every screen showing the same fixed list.
    items?: BurgerMenuItem[];
}

export function BurgerMenu({ visible, onClose, items = DEFAULT_ITEMS }: BurgerMenuProps) {
    const router = useRouter();
    const theme = useUITheme();

    if (!visible) return null;

    // Rendered in a native Modal rather than a plain absolutely-positioned
    // View: the minimized active-workout pill (ActiveWorkoutOverlay) is
    // mounted as a later top-level sibling in app/(tabs)/_layout.tsx, so it
    // always paints over this menu's own subtree no matter how high a
    // z-index is set locally — RN only orders zIndex among siblings sharing
    // the same parent. A Modal renders in its own native layer above the
    // entire RN view hierarchy, so it can't be covered by the pill.
    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="absolute top-0 bottom-0 left-0 right-0 bg-black/20"
                testID="burger-menu-backdrop"
            />
            <RaisedCard
                className="absolute bottom-24 right-4 w-52 p-2 bg-light dark:bg-dark-lighter origin-bottom-right rounded-xl"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 5
                }}
                testID="burger-menu-content"
            >
                {items.map((item) => (
                    <TouchableOpacity
                        key={item.route}
                        onPress={() => { onClose(); router.push(item.route as any); }}
                        className="flex-row items-center p-3 rounded-lg active:bg-black/5 dark:active:bg-white/5"
                    >
                        <IconSymbol name={item.icon as any} size={20} color={theme.text} style={{ marginRight: 12 }} />
                        <Text className="text-light dark:text-dark font-medium">{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </RaisedCard>
        </Modal>
    );
}
export default BurgerMenu;
