import { View, StyleSheet } from 'react-native';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function ProfileScreen() {
  return (
    <View className="bg-light dark:bg-dark" style={styles.container}>
      <ThemeToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
});
