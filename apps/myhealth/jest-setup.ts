import "@testing-library/jest-native/extend-expect";
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

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

jest.mock("expo-notifications", () => ({
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    scheduleNotificationAsync: jest.fn(() => Promise.resolve("mock-notification-id")),
    cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
    cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
    setNotificationHandler: jest.fn(),
}));

jest.mock(
    "@react-native-async-storage/async-storage",
    () => mockAsyncStorage,
);

jest.mock("expo-task-manager", () => ({
    defineTask: jest.fn(),
    isTaskDefined: jest.fn(() => false),
    isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
    unregisterTaskAsync: jest.fn(() => Promise.resolve()),
    unregisterAllTasksAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-location", () => ({
    Accuracy: { BestForNavigation: 6 },
    requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    requestBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    getBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    startLocationUpdatesAsync: jest.fn(() => Promise.resolve()),
    stopLocationUpdatesAsync: jest.fn(() => Promise.resolve()),
    hasStartedLocationUpdatesAsync: jest.fn(() => Promise.resolve(false)),
}));

jest.mock("react-native-maps", () => {
    const { View } = require("react-native");
    return {
        __esModule: true,
        default: View,
        Marker: View,
        Polyline: View,
    };
});

jest.mock("expo-router", () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        navigate: jest.fn(),
    })),
    useLocalSearchParams: jest.fn(() => ({})),
    usePathname: jest.fn(() => "/profile"),
    useFocusEffect: jest.fn(),
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

jest.mock('expo-file-system', () => ({
    documentDirectory: 'file:///mock-document-dir/',
    getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
    makeDirectoryAsync: jest.fn(() => Promise.resolve()),
    copyAsync: jest.fn(() => Promise.resolve()),
    deleteAsync: jest.fn(() => Promise.resolve()),
}));
