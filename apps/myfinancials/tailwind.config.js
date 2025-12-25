const { baseColors, appThemes } = require('../../packages/ui/colors');
const brand = appThemes.myfinancials;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      backgroundColor: {
        'light-lighter': baseColors.light.bgLight,
        'light': baseColors.light.bg,
        'light-darker': baseColors.light.bgDark,
        
        'dark-lighter': baseColors.dark.bgLight,
        'dark': baseColors.dark.bg,
        'dark-darker': baseColors.dark.bgDark,

        primary: brand.light.primary,
        'primary-dark': brand.dark.primary,
        accent: brand.light.accent,
        'accent-dark': brand.dark.accent,
      },
      textColor: {
        'light': baseColors.light.text,
        'light-muted': baseColors.light.textMuted,
        'dark': baseColors.dark.text,
        'dark-muted': baseColors.dark.textMuted,

        primary: brand.light.primary,
        'primary-dark': brand.dark.primary,
        accent: brand.light.accent,
        'accent-dark': brand.dark.accent,
      },
      borderColor: {
        'light': baseColors.light.border,
        'dark': baseColors.dark.border,

        primary: brand.light.primary,
        'primary-dark': brand.dark.primary,
        accent: brand.light.accent,
        'accent-dark': brand.dark.accent,

        'highlight': baseColors.light.highlight,
        'highlight-dark': baseColors.dark.highlight,
      },
      colors: {
        error: baseColors.light.error,
      },
    },
  },
  plugins: [],
};
