import "@testing-library/jest-native/extend-expect";

(global as any).__DEV__ = true;

jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock("expo-audio", () => ({
    useAudioPlayer: jest.fn(() => ({
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        seekTo: jest.fn(),
    })),
    AudioPlayer: jest.fn().mockImplementation(() => ({
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        seekTo: jest.fn(),
    })),
}));

jest.mock("@mysuite/auth", () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            onAuthStateChange: jest.fn(() => ({
                data: { subscription: { unsubscribe: jest.fn() } },
            })),
        },
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(),
                    maybeSingle: jest.fn(),
                })),
            })),
        })),
    },
    useAuth: jest.fn(() => ({ session: null, user: null })),
}));

jest.mock("expo-haptics", () => ({
    selectionAsync: jest.fn(),
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
}));

jest.mock(
    "@react-native-async-storage/async-storage",
    () =>
        require(
            "@react-native-async-storage/async-storage/jest/async-storage-mock",
        ),
);

jest.mock("expo-router", () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    })),
    useLocalSearchParams: jest.fn(() => ({})),
    usePathname: jest.fn(() => "/profile"),
    Stack: {
        Screen: jest.fn(() => null),
    },
}));

jest.mock("@mysuite/ui", () => ({
    useUITheme: () => ({
        primary: "blue",
        textMuted: "gray",
        icon: "gray",
        background: "white",
        bgLight: "lightgray",
    }),

    useToast: () => {
        // Return stable mock to prevent useEffect re-run loops
        const showToast = jest.fn();
        return { showToast };
    },
    IconSymbol: () => null,
    ToastProvider: ({ children }: any) => children || null,
    RaisedCard: ({ children }: any) => children || null,
    HollowedCard: ({ children }: any) => children || null,
    ThemeToggle: () => null,
}));

import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-safe-area-context', () => {
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    const SafeAreaProvider = ({ children }: any) => children;
    SafeAreaProvider.displayName = 'SafeAreaProvider';
    const SafeAreaView = ({ children }: any) => children;
    SafeAreaView.displayName = 'SafeAreaView';
    return {
        SafeAreaProvider,
        SafeAreaView,
        useSafeAreaInsets: () => inset,
        useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
        initialWindowMetrics: {
            frame: { x: 0, y: 0, width: 0, height: 0 },
            insets: inset,
        },
    };
});
