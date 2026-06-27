import * as React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';
import { useUITheme } from './ThemeContext';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const { width } = Dimensions.get('window');

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastOptions | null>(null);
  const theme = useUITheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const timerRef = React.useRef<any>(null);

  const hideToast = React.useCallback(() => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setToast)(null);
    });
  }, [translateY, opacity]);

  const showToast = React.useCallback((options: ToastOptions) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast(options);
    opacity.value = 0;
    translateY.value = -100;

    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(Platform.OS === 'ios' ? 60 : 40, {
      duration: 300,
    });

    timerRef.current = setTimeout(() => {
      hideToast();
    }, options.duration || 3000);
  }, [hideToast, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const getBackgroundColor = () => {
    if (!toast) return theme.primary;
    switch (toast.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return theme.primary;
      default: return theme.primary;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View 
          style={[
            styles.container, 
            { backgroundColor: getBackgroundColor() },
            animatedStyle
          ]}
        >
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 70,
    right: 70,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
