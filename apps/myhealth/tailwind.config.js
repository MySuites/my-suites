const { baseColors, appThemes } = require('../../packages/ui/colors');
const brand = appThemes.myhealth;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Snapped to Apple's canonical iOS text-style sizes (Human Interface
      // Guidelines > Typography) — Tailwind's own scale doesn't land on
      // these: base is 16px (Apple's Body/Headline is 17), sm is 14px
      // (Apple's Footnote is 13), lg is 18px (Apple's Callout is 16),
      // 2xl is 24px (Apple's Title2 is 22), 3xl is 30px (Apple's Title1 is
      // 28), 4xl is 36px (Apple's Large Title is 34).
      fontSize: {
        base: '17px',
        sm: '13px',
        lg: '16px',
        '2xl': '22px',
        '3xl': '28px',
        '4xl': '34px',
      },
      backgroundColor: {
        'lighter': baseColors.light.bgLight,
        'light': baseColors.light.bg,
        
        'dark-lightest': baseColors.dark.bgLightest,
        'dark-lighter': baseColors.dark.bgLight,
        'dark': baseColors.dark.bg,
        'dark-darker': baseColors.dark.bgDark,

        primary: brand.light.primary,
        'primary-muted': brand.light.primaryMuted,
        'primary-dark': brand.dark.primary,
        'primary-muted-dark': brand.dark.primaryMuted,
        accent: brand.light.accent,
        'accent-dark': brand.dark.accent,
      },
      textColor: {
        'light': baseColors.light.text,
        'light-muted': baseColors.light.textMuted,
        'light-subtle': baseColors.light.textSubtle,
        'dark': baseColors.dark.text,
        'dark-muted': baseColors.dark.textMuted,
        'dark-subtle': baseColors.dark.textSubtle,

        primary: brand.light.primary,
        'primary-muted': brand.light.primaryMuted,
        'primary-dark': brand.dark.primary,
        'primary-muted-dark': brand.dark.primaryMuted,
        accent: brand.light.accent,
        'accent-dark': brand.dark.accent,
      },
      borderColor: {
        'light': baseColors.light.border,
        'dark': baseColors.dark.border,

        primary: brand.light.primary,
        'primary-muted': brand.light.primaryMuted,
        'primary-dark': brand.dark.primary,
        'primary-muted-dark': brand.dark.primaryMuted,
        accent: brand.light.accent,
        'accent-dark': brand.dark.accent,

        'highlight': baseColors.light.highlight,
        'highlight-dark': baseColors.dark.highlight,
      },
      colors: {
        error: baseColors.light.error,
        info: baseColors.light.info,
        danger: baseColors.light.danger,
        warning: baseColors.light.warning,
        success: baseColors.light.success,
        solar: brand.light.solar,
        neon: brand.light.neon,
        electric: brand.light.electric,
        mystic: brand.light.mystic,
        'level-up': brand.light['level-up'],
        alert: brand.light.alert,
        mental: brand.light.mental,
        'mental-accent': brand.light['mental-accent'],
      },
    },
  },
  plugins: [],
};
