import "@testing-library/jest-native/extend-expect";

(global as any).__DEV__ = true;

jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
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
