import { View, Text } from 'react-native';
import { useUITheme } from '../ThemeContext';

type ThemedCardProps = {
  title: string;
  subtitle?: string;
};

export const ThemedCard = ({ title, subtitle }: ThemedCardProps) => {
  return (
    <View className="p-3 rounded-[10px] my-2 border shadow-sm bg-light-lighter dark:bg-border-dark border-light dark:border-white/10">
      <Text className="text-base font-bold mb-1 text-apptext dark:text-dark">{title}</Text>
      {subtitle ? <Text className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</Text> : null}
    </View>
  );
};

export default ThemedCard;
