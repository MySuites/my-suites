const baseColors = {
  light: {
    bgLight: 'hsl(0, 0%, 100%)', // Pure White
    bg: 'hsl(210, 40%, 98%)', // Cloud White
    bgDark: 'hsl(210, 40%, 96%)', // Vapor Grey
    text: 'hsl(222, 47%, 11%)', // Ink Black
    textMuted: 'hsl(215, 16%, 47%)', // Cool Grey
    icon: 'hsl(222, 47%, 11%)',
    tabIconDefault: 'hsl(215, 20%, 65%)',
    error: 'hsl(0, 84%, 60%)',
    border: 'hsl(214, 32%, 91%)', // Mist Grey
    highlight: 'hsla(0, 0%, 100%, 0.5)',
    info: 'hsl(217, 91%, 60%)',
    danger: 'hsl(0, 84%, 60%)',
    warning: 'hsl(42, 87%, 47%)', // Alert Amber
    success: 'hsl(160, 84%, 39%)', // Level Up Mint
    placeholder: 'hsl(215, 20%, 65%)',
  },
  dark: {
    bgLightest: 'hsl(215, 25%, 27%)', // Soft Steel
    bgLight: 'hsl(217, 33%, 17%)', // Lighter Slate (Card)
    bg: 'hsl(222, 47%, 11%)', // Deep Space
    bgDark: 'hsl(222, 47%, 5%)', // Extra Dark
    text: 'hsl(210, 40%, 98%)', // Bright White
    textMuted: 'hsl(215, 20%, 65%)', // Muted Grey
    icon: 'hsl(210, 40%, 98%)',
    tabIconDefault: 'hsl(215, 20%, 65%)',
    error: 'hsl(0, 84%, 60%)',
    border: 'hsl(215, 25%, 27%)', // Subtle Grey
    highlight: 'hsla(0, 0%, 100%, 0.15)',
    info: 'hsl(217, 91%, 60%)',
    danger: 'hsl(0, 84%, 60%)',
    warning: 'hsl(42, 87%, 47%)', // Alert Amber
    success: 'hsl(160, 84%, 39%)', // Level Up Mint
    placeholder: 'hsl(215, 20%, 65%)',
  }
};

const appThemes = {
  myhealth: {
    light: {
      primary: 'hsl(26, 100%, 50%)',
      primaryMuted: 'hsl(33, 100%, 96%)',
      accent: 'hsl(350, 89%, 60%)',
      solar: 'hsl(26, 100%, 50%)',
      neon: 'hsl(350, 89%, 60%)',
      electric: 'hsl(239, 84%, 67%)',
      mystic: 'hsl(271, 91%, 65%)',
      'level-up': 'hsl(160, 84%, 39%)',
      alert: 'hsl(42, 87%, 47%)',
      mental: 'hsl(239, 84%, 67%)',
      'mental-accent': 'hsl(271, 91%, 65%)',
    },
    dark: {
      primary: 'hsl(26, 100%, 50%)',
      primaryMuted: 'hsl(12, 80%, 15%)',
      accent: 'hsl(350, 89%, 60%)',
      solar: 'hsl(26, 100%, 50%)',
      neon: 'hsl(350, 89%, 60%)',
      electric: 'hsl(239, 84%, 67%)',
      mystic: 'hsl(271, 91%, 65%)',
      'level-up': 'hsl(160, 84%, 39%)',
      alert: 'hsl(42, 87%, 47%)',
      mental: 'hsl(239, 84%, 67%)',
      'mental-accent': 'hsl(271, 91%, 65%)',
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
