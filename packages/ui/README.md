# @mysuite/ui

This package contains shared UI primitives for the monorepo and a small example showing how apps can provide their own theme palette.

Key exports
- `RaisedCard` — a neumorphic card/button component using Tailwind tokens.
- `UIThemeProvider` — React provider that accepts a theme object and makes it available to shared components.
- `useUITheme()` — hook to access the runtime theme object (useful for `StyleSheet`-based components).
- `ThemedCard` — an example StyleSheet-based component under `examples/` showing `useUITheme()` usage.

Usage

1. App provides its palette (recommended):

```tsx
// apps/myhealth/app/providers/AppThemeProvider.tsx
import { UIThemeProvider } from '@mysuite/ui';
import { Colors } from '@/constants/theme';

// pass `Colors.light` or `Colors.dark` depending on color scheme
<UIThemeProvider value={Colors.light}>{children}</UIThemeProvider>
```

2. Consume the theme in shared components (StyleSheet example):

```tsx
import { useUITheme } from '@mysuite/ui';
const theme = useUITheme();
// theme.primary, theme.background, theme.text, theme.surface, ...
```

3. Use Tailwind tokens in components that render `className` (NativeWind):

```tsx
import { RaisedCard } from '@mysuite/ui';
<RaisedCard><Text>OK</Text></RaisedCard>
```

Notes
- Keep palettes per-app. App-level `tailwind.config.js` and `apps/<app>/constants/theme.ts` should define the app's tokens and pass the theme object to `UIThemeProvider`.
- The example `ThemedCard` shows how to build theme-aware StyleSheet styles.
