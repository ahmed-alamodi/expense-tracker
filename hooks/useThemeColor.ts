import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export function useThemeColor() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
