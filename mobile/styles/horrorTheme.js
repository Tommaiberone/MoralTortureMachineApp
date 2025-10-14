// styles/horrorTheme.js
// Shared Horror/Creepy Theme for Moral Torture Machine

export const HorrorColors = {
  // Dark, ominous backgrounds
  darkBlood: '#1A0000',
  deepDark: '#0D0D0D',
  charcoal: '#1C1C1C',
  voidBlack: '#000000',

  // Blood and danger colors
  bloodRed: '#8B0000',
  crimson: '#DC143C',
  darkCrimson: '#660000',
  rust: '#A0522D',

  // Eerie glows and accents
  eerieGreen: '#39FF14',
  toxicGreen: '#00FF00',
  ghostWhite: '#F8F8FF',
  paleYellow: '#FFFFE0',

  // Grays and shadows
  shadowGray: '#2B2B2B',
  fogGray: '#696969',
  ashGray: '#B2BEB5',

  // Creepy purples
  darkPurple: '#301934',
  bruisePurple: '#5C2E5C',

  // Warning/danger
  warningOrange: '#FF4500',
  dangerRed: '#FF0000',
};

export const HorrorGradients = {
  bloodDrip: [HorrorColors.darkBlood, HorrorColors.voidBlack],
  abyss: [HorrorColors.voidBlack, HorrorColors.charcoal, HorrorColors.voidBlack],
  crimsonNight: [HorrorColors.darkCrimson, HorrorColors.darkPurple],
  foggyDarkness: [HorrorColors.shadowGray, HorrorColors.deepDark],
  toxicGlow: [HorrorColors.darkBlood, HorrorColors.darkPurple, HorrorColors.voidBlack],
};

export const HorrorFonts = {
  title: 'Poppins_700Bold',
  body: 'Poppins_400Regular',
  emphasis: 'Poppins_600SemiBold',
};

export const HorrorShadows = {
  deep: {
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
  },
  ominous: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 20,
  },
  glow: {
    shadowColor: HorrorColors.eerieGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 25,
  },
  bloodGlow: {
    shadowColor: HorrorColors.bloodRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 15,
    elevation: 18,
  },
};

// Animation configuration
export const HorrorAnimations = {
  pulse: {
    duration: 1500,
    useNativeDriver: true,
  },
  flicker: {
    duration: 150,
    useNativeDriver: true,
  },
  shake: {
    duration: 500,
    useNativeDriver: true,
  },
  fadeIn: {
    duration: 800,
    useNativeDriver: true,
  },
  slowPulse: {
    duration: 3000,
    useNativeDriver: true,
  },
};

export const HorrorTextStyles = {
  scaryTitle: {
    fontSize: 36,
    fontFamily: HorrorFonts.title,
    color: HorrorColors.crimson,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: HorrorColors.bloodRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  ominousSubtitle: {
    fontSize: 18,
    fontFamily: HorrorFonts.emphasis,
    color: HorrorColors.ashGray,
    textAlign: 'center',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  creepyBody: {
    fontSize: 16,
    fontFamily: HorrorFonts.body,
    color: HorrorColors.ghostWhite,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  warningText: {
    fontSize: 14,
    fontFamily: HorrorFonts.emphasis,
    color: HorrorColors.warningOrange,
    textAlign: 'center',
  },
  ghostText: {
    fontSize: 16,
    fontFamily: HorrorFonts.body,
    color: HorrorColors.ghostWhite,
    opacity: 0.7,
  },
};

export const HorrorButtonStyles = {
  dangerButton: {
    backgroundColor: HorrorColors.bloodRed,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: HorrorColors.crimson,
    ...HorrorShadows.bloodGlow,
  },
  dangerButtonText: {
    color: HorrorColors.ghostWhite,
    fontSize: 18,
    fontFamily: HorrorFonts.emphasis,
    textAlign: 'center',
    letterSpacing: 1,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: HorrorColors.eerieGreen,
    ...HorrorShadows.glow,
  },
  ghostButtonText: {
    color: HorrorColors.eerieGreen,
    fontSize: 18,
    fontFamily: HorrorFonts.emphasis,
    textAlign: 'center',
    letterSpacing: 1,
  },
  ominousButton: {
    backgroundColor: HorrorColors.shadowGray,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: HorrorColors.fogGray,
    ...HorrorShadows.deep,
  },
  ominousButtonText: {
    color: HorrorColors.ghostWhite,
    fontSize: 18,
    fontFamily: HorrorFonts.emphasis,
    textAlign: 'center',
    letterSpacing: 1,
  },
};

export const HorrorCardStyles = {
  darkCard: {
    backgroundColor: HorrorColors.charcoal,
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: HorrorColors.bloodRed,
    ...HorrorShadows.ominous,
  },
  glowingCard: {
    backgroundColor: HorrorColors.shadowGray,
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: HorrorColors.eerieGreen,
    ...HorrorShadows.glow,
  },
  bloodCard: {
    backgroundColor: HorrorColors.darkBlood,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HorrorColors.crimson,
    ...HorrorShadows.bloodGlow,
  },
};

// Creepy loading messages
export const CreepyLoadingMessages = [
  "Extracting moral fibers...",
  "Torturing your conscience...",
  "Summoning ethical dilemmas...",
  "Analyzing your soul...",
  "Preparing psychological torment...",
  "Loading existential dread...",
  "Calculating moral decay...",
  "Harvesting ethical nightmares...",
  "Initializing guilt processor...",
  "Awakening dormant demons...",
];

// Get random creepy loading message
export const getCreepyMessage = () => {
  return CreepyLoadingMessages[Math.floor(Math.random() * CreepyLoadingMessages.length)];
};

// Utility function to create pulsing animation values
export const createPulseAnimation = (animatedValue) => {
  return {
    opacity: animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.4, 1, 0.4],
    }),
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.05, 1],
        }),
      },
    ],
  };
};

// Utility function to create shake animation values
export const createShakeAnimation = (animatedValue) => {
  return {
    transform: [
      {
        translateX: animatedValue.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange: [0, -10, 10, -10, 10, 0],
        }),
      },
    ],
  };
};

// Utility function to create flicker animation values
export const createFlickerAnimation = (animatedValue) => {
  return {
    opacity: animatedValue.interpolate({
      inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      outputRange: [1, 0.3, 1, 0.5, 1, 0.2, 1, 0.7, 1, 0.4, 1],
    }),
  };
};

export default {
  HorrorColors,
  HorrorGradients,
  HorrorFonts,
  HorrorShadows,
  HorrorAnimations,
  HorrorTextStyles,
  HorrorButtonStyles,
  HorrorCardStyles,
  CreepyLoadingMessages,
  getCreepyMessage,
  createPulseAnimation,
  createShakeAnimation,
  createFlickerAnimation,
};
