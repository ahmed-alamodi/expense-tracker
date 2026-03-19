import Colors from '@/constants/Colors';
import { useAppTheme } from '@/lib/theme-context';

export function useThemeColor() {
  const { colorScheme } = useAppTheme();
  return colorScheme === 'dark' ? Colors.dark : Colors.light;
}
