/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from "./use-color-scheme";
import { useUITheme } from "@mysuite/ui";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string,
) {
  const uiTheme = useUITheme();
  const scheme = useColorScheme() ?? "light";

  const colorFromProps = props[scheme];
  if (colorFromProps) return colorFromProps;

  // @ts-ignore
  if (uiTheme && uiTheme[colorName]) return uiTheme[colorName];

  return null;
}
