const baseColors = {
  light: {
    bgLight: 'hsl(0, 0%, 100%)',
    bg: 'hsl(0, 0%, 95%)',
    bgDark: 'hsl(0, 0%, 90%)',
    text: 'hsl(0, 0%, 5%)',
    textMuted: 'hsl(0, 0%, 30%)',
    icon: 'hsl(0, 0%, 5%)',
    tabIconDefault: 'hsl(0, 0%, 89%)',
    error: 'hsl(0, 84%, 60%)',
    border: 'hsl(0, 0%, 95%)',
    highlight: 'hsla(0, 0%, 100%, 0.5)',
    info: 'hsl(217, 91%, 60%)',
    danger: 'hsl(0, 84%, 60%)',
    warning: 'hsl(45, 93%, 40%)',
    success: 'hsl(142, 76%, 36%)',
    placeholder: 'hsl(0, 0%, 60%)',
  },
  dark: {
    bgLightest: 'hsl(0, 0%, 20%)',
    bgLight: 'hsl(0, 0%, 15%)',
    bg: 'hsl(0, 0%, 10%)',
    bgDark: 'hsl(0, 0%, 5%)',
    text: 'hsl(0, 0%, 95%)',
    textMuted: 'hsl(0, 0%, 70%)',
    icon: 'hsl(0, 0%, 95%)',
    tabIconDefault: 'hsl(0, 0%, 89%)',
    error: 'hsl(0, 84%, 60%)',
    border: 'hsl(0, 0%, 10%)',
    highlight: 'hsla(0, 0%, 100%, 0.15)',
    info: 'hsl(217, 91%, 60%)',
    danger: 'hsl(0, 84%, 60%)',
    warning: 'hsl(45, 93%, 47%)',
    success: 'hsl(142, 76%, 36%)',
    placeholder: 'hsl(0, 0%, 50%)',
  }
};

const appThemes = {
  myhealth: {
    light: {
      primary: 'hsl(8, 100%, 67%)',
      primaryMuted: 'hsl(8, 40%, 94%)',
      accent: 'hsl(117, 20%, 61%)',
    },
    dark: {
      primary: 'hsl(5, 100%, 75%)',
      primaryMuted: 'hsl(5, 40%, 15%)',
      accent: 'hsl(122, 37%, 74%)',
    }
  },
  myfinancials: {
    light: {
      primary: 'hsl(210, 100%, 50%)',
      primaryMuted: 'hsl(210, 40%, 94%)',
      accent: 'hsl(150, 40%, 40%)',
    },
    dark: {
      primary: 'hsl(210, 100%, 70%)',
      primaryMuted: 'hsl(210, 40%, 15%)',
      accent: 'hsl(150, 40%, 60%)',
    }
  }
};

module.exports = { baseColors, appThemes };
